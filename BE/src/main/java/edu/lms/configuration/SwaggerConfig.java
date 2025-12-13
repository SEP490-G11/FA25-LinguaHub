package edu.lms.configuration;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.servers.Server;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
public class SwaggerConfig {

    private static final String SECURITY_SCHEME_NAME = "bearerAuth";

    @Bean
    public OpenAPI lmsOpenAPI() {
        return new OpenAPI()
                // 🔐 Khai báo global security (mọi API sẽ dùng bearerAuth)
                .addSecurityItem(new SecurityRequirement().addList(SECURITY_SCHEME_NAME))
                .components(new Components()
                        .addSecuritySchemes(SECURITY_SCHEME_NAME,
                                new SecurityScheme()
                                        .name(SECURITY_SCHEME_NAME)
                                        .type(SecurityScheme.Type.HTTP)
                                        .scheme("bearer")
                                        .bearerFormat("JWT") // chỉ để mô tả
                        )
                )
                .info(new Info()
                        .title("LMS Authentication API")
                        .version("1.0.0")
                        .description("""
                                 **Mô tả ngắn gọn:**
                                API phục vụ chức năng đăng ký, xác thực và quản lý đăng nhập người dùng trong hệ thống LMS.
                                
                                Bao gồm các chức năng:
                                - Đăng ký & xác thực email
                                - Đăng nhập & sinh token
                                - Kiểm tra token hợp lệ (introspect)
                                - Đăng xuất khỏi hệ thống
                                """)
                        .contact(new Contact()
                                .name("Nguyễn Trung")
                                .email("support@lms.edu.vn"))
                        .license(new License()
                                .name("MIT License")
                                .url("https://opensource.org/licenses/MIT"))
                )
                .servers(List.of(
                        new Server().url("http://localhost:8086").description("Local Server")
                ));
    }
}
//http://localhost:8086/swagger-ui/index.html