
package edu.lms.mapper;

import edu.lms.dto.request.UserCreationRequest;
import edu.lms.dto.response.UserResponse;
import edu.lms.entity.User;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface UserMapping {

    @Mapping(target = "passwordHash", source = "password")
    @Mapping(target = "fullName", source = "fullName")
    @Mapping(target = "email", source = "email")
    @Mapping(target = "isActive", ignore = true) // giữ mặc định = true
    @Mapping(target = "createdAt", expression = "java(java.time.LocalDateTime.now())")
    @Mapping(target = "updatedAt", expression = "java(java.time.LocalDateTime.now())")
    User toUser(UserCreationRequest request);

    @Mapping(target = "userID", expression = "java(mapUUID(user.getUserID()))")
    @Mapping(target = "role", expression = "java(user.getRole() != null ? user.getRole().getName() : null)")
    UserResponse toUserResponse(User user);

    default Long mapUUID(Long value) {
        return value;
    }
}
