package edu.lms.mapper;

import edu.lms.dto.request.RoleRequest;
import edu.lms.dto.response.RoleResponse;
import edu.lms.entity.Role;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface RoleMapper {
    @Mapping(target =  "permissions", ignore = true)
    Role toRole(RoleRequest roleRequest);
    RoleResponse toRoleResponse(Role role);
}
