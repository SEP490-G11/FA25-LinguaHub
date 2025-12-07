package edu.lms.service;

import edu.lms.dto.request.PermissionRequest;
import edu.lms.dto.response.PermissionResponse;
import edu.lms.entity.Permission;
import edu.lms.mapper.PermissionMapper;
import edu.lms.repository.PermissionRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class PermissionService {

    PermissionRepository permissionRepository;
    PermissionMapper permissionMapper;

    /**
     * Tạo permission mới, kiểm tra xem permissionName có bị trùng hay chưa
     */
    public PermissionResponse create(PermissionRequest permissionRequest) {
        String permissionName = permissionRequest.getName();

        // Kiểm tra trùng theo name
        Optional<Permission> existing = permissionRepository.findById(permissionName);
        if (existing.isPresent()) {
            log.warn("Permission '{}' đã tồn tại!", permissionName);
            throw new RuntimeException("Permission '" + permissionName + "' is existed!");
        }

        //  Nếu không trùng -> tạo mới
        Permission permission = permissionMapper.toPermission(permissionRequest);
        permission = permissionRepository.save(permission);
        return permissionMapper.toPermissionResponse(permission);
    }

    /**
     * Lấy tất cả permissions
     */
    public List<PermissionResponse> getAll() {
        List<Permission> permissions = permissionRepository.findAll();
        return permissions.stream()
                .map(permissionMapper::toPermissionResponse)
                .toList();
    }

    /**
     * Xóa permission theo tên
     */
    public void delete(String permission) {
        permissionRepository.deleteById(permission);
    }
}
