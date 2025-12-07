package edu.lms.service;

import edu.lms.dto.request.*;
import edu.lms.dto.response.AuthenticationReponse;
import edu.lms.dto.response.IntrospectResponse;
import edu.lms.entity.*;
import edu.lms.exception.AppException;
import edu.lms.exception.ErrorCode;
import edu.lms.repository.*;
import jakarta.servlet.http.HttpSession;
import jakarta.transaction.Transactional;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.experimental.NonFinal;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import com.nimbusds.jose.*;
import com.nimbusds.jose.crypto.MACSigner;
import com.nimbusds.jose.crypto.MACVerifier;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;

import java.text.ParseException;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class AuthenticationService {

    final HttpSession session;
    RefreshTokenRepository refreshTokenRepository;
    TutorRepository tutorRepository;
    UserRepository userRepository;
    InvalidatedTokenRepository invalidatedTokenRepository;
    RoleRepository roleRepository;
    VerificationRepository verificationRepository;
    EmailService emailService;

    @NonFinal
    @Value("${jwt.signerKey}")
    protected String SIGNER_KEY;
    public void setSignerKey(String key) {
        this.SIGNER_KEY = key;
    }


    // ================= REGISTER =================
    @Transactional
    public void register(UserCreationRequest request) {
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new AppException(ErrorCode.EMAIL_EXISTED);
        }
        if (userRepository.findByUsername(request.getUsername()).isPresent()) {
            throw new AppException(ErrorCode.USER_EXISTED);
        }

        PasswordEncoder passwordEncoder = new BCryptPasswordEncoder(10);
        String hashedPassword = passwordEncoder.encode(request.getPassword());

        Role role = roleRepository.findByName("Learner")
                .orElseThrow(() -> new AppException(ErrorCode.ROLE_NOT_FOUND));

        String otp = String.valueOf(new Random().nextInt(900000) + 100000);
        emailService.sendOtp(request.getEmail(), otp);

        verificationRepository.deleteByEmail(request.getEmail());

        Verification verification = Verification.builder()
                .email(request.getEmail())
                .username(request.getUsername())
                .fullName(request.getFullName())
                .passwordHash(hashedPassword)
                .gender(request.getGender())
                .dob(request.getDob())
                .phone(request.getPhone())
                .country(request.getCountry())
                .address(request.getAddress())
                .bio(request.getBio())
                .otp(otp)
                .expiresAt(LocalDateTime.now().plusMinutes(5))
                .build();

        verificationRepository.save(verification);
        session.setAttribute("registerEmail", request.getEmail());
    }

    public void verifyEmail(String otp) {
        String email = (String) session.getAttribute("registerEmail");
        if (email == null) throw new AppException(ErrorCode.UNAUTHENTICATED);

        Verification verification = verificationRepository.findByEmailAndOtp(email, otp)
                .orElseThrow(() -> new AppException(ErrorCode.INVALID_OTP));

        if (verification.getExpiresAt().isBefore(LocalDateTime.now()))
            throw new AppException(ErrorCode.OTP_EXPIRED);

        Role role = roleRepository.findByName("Learner")
                .orElseThrow(() -> new AppException(ErrorCode.ROLE_NOT_FOUND));

        User user = User.builder()
                .email(verification.getEmail())
                .username(verification.getUsername())
                .fullName(verification.getFullName())
                .passwordHash(verification.getPasswordHash())
                .role(role)
                .gender(verification.getGender())
                .dob(verification.getDob())
                .phone(verification.getPhone())
                .country(verification.getCountry())
                .address(verification.getAddress())
                .bio(verification.getBio())
                .isActive(true)
                .build();

        userRepository.save(user);
        verificationRepository.delete(verification);
        session.removeAttribute("registerEmail");
    }

    // ================= LOGIN =================
    public AuthenticationReponse authenticate(AuthenticationRequest request) {
        PasswordEncoder passwordEncoder = new BCryptPasswordEncoder(10);

        User user = userRepository.findByEmail(request.getUsername())
                .or(() -> userRepository.findByUsername(request.getUsername()))
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXIST));

        if (!Boolean.TRUE.equals(user.getIsActive())) {
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }

        boolean authenticated = passwordEncoder.matches(request.getPassword(), user.getPasswordHash());
        if (!authenticated) throw new AppException(ErrorCode.INVALID_PASSWORD);

        // Generate tokens
        String accessToken = generateAccessToken(user);
        String refreshToken = generateRefreshToken(user);

        // Save refresh token into DB
        RefreshToken refreshEntity = RefreshToken.builder()
                .token(refreshToken)
                .user(user)
                .expiryDate(Instant.now().plus(7, ChronoUnit.DAYS))
                .revoked(false)
                .build();
        refreshTokenRepository.save(refreshEntity);

        return AuthenticationReponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .authenticated(true)
                .build();
    }

    // ================= TOKEN GENERATORS =================
    public String generateAccessToken(User user) {
        JWSHeader header = new JWSHeader(JWSAlgorithm.HS512);

        // Permissions
        List<String> permissions = user.getRole().getPermissions()
                .stream()
                .map(Permission::getName)
                .collect(Collectors.toList());

        // Base claims
        JWTClaimsSet.Builder claimBuilder = new JWTClaimsSet.Builder()
                .subject(StringUtils.hasText(user.getEmail()) ? user.getEmail() : user.getUsername())
                .issuer("linguahub.com")
                .issueTime(new Date())
                .expirationTime(Date.from(Instant.now().plus(1, ChronoUnit.HOURS))) // 1 hour
                .jwtID(UUID.randomUUID().toString())
                .claim("role", user.getRole().getName())
                .claim("permissions", permissions)
                .claim("userId", user.getUserID());

        // 🔥 Nếu user là Tutor → thêm tutorId
        if ("Tutor".equalsIgnoreCase(user.getRole().getName())) {
            Tutor tutor = tutorRepository.findByUser(user)
                    .orElseThrow(() -> new AppException(ErrorCode.TUTOR_NOT_FOUND));

            claimBuilder.claim("tutorId", tutor.getTutorID());
        }

        JWTClaimsSet claims = claimBuilder.build();

        log.warn("GENERATE SIGNER KEY=" + SIGNER_KEY);

        try {
            JWSObject jwsObject = new JWSObject(header, new Payload(claims.toJSONObject()));
            jwsObject.sign(new MACSigner(SIGNER_KEY.getBytes()));
            return jwsObject.serialize();
        } catch (JOSEException e) {
            throw new RuntimeException("Failed to create access token", e);
        }
    }

    public String generateRefreshToken(User user) {
        JWSHeader header = new JWSHeader(JWSAlgorithm.HS512);

        JWTClaimsSet claims = new JWTClaimsSet.Builder()
                .subject(StringUtils.hasText(user.getEmail()) ? user.getEmail() : user.getUsername())
                .issuer("linguahub.com")
                .issueTime(new Date())
                .expirationTime(Date.from(Instant.now().plus(7, ChronoUnit.DAYS)))
                .jwtID(UUID.randomUUID().toString())
                .build();

        try {
            JWSObject jwsObject = new JWSObject(header, new Payload(claims.toJSONObject()));
            jwsObject.sign(new MACSigner(SIGNER_KEY.getBytes()));
            return jwsObject.serialize();
        } catch (JOSEException e) {
            throw new RuntimeException("Failed to create refresh token", e);
        }
    }

    // ================= REFRESH NEW ACCESS TOKEN WHEN CURRENT ACCESS TOKEN EXPIRED =================
    public AuthenticationReponse refreshToken(String refreshToken) {
        RefreshToken storedToken = refreshTokenRepository.findByToken(refreshToken)
                .orElseThrow(() -> new AppException(ErrorCode.UNAUTHENTICATED));

        if (storedToken.isRevoked() || storedToken.getExpiryDate().isBefore(Instant.now())) {
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }

        User user = storedToken.getUser();
        String newAccessToken = generateAccessToken(user);

        return AuthenticationReponse.builder()
                .accessToken(newAccessToken)
                .refreshToken(refreshToken)
                .authenticated(true)
                .build();
    }

    // ================= LOGOUT =================
    public void logout(LogoutRequest request) throws ParseException, JOSEException {
        var signedToken = verifyToken(request.getToken());
        String jit = signedToken.getJWTClaimsSet().getJWTID();
        Date expirationDate = signedToken.getJWTClaimsSet().getExpirationTime();

        InvalidatedToken invalidatedToken = InvalidatedToken.builder()
                .id(jit)
                .expiryTime(expirationDate)
                .build();

        invalidatedTokenRepository.save(invalidatedToken);

        // revoke refresh token in DB
        refreshTokenRepository.findByToken(request.getToken())
                .ifPresent(token -> {
                    token.setRevoked(true);
                    refreshTokenRepository.save(token);
                });
    }

    // ================= VERIFY TOKEN =================
    private SignedJWT verifyToken(String token) throws ParseException, JOSEException {
        JWSVerifier verifier = new MACVerifier(SIGNER_KEY.getBytes());
        SignedJWT signedJWT = SignedJWT.parse(token);

        Date exp = signedJWT.getJWTClaimsSet().getExpirationTime();
        boolean verified = signedJWT.verify(verifier);

        if (!(verified && exp.after(new Date())))
            throw new AppException(ErrorCode.UNAUTHENTICATED);

        if (invalidatedTokenRepository.existsById(signedJWT.getJWTClaimsSet().getJWTID()))
            throw new AppException(ErrorCode.UNAUTHENTICATED);

        return signedJWT;
    }

    // ================= INTROSPECT =================
    public IntrospectResponse introspect(IntrospectRequest request) throws JOSEException, ParseException {
        var token = request.getToken();
        try {
            verifyToken(token);
        } catch (AppException e) {
            return IntrospectResponse.builder().valid(false).build();
        }
        return IntrospectResponse.builder().valid(true).build();
    }
