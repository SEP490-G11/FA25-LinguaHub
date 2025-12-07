package edu.lms.controller;

import edu.lms.dto.request.ApiRespond;
import edu.lms.dto.response.FileUrlResponse;
import edu.lms.service.CloudinaryService;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import static lombok.AccessLevel.PRIVATE;

@RestController
@RequestMapping("/api/files")
@RequiredArgsConstructor
@FieldDefaults(level = PRIVATE, makeFinal = true)
public class UploadController {

    CloudinaryService cloudinaryService;

    @PostMapping(
            value = "/upload",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    public ApiRespond<FileUrlResponse> uploadFile(
            @NotNull @RequestParam("file") MultipartFile file
    ) {
        try {
            FileUrlResponse result = cloudinaryService.uploadFile(file, "uploads");
            return ApiRespond.<FileUrlResponse>builder()
                    .result(result)
                    .code(0)
                    .message(null)
                    .build();
        } catch (Exception e) {
            return ApiRespond.<FileUrlResponse>builder()
                    .result(null)
                    .code(400)
                    .message("Upload file thất bại")
                    .build();
        }
    }
}
