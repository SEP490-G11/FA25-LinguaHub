package edu.lms.service;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import edu.lms.dto.response.AuthResponse;
import edu.lms.entity.Role;
import edu.lms.entity.User;
import edu.lms.repository.RoleRepository;
import edu.lms.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.Collections;

@Slf4j
@Service
@RequiredArgsConstructor
public class GoogleAuthService {

    private final UserRepository userRepository;
    private final AuthenticationService authenticationService;
    private final RoleRepository roleRepository;

    @Value("${google.client-id}")
    private String clientId;

    public AuthResponse loginWithGoogle(String idTokenString) {
        try {
            //1. Xác thực id_token với Google
            GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(
                    new NetHttpTransport(),
                    new GsonFactory()
            ).setAudience(Collections.singletonList(clientId)).build();

            GoogleIdToken idToken = verifier.verify(idTokenString);
            if (idToken == null) {
                throw new IllegalArgumentException("Invalid Google ID token");
            }

            //2. Lấy thông tin người dùng từ token
            GoogleIdToken.Payload payload = idToken.getPayload();
            String email = payload.getEmail();
            String name = (String) payload.get("name");
            String pictureUrl = (String) payload.get("picture");

            //3. Kiểm tra hoặc tạo mới người dùng
            Role learnerRole = roleRepository.findById("Learner")
                    .orElseThrow(() -> new RuntimeException("Role 'Learner' not found"));

            User user = userRepository.findByEmail(email).orElseGet(() -> {
                User newUser = User.builder()
                        .email(email)
                        .fullName(name)
                        .avatarURL(pictureUrl)
                        .role(learnerRole)
                        .isActive(true)
                        .passwordHash("GOOGLE_USER") //tránh null cho password_hash
                        .build();
                return userRepository.save(newUser);
            });

            //4. Cập nhật avatar nếu trước đó user chưa có hoặc Google avatar thay đổi
            if (user.getAvatarURL() == null || !user.getAvatarURL().equals(pictureUrl)) {
                user.setAvatarURL(pictureUrl);
                userRepository.save(user);
            }

            //5. Sinh JWT nội bộ của hệ thống
            String jwt = authenticationService.generateAccessToken(user);

            //6. Trả dữ liệu cho FE
            return AuthResponse.builder()
                    .token(jwt)
                    .email(user.getEmail())
                    .fullName(user.getFullName())
                    .avatarURL(user.getAvatarURL())
                    .build();

        } catch (Exception e) {
            log.error("Google login failed: {}", e.getMessage(), e);
            throw new RuntimeException("Google authentication failed");
        }
    }
}
