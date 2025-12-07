package edu.lms.service;

import edu.lms.dto.request.ChangePasswordRequest;
import edu.lms.dto.request.UserCreationRequest;
import edu.lms.dto.response.UserResponse;
import edu.lms.entity.Role;
import edu.lms.entity.User;
import edu.lms.enums.Gender;
import edu.lms.exception.AppException;
import edu.lms.exception.ErrorCode;
import edu.lms.mapper.UserMapping;
import edu.lms.repository.RoleRepository;
import edu.lms.repository.UserRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.access.prepost.PostAuthorize;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class UserService {

    UserRepository userRepository;
    RoleRepository roleRepository; //Thêm dòng này
    UserMapping userMapping;
    PasswordEncoder passwordEncoder;

    //1. Tạo user mới (default role: Learner)
    public UserResponse createUser(UserCreationRequest request) {
        User user = userMapping.toUser(request);
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));

        //Gán role mặc định từ DB
        Role learnerRole = roleRepository.findById("Learner")
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXIST));
        user.setRole(learnerRole);

        try {
            user = userRepository.save(user);
        } catch (DataIntegrityViolationException e) {
            throw new AppException(ErrorCode.USER_EXISTED);
        }

        return userMapping.toUserResponse(user);
    }

    //2. Chỉ Admin mới được xem danh sách user
    @PreAuthorize("hasAuthority('VIEW_USER')")
    public List<UserResponse> getUsers() {
        log.info("Fetching all users...");
        return userRepository.findAll()
                .stream()
                .map(userMapping::toUserResponse)
                .toList();
    }

    //3. Lấy user theo ID (chỉ Admin)
    @PostAuthorize("hasAuthority('VIEW_USER')")
    public UserResponse getUser(Long id) {
        log.info("Fetching user by ID...");
        User user = userRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXIST));
        return userMapping.toUserResponse(user);
    }

    //4. Lấy thông tin user hiện tại (qua token)
    public UserResponse getMyInfo() {
        String principal = SecurityContextHolder.getContext().getAuthentication().getName();
        log.info("Fetching info for current user: {}", principal);

        User user = userRepository.findByEmail(principal)
                .or(() -> userRepository.findByUsername(principal))
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXIST));

        return userMapping.toUserResponse(user);
    }

    //5. Update từng field linh hoạt (PATCH)
    public UserResponse updateUserFields(Long userID, Map<String, Object> updates) {
        User user = userRepository.findById(userID)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXIST));

        updates.forEach((field, value) -> {
            switch (field) {
                case "fullName" -> user.setFullName((String) value);
                case "country" -> user.setCountry((String) value);
                case "address" -> user.setAddress((String) value);
                case "phone" -> user.setPhone((String) value);
                case "bio" -> user.setBio((String) value);
                case "dob" -> user.setDob(LocalDate.parse((String) value));
                case "avatarURL" -> user.setAvatarURL((String) value);
                case "gender" -> user.setGender((Gender) value);
                default -> throw new RuntimeException("Field '" + field + "' not updatable");
            }
        });

        userRepository.save(user);
        return userMapping.toUserResponse(user);
    }

    //6. Xóa user (chỉ Admin)
//    @PreAuthorize("hasAuthority('DELETE_USER')")
//    public void deleteUser(Long userId) {
//        if (!userRepository.existsById(userId)) {
//            throw new AppException(ErrorCode.USER_NOT_EXIST);
//        }
//        userRepository.deleteById(userId);
//    }
    @PreAuthorize("hasAuthority('DELETE_USER')")
    public void deleteUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXIST));


        user.setIsActive(false);
        userRepository.save(user);
    }

    public void changePassword(ChangePasswordRequest request) {
        String currentEmail = SecurityContextHolder.getContext().getAuthentication().getName();

        User user = userRepository.findByEmail(currentEmail)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXIST));

        PasswordEncoder encoder = new BCryptPasswordEncoder(10);

        if (!encoder.matches(request.getOldPassword(), user.getPasswordHash())) {
            throw new AppException(ErrorCode.PASSWORD_ENABLED);
        }

        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new AppException(ErrorCode.PASSWORD_NOT_MATCH);
        }

        user.setPasswordHash(encoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }
}
