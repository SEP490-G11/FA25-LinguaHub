package edu.lms.service;


import edu.lms.dto.request.RoleRequest;
import edu.lms.dto.response.RoleResponse;
import edu.lms.mapper.RoleMapper;
import edu.lms.repository.PermissionRepository;
import edu.lms.repository.RoleRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.HashSet;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class RoleService {
    RoleRepository roleRepository;
    RoleMapper roleMapper;
    PermissionRepository permissionRepository;

    public RoleResponse create(RoleRequest request) {
        var role = roleMapper.toRole(request);

        // Lấy danh sách permission theo id/name từ request
        var permissions = permissionRepository.findAllById(request.getPermissions());

        // Nếu không tìm thấy quyền nào → báo lỗi
        if (permissions.isEmpty()) {
            throw new IllegalArgumentException("No valid permissions found for role: " + request.getName());
        }

        role.setPermissions(new HashSet<>(permissions));

        role = roleRepository.save(role);

        log.info("Created role {} with {} permissions", role.getName(), permissions.size());

        return roleMapper.toRoleResponse(role);
    }

    public List<RoleResponse> getAll() {
        return roleRepository.findAll()
                .stream()
                .map(roleMapper::toRoleResponse)
                .toList();
    }

    public void delete(String roleName) {
        if (!roleRepository.existsById(roleName)) {
            throw new IllegalArgumentException("Role not found: " + roleName);
        }
        roleRepository.deleteById(roleName);
        log.info("Deleted role: {}", roleName);
    }
    public RoleResponse update(String roleName, RoleRequest request) {
        // 1. Tìm role theo tên
        var role = roleRepository.findById(roleName)
                .orElseThrow(() -> new IllegalArgumentException("Role not found: " + roleName));

        // 2. Cập nhật mô tả nếu có
        if (request.getDescription() != null) {
            role.setDescription(request.getDescription());
        }

        // 3. Cập nhật danh sách permissions
        if (request.getPermissions() != null && !request.getPermissions().isEmpty()) {
            var permissions = permissionRepository.findAllById(request.getPermissions());
            if (permissions.isEmpty()) {
                throw new IllegalArgumentException("No valid permissions found for role: " + roleName);
            }
            role.setPermissions(new HashSet<>(permissions));
        }

        // 4. Lưu thay đổi
        role = roleRepository.save(role);

        log.info("Updated role {} with {} permissions", role.getName(), role.getPermissions().size());

        // 5. Trả về response
        return roleMapper.toRoleResponse(role);
    }
}

