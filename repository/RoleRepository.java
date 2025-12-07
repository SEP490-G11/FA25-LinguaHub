package edu.lms.repository;

import edu.lms.entity.Role;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface RoleRepository extends JpaRepository<Role, String> {

    // Thêm dòng này
    Optional<Role> findByName(String name);
}
