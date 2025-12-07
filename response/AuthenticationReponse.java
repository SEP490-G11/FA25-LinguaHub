package edu.lms.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class AuthenticationReponse {

    String accessToken;      // Access token dùng để gọi API
    String refreshToken;     // Refresh token dùng để xin token mới
    boolean authenticated;   // Trạng thái xác thực
}