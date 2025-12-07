package edu.lms.mapper;

import edu.lms.dto.request.PermissionRequest;
import edu.lms.dto.response.PermissionResponse;
import edu.lms.entity.Permission;
import org.mapstruct.Mapper;


@Mapper(componentModel = "spring")
public interface PermissionMapper {
    Permission toPermission(PermissionRequest permissionRequest);
    PermissionResponse toPermissionResponse(Permission permission);

}
