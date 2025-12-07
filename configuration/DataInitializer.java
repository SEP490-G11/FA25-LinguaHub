package edu.lms.configuration;

import edu.lms.entity.Permission;
import edu.lms.entity.Role;
import edu.lms.entity.Setting;
import edu.lms.repository.PermissionRepository;
import edu.lms.repository.RoleRepository;
import edu.lms.repository.SettingRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.HashSet;
import java.util.List;

@Component
@RequiredArgsConstructor
public class DataInitializer {

    private final RoleRepository roleRepository;
    private final PermissionRepository permissionRepository;
    private final SettingRepository settingRepository;   // <-- ADD THIS

    @EventListener(ApplicationReadyEvent.class)
    @Transactional
    public void initData() {

        // ===========================================================
        // 1. ROLES & PERMISSIONS (phần cũ của bạn)
        // ===========================================================

        Role admin = roleRepository.findById("Admin").orElseGet(() ->
                roleRepository.save(Role.builder()
                        .name("Admin")
                        .description("System administrator - Full access")
                        .permissions(new HashSet<>())
                        .build())
        );

        Role tutor = roleRepository.findById("Tutor").orElseGet(() ->
                roleRepository.save(Role.builder()
                        .name("Tutor")
                        .description("Course creator / Instructor")
                        .permissions(new HashSet<>())
                        .build())
        );

        Role learner = roleRepository.findById("Learner").orElseGet(() ->
                roleRepository.save(Role.builder()
                        .name("Learner")
                        .description("Regular student user")
                        .permissions(new HashSet<>())
                        .build())
        );


        List<Permission> defaultPermissions = List.of(
                new Permission("CREATE_USER", "Create new users"),
                new Permission("VIEW_USER", "View user list"),
                new Permission("UPDATE_USER", "Update user info"),
                new Permission("DELETE_USER", "Delete users"),
                new Permission("CHANGE_PASSWORD", "Change your password"),

                new Permission("CREATE_ROLE", "Create new roles"),
                new Permission("VIEW_ROLE", "View all roles"),
                new Permission("UPDATE_ROLE", "Update existing role"),
                new Permission("DELETE_ROLE", "Delete a role"),

                new Permission("CREATE_PERMISSION", "Create new permissions"),
                new Permission("VIEW_PERMISSION", "View permission list"),
                new Permission("DELETE_PERMISSION", "Delete permissions"),

                new Permission("LOGIN", "Login to the system"),
                new Permission("LOGOUT", "Logout from the system"),
                new Permission("INTROSPECT_TOKEN", "Check token validity"),

                new Permission("MANAGE_COURSES", "Manage all courses"),
                new Permission("MANAGE_LESSON", "Manage lessons and lesson resources"),
                new Permission("VIEW_REPORTS", "View system reports"),
                new Permission("APPLY_TUTOR", "Apply to become a tutor"),

                new Permission("VIEW_TUTOR_APPLICATIONS", "View tutor applications"),
                new Permission("APPROVE_TUTOR", "Approve tutor applications"),
                new Permission("REJECT_TUTOR", "Reject tutor applications"),
                new Permission("SUSPEND_TUTOR", "Suspend tutor accounts"),
                new Permission("ACTIVATE_TUTOR", "Activate suspended tutors"),
                new Permission("UPDATE_TUTOR_INFO", "Update tutor information"),
                new Permission("VIEW_TUTOR_STATUS", "View own tutor application status")
        );

        for (Permission p : defaultPermissions) {
            if (!permissionRepository.existsById(p.getName())) {
                permissionRepository.save(p);
            }
        }

        admin.getPermissions().addAll(permissionRepository.findAll());

        tutor.getPermissions().add(permissionRepository.findById("VIEW_USER").orElseThrow());
        tutor.getPermissions().add(permissionRepository.findById("UPDATE_USER").orElseThrow());
        tutor.getPermissions().add(permissionRepository.findById("MANAGE_COURSES").orElseThrow());
        tutor.getPermissions().add(permissionRepository.findById("MANAGE_LESSON").orElseThrow());
        tutor.getPermissions().add(permissionRepository.findById("VIEW_ROLE").orElseThrow());
        tutor.getPermissions().add(permissionRepository.findById("VIEW_PERMISSION").orElseThrow());
        tutor.getPermissions().add(permissionRepository.findById("VIEW_TUTOR_STATUS").orElseThrow());
        tutor.getPermissions().add(permissionRepository.findById("CHANGE_PASSWORD").orElseThrow());

        learner.getPermissions().add(permissionRepository.findById("VIEW_USER").orElseThrow());
        learner.getPermissions().add(permissionRepository.findById("APPLY_TUTOR").orElseThrow());
        learner.getPermissions().add(permissionRepository.findById("LOGIN").orElseThrow());
        learner.getPermissions().add(permissionRepository.findById("LOGOUT").orElseThrow());
        learner.getPermissions().add(permissionRepository.findById("CHANGE_PASSWORD").orElseThrow());

        roleRepository.saveAll(List.of(admin, tutor, learner));


        // ===========================================================
        // 2. INITIALIZE SETTING (NEW PART)
        // ===========================================================

        Setting setting = settingRepository.findById(1L).orElse(null);

        if (setting == null) {
            setting = Setting.builder()
                    .commissionCourse(new BigDecimal("0.10"))
                    .commissionBooking(new BigDecimal("0.10"))
                    .build();

            settingRepository.save(setting);

            System.out.println(">>> Default Setting created!");
        } else {
            System.out.println(">>> Setting already exists → skipped.");
        }
    }
}
