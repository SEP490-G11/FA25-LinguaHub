package edu.lms.service;

import edu.lms.dto.request.RoleRequest;
import edu.lms.dto.response.RoleResponse;
import edu.lms.entity.Permission;
import edu.lms.entity.Role;
import edu.lms.mapper.RoleMapper;
import edu.lms.repository.PermissionRepository;
import edu.lms.repository.RoleRepository;
import lombok.AccessLevel;
import lombok.experimental.FieldDefaults;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * C  : RoleService
 * Method : updateRole (RoleService.update)
 *
 * Test requirement:
 *   Verify updating user role (Learner / Tutor / Admin), including:
 *   - Role existence checking
 *   - Permission validation (valid / invalid permission IDs)
 *   - Updating description / permissions theo rule:
 *       + description != null  -> cập nhật
 *       + description == null  -> giữ nguyên
 *       + permissions != null & !empty -> load từ DB, validate, cập nhật
 *       + permissions == null or empty -> giữ nguyên
 *
 * Các test case theo bảng:
 *   - UTCID01 → UTCID07, Type (N/A/B), có Precondition / Input / Expected rõ ràng.
 */
@ExtendWith(MockitoExtension.class)
@FieldDefaults(level = AccessLevel.PRIVATE)
class RoleServiceTest {

    @Mock
    RoleRepository roleRepository;

    @Mock
    RoleMapper roleMapper;

    @Mock
    PermissionRepository permissionRepository;

    @InjectMocks
    RoleService roleService;

    // Helper tạo Permission theo name
    private Permission permission(String name) {
        Permission p = new Permission();
        p.setName(name);
        return p;
    }

    // Helper tạo RoleResponse từ Role (đủ để test, không quá chi tiết)
    private void mockRoleMapperToEcho() {
        when(roleMapper.toRoleResponse(any(Role.class))).thenAnswer(invocation -> {
            Role r = invocation.getArgument(0);
            return RoleResponse.builder()
                    .name(r.getName())
                    .description(r.getDescription())
                    // chỉ map tên permission cho đơn giản trong unit test
                    .permissions(null)
                    .build();
        });
    }

    @Nested
    @DisplayName("RoleService.update - theo bảng updateRole (UTCID01-UTCID07)")
    class UpdateRoleTests {

        /**
         * UTCID01
         * Type: A (Abnormal)
         * Precondition:
         *   - Không có role nào tên "MANAGER" trong database.
         * Input:
         *   - roleName = "MANAGER"
         *   - request:
         *       description = "New Description"
         *       permissions = {"P1"}
         * Expected:
         *   - Throw IllegalArgumentException("Role not found: MANAGER")
         *   - Không gọi permissionRepository.findAllById
         *   - Không gọi roleRepository.save
         */
        @Test
        @DisplayName("UTCID01 - A: Role MANAGER không tồn tại -> IllegalArgumentException(Role not found)")
        void updateRole_roleNotFound_MANAGER_shouldThrow() {
            String roleName = "MANAGER";

            when(roleRepository.findById(roleName)).thenReturn(Optional.empty());

            RoleRequest request = RoleRequest.builder()
                    .name(roleName)
                    .description("New Description")
                    .permissions(Set.of("P1"))
                    .build();

            IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                    () -> roleService.update(roleName, request));

            assertEquals("Role not found: MANAGER", ex.getMessage());
            verify(permissionRepository, never()).findAllById(any());
            verify(roleRepository, never()).save(any(Role.class));
        }

        /**
         * UTCID02
         * Type: N (Normal)
         * Precondition:
         *   - Có role trong DB:
         *       name = "ADMIN"
         *       description = "System Administrator"
         *       permissions = { "P1", "P2" }
         * Input:
         *   - roleName = "ADMIN"
         *   - request:
         *       description = null  (không muốn đổi mô tả)
         *       permissions = null  (không muốn đổi permissions)
         * Expected:
         *   - Role giữ nguyên:
         *       name = "ADMIN"
         *       description = "System Administrator"
         *       permissions = { "P1", "P2" }
         *   - Không gọi permissionRepository.findAllById
         *   - Có gọi roleRepository.save với role đã unchanged
         */
        @Test
        @DisplayName("UTCID02 - N: ADMIN với description=null, permissions=null -> giữ nguyên role")
        void updateRole_admin_nullDescAndPerms_shouldKeepOriginal() {
            // Precondition: role ADMIN tồn tại với desc và perms ban đầu
            Permission p1 = permission("P1");
            Permission p2 = permission("P2");

            Role admin = new Role();
            admin.setName("ADMIN");
            admin.setDescription("System Administrator");
            admin.setPermissions(new HashSet<>(Set.of(p1, p2)));

            when(roleRepository.findById("ADMIN")).thenReturn(Optional.of(admin));
            when(roleRepository.save(any(Role.class))).thenAnswer(inv -> inv.getArgument(0));
            mockRoleMapperToEcho();

            RoleRequest request = RoleRequest.builder()
                    .description(null)
                    .permissions(null)
                    .build();

            RoleResponse res = roleService.update("ADMIN", request);

            // Assert giữ nguyên
            assertEquals("ADMIN", admin.getName());
            assertEquals("System Administrator", admin.getDescription());
            assertEquals(2, admin.getPermissions().size());
            assertTrue(admin.getPermissions().contains(p1));
            assertTrue(admin.getPermissions().contains(p2));

            verify(permissionRepository, never()).findAllById(any());
            verify(roleRepository).save(admin);
            assertEquals("ADMIN", res.getName());
            assertEquals("System Administrator", res.getDescription());
        }

