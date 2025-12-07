package edu.lms.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import edu.lms.dto.response.FileUrlResponse;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Map;

import static lombok.AccessLevel.PRIVATE;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = PRIVATE, makeFinal = true)
public class CloudinaryService {

    Cloudinary cloudinary;

    public FileUrlResponse uploadFile(MultipartFile file, String folder) {
        try {
            // ===== Lấy tên file + đuôi =====
            String originalFilename = file.getOriginalFilename(); // vd: "Report2_SEP490_G11_Project Tracking.xlsx"
            String baseName = "file";
            String extension = "";

            if (originalFilename != null) {
                int dotIndex = originalFilename.lastIndexOf('.');
                if (dotIndex > 0 && dotIndex < originalFilename.length() - 1) {
                    baseName = originalFilename.substring(0, dotIndex);      // "Report2_SEP490_G11_Project Tracking"
                    extension = originalFilename.substring(dotIndex + 1);    // "xlsx"
                } else {
                    baseName = originalFilename;
                }
            }

            String extLower = extension.toLowerCase();

            // ===== Các loại document muốn VIEW qua Google Docs =====
            boolean canUseGoogleViewer = extLower.equals("pdf")
                    || extLower.equals("doc")
                    || extLower.equals("docx")
                    || extLower.equals("ppt")
                    || extLower.equals("pptx")
                    || extLower.equals("xls")
                    || extLower.equals("xlsx");

            // Document thì upload dạng raw
            boolean isDocument = canUseGoogleViewer;

            // ===== resource_type Cloudinary =====
            String resourceType = isDocument ? "raw" : "auto";

            // ===== public_id: GIỮ CẢ ĐUÔI FILE để tải về đúng kiểu =====
            String publicId = baseName;
            if (!extension.isEmpty()) {
                publicId = baseName + "." + extension;   // ví dụ: "Report2_SEP490_G11_Project Tracking.xlsx"
            }

            // ===== Upload lên Cloudinary =====
            Map<?, ?> uploadResult = cloudinary.uploader().upload(
                    file.getBytes(),
                    ObjectUtils.asMap(
                            "folder", folder,
                            "resource_type", resourceType,
                            "public_id", publicId,  // có cả đuôi
                            "use_filename", false,  // mình đã tự set public_id
                            "unique_filename", true
                    )
            );

            String secureUrl = uploadResult.get("secure_url").toString();
            // secureUrl giờ sẽ kết thúc kiểu:
            // .../uploads/Report2_SEP490_G11_Project%20Tracking.xlsx

            // ===== downloadUrl: ép tải file về, giữ nguyên tên + đuôi =====
            String downloadUrl = secureUrl;
            String marker = "/upload/";
            int idx = secureUrl.indexOf(marker);
            if (idx > 0) {
                downloadUrl =
                        secureUrl.substring(0, idx + marker.length()) +
                                "fl_attachment/" +
                                secureUrl.substring(idx + marker.length());
            }
            // Ví dụ:
            // .../raw/upload/fl_attachment/v1764.../uploads/Report2_SEP490_G11_Project%20Tracking.xlsx

            // ===== viewUrl =====
            String viewUrl;
            if (canUseGoogleViewer) {
                // PDF / DOC / DOCX / PPT / PPTX / XLS / XLSX -> Google Docs Viewer
                String encoded = URLEncoder.encode(secureUrl, StandardCharsets.UTF_8);
                viewUrl = "https://docs.google.com/gview?url=" + encoded + "&embedded=true";
            } else {
                // Ảnh, file khác -> dùng trực tiếp Cloudinary URL
                viewUrl = secureUrl;
            }

            return FileUrlResponse.builder()
                    .viewUrl(viewUrl)
                    .downloadUrl(downloadUrl)
                    .build();

        } catch (IOException e) {
            throw new RuntimeException("Upload file thất bại", e);
        }
    }
}
