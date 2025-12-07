package edu.lms.configuration;

import edu.lms.entity.Role;
import edu.lms.entity.User;
import edu.lms.repository.RoleRepository;
import edu.lms.repository.UserRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.HashSet;

@Configuration
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class ApplicationInitConfig {

    PasswordEncoder passwordEncoder;
    RoleRepository roleRepository;

    @Bean
    ApplicationRunner applicationRunner(UserRepository userRepository) {
        return args -> {


            Role adminRole = roleRepository.findById("Admin")
                    .orElseGet(() -> {
                        Role newAdminRole = Role.builder()
                                .name("Admin")
                                .description("System administrator")
                                .permissions(new HashSet<>())
                                .build();
                        roleRepository.save(newAdminRole);
                        log.info("Created missing role: Admin");
                        return newAdminRole;
                    });

            if (userRepository.findByUsername("admin").isEmpty()) {
                User admin = User.builder()
                        .username("admin")
                        .email("admin@linguahub.com")
                        .fullName("System Administrator")
                        .passwordHash(passwordEncoder.encode("admin"))
                        .role(adminRole)
                        .isActive(true)
                        .build();

                userRepository.save(admin);
                log.warn("Default admin account created: [admin@linguahub.com / admin]");
            } else {
                log.info("Admin user already exists, skipping creation");
            }
        };
    }
}