// ================= FORGOT / RESET PASSWORD =================
    @Transactional
    public void forgotPassword(ForgotPasswordRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXIST));

        String otp = String.valueOf(new Random().nextInt(900000) + 100000);
        emailService.sendOtp(user.getEmail(), otp);

        verificationRepository.deleteByEmail(user.getEmail());

        Verification verification = Verification.builder()
                .email(user.getEmail())
                .otp(otp)
                .expiresAt(LocalDateTime.now().plusMinutes(5))
                .build();
        verificationRepository.save(verification);

        session.setAttribute("resetEmail", user.getEmail());
    }
    @Transactional
    public void verifyResetOtp(VerifyResetOtpRequest request) {
        String email = (String) session.getAttribute("resetEmail");
        if (email == null) throw new AppException(ErrorCode.UNAUTHENTICATED);

        Verification verification = verificationRepository
                .findByEmailAndOtp(email, request.getOtp())
                .orElseThrow(() -> new AppException(ErrorCode.INVALID_OTP));

        if (verification.getExpiresAt().isBefore(LocalDateTime.now()))
            throw new AppException(ErrorCode.OTP_EXPIRED);

        session.setAttribute("resetOtp", request.getOtp());
    }

    @Transactional
    public void setNewPassword(SetNewPasswordRequest request) {
        String email = (String) session.getAttribute("resetEmail");
        String otp = (String) session.getAttribute("resetOtp");

        if (email == null || otp == null)
            throw new AppException(ErrorCode.UNAUTHENTICATED);

        Verification verification = verificationRepository
                .findByEmailAndOtp(email, otp)
                .orElseThrow(() -> new AppException(ErrorCode.INVALID_OTP));

        if (!request.getNewPassword().equals(request.getConfirmPassword()))
            throw new AppException(ErrorCode.PASSWORD_NOT_MATCH);

        PasswordEncoder encoder = new BCryptPasswordEncoder(10);
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXIST));

        user.setPasswordHash(encoder.encode(request.getNewPassword()));
        userRepository.save(user);
        verificationRepository.delete(verification);

        session.removeAttribute("resetEmail");
        session.removeAttribute("resetOtp");
    }
}
