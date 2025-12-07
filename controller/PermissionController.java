package edu.lms.controller;

import edu.lms.dto.request.ApiRespond;
import edu.lms.dto.request.PermissionRequest;
import edu.lms.dto.response.PermissionResponse;
import edu.lms.service.PermissionService;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/permissions")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Builder
public class PermissionController {

    PermissionService permissionService;

    //Tạo quyền mới – chỉ Admin
    @PostMapping
    @PreAuthorize("hasAuthority('CREATE_PERMISSION')")
    public ApiRespond<PermissionResponse> create(@RequestBody PermissionRequest permissionRequest) {
        return ApiRespond.<PermissionResponse>builder()
                .result(permissionService.create(permissionRequest))
                .build();
    }

    //Xem danh sách quyền – chỉ Admin
    @GetMapping
    @PreAuthorize("hasAuthority('VIEW_PERMISSION')")
    public ApiRespond<List<PermissionResponse>> getAll() {
        return ApiRespond.<List<PermissionResponse>>builder()
                .result(permissionService.getAll())
                .build();
    }

    //Xóa quyền – chỉ Admin
    @DeleteMapping("/{permission}")
    @PreAuthorize("hasAuthority('DELETE_PERMISSION')")
    public ApiRespond<Void> delete(@PathVariable String permission) {
        permissionService.delete(permission);
        return ApiRespond.<Void>builder()
                .message("Permission deleted successfully")
                .build();
    }
}