        /**
         * UTCID03
         * Type: A (trong bảng ghi A nhưng thực chất là case cập nhật bình thường)
         * Precondition:
         *   - Có role trong DB:
         *       name = "TUTOR"
         *       description = "Tutor role"
         *       permissions = { "P3" }
         * Input:
         *   - roleName = "TUTOR"
         *   - request:
         *       description = "Updated tutor desc"
         *       permissions = null (không đổi permission)
         * Expected:
         *   - description được cập nhật thành "Updated tutor desc"
         *   - permissions vẫn giữ nguyên { "P3" }
         *   - Không gọi permissionRepository.findAllById
         */
        @Test
        @DisplayName("UTCID03 - (A trong bảng) Cập nhật description TUTOR, giữ nguyên permissions")
        void updateRole_tutor_updateDescriptionOnly() {
            Permission p3 = permission("P3");

            Role tutor = new Role();
            tutor.setName("TUTOR");
            tutor.setDescription("Tutor role");
            tutor.setPermissions(new HashSet<>(Set.of(p3)));

            when(roleRepository.findById("TUTOR")).thenReturn(Optional.of(tutor));
            when(roleRepository.save(any(Role.class))).thenAnswer(inv -> inv.getArgument(0));
            mockRoleMapperToEcho();

            RoleRequest request = RoleRequest.builder()
                    .description("Updated tutor desc")
                    .permissions(null)
                    .build();

            RoleResponse res = roleService.update("TUTOR", request);

            assertEquals("TUTOR", tutor.getName());
            assertEquals("Updated tutor desc", tutor.getDescription());
            assertEquals(1, tutor.getPermissions().size());
            assertTrue(tutor.getPermissions().contains(p3));

            verify(permissionRepository, never()).findAllById(any());
            verify(roleRepository).save(tutor);
            assertEquals("Updated tutor desc", res.getDescription());
        }

        /**
         * UTCID04
         * Type: A (trong bảng, nhưng logic là case cập nhật bình thường)
         * Precondition:
         *   - Có role trong DB:
         *       name = "LEARNER"
         *       description = null
         *       permissions = null
         * Input:
         *   - roleName = "LEARNER"
         *   - request:
         *       description = null          (không đổi description)
         *       permissions = { "P1" }      (muốn set permission = P1)
         * Expected:
         *   - description vẫn null
         *   - permissions được cập nhật thành { "P1" }
         */
        @Test
        @DisplayName("UTCID04 - (A trong bảng) LEARNER: giữ description null, set permissions = P1")
        void updateRole_learner_updatePermissionsOnly() {
            Role learner = new Role();
            learner.setName("LEARNER");
            learner.setDescription(null);
            learner.setPermissions(null); // ban đầu chưa có quyền

            Permission p1 = permission("P1");

            when(roleRepository.findById("LEARNER")).thenReturn(Optional.of(learner));
            when(permissionRepository.findAllById(Set.of("P1")))
                    .thenReturn(List.of(p1));
            when(roleRepository.save(any(Role.class))).thenAnswer(inv -> inv.getArgument(0));
            mockRoleMapperToEcho();

            RoleRequest request = RoleRequest.builder()
                    .description(null)
                    .permissions(Set.of("P1"))
                    .build();

            RoleResponse res = roleService.update("LEARNER", request);

            assertNull(learner.getDescription());
            assertNotNull(learner.getPermissions());
            assertEquals(1, learner.getPermissions().size());
            assertTrue(learner.getPermissions().contains(p1));

            verify(permissionRepository).findAllById(Set.of("P1"));
            verify(roleRepository).save(learner);
            assertNull(res.getDescription());
        }

