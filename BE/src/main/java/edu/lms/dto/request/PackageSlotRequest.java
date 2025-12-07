package edu.lms.dto.request;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class PackageSlotRequest {

    @NotNull(message = "userPackageId is required")
    Long userPackageId;

    @NotEmpty(message = "slotIds must not be empty")
    List<Long> slotIds;
}