        /**
         * UTCID05
         * Type: N (Normal)
         * Precondition:
         *   - Có role trong DB:
         *       name = "ADMIN"
         *       description = "System Administrator"
         *       permissions = { "P1", "P2" }
         * Input:
         *   - roleName = "ADMIN"
         *   - request:
         *       description = "New Description"
         *       permissions = { "P1" }
         * Expected:
         *   - Role sau update:
         *       name = "ADMIN"
         *       description = "New Description"
         *       permissions = { "P1" }
         */
        @Test
        @DisplayName("UTCID05 - N: ADMIN cập nhật description + permissions = {P1}")
        void updateRole_admin_updateDescAndPermissions() {
            Permission p1 = permission("P1");
            Permission p2 = permission("P2");

            Role admin = new Role();
            admin.setName("ADMIN");
            admin.setDescription("System Administrator");
            admin.setPermissions(new HashSet<>(Set.of(p1, p2)));

            when(roleRepository.findById("ADMIN")).thenReturn(Optional.of(admin));
            when(permissionRepository.findAllById(Set.of("P1")))
                    .thenReturn(List.of(p1));
            when(roleRepository.save(any(Role.class))).thenAnswer(inv -> inv.getArgument(0));
            mockRoleMapperToEcho();

            RoleRequest request = RoleRequest.builder()
                    .description("New Description")
                    .permissions(Set.of("P1"))
                    .build();

            RoleResponse res = roleService.update("ADMIN", request);

            assertEquals("New Description", admin.getDescription());
            assertEquals(1, admin.getPermissions().size());
            assertTrue(admin.getPermissions().contains(p1));

            verify(permissionRepository).findAllById(Set.of("P1"));
            verify(roleRepository).save(admin);
            assertEquals("New Description", res.getDescription());
        }

        /**
         * UTCID06
         * Type: A (Abnormal)
         * Precondition:
         *   - Có role trong DB:
         *       name = "ADMIN"
         *       description = "System Administrator"
         *       permissions = { "P1", "P2" }
         * Input:
         *   - roleName = "ADMIN"
         *   - request:
         *       description = "New Description" (hoặc null, không quan trọng)
         *       permissions = { "P9999" } (ID quyền không tồn tại)
         *   - permissionRepository.findAllById({"P9999"}) = empty list
         * Expected:
         *   - Throw IllegalArgumentException("No valid permissions found for role: ADMIN")
         *   - Không gọi roleRepository.save
         */
        @Test
        @DisplayName("UTCID06 - A: ADMIN với permissions không hợp lệ (P9999) -> IllegalArgumentException")
        void updateRole_admin_invalidPermissions_shouldThrow() {
            Permission p1 = permission("P1");
            Permission p2 = permission("P2");

            Role admin = new Role();
            admin.setName("ADMIN");
            admin.setDescription("System Administrator");
            admin.setPermissions(new HashSet<>(Set.of(p1, p2)));

            when(roleRepository.findById("ADMIN")).thenReturn(Optional.of(admin));
            when(permissionRepository.findAllById(Set.of("P9999")))
                    .thenReturn(List.of()); // không tìm được quyền nào

            RoleRequest request = RoleRequest.builder()
                    .description("New Description")
                    .permissions(Set.of("P9999"))
                    .build();

            IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                    () -> roleService.update("ADMIN", request));

            assertEquals("No valid permissions found for role: ADMIN", ex.getMessage());
            verify(roleRepository, never()).save(any(Role.class));
        }

        /**
         * UTCID07
         * Type: N (Normal)
         * Precondition:
         *   - Có role trong DB:
         *       name = "TUTOR"
         *       description = "Tutor role"
         *       permissions = { "P3" }
         * Input:
         *   - roleName = "TUTOR"
         *   - request:
         *       description = "New Description"
         *       permissions = { "P1" }
         * Expected:
         *   - Role sau update:
         *       description = "New Description"
         *       permissions = { "P1" }
         */
        @Test
        @DisplayName("UTCID07 - N: TUTOR cập nhật description + permissions = {P1}")
        void updateRole_tutor_updateDescAndPermissions() {
            Permission p3 = permission("P3");
            Permission p1 = permission("P1");

            Role tutor = new Role();
            tutor.setName("TUTOR");
            tutor.setDescription("Tutor role");
            tutor.setPermissions(new HashSet<>(Set.of(p3)));

            when(roleRepository.findById("TUTOR")).thenReturn(Optional.of(tutor));
            when(permissionRepository.findAllById(Set.of("P1")))
                    .thenReturn(List.of(p1));
            when(roleRepository.save(any(Role.class))).thenAnswer(inv -> inv.getArgument(0));
            mockRoleMapperToEcho();

            RoleRequest request = RoleRequest.builder()
                    .description("New Description")
                    .permissions(Set.of("P1"))
                    .build();

            RoleResponse res = roleService.update("TUTOR", request);

            assertEquals("New Description", tutor.getDescription());
            assertEquals(1, tutor.getPermissions().size());
            assertTrue(tutor.getPermissions().contains(p1));

            verify(permissionRepository).findAllById(Set.of("P1"));
            verify(roleRepository).save(tutor);
            assertEquals("New Description", res.getDescription());
        }
    }
}
