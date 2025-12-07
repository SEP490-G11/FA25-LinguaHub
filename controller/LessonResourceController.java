package edu.lms.controller;

import edu.lms.dto.request.ApiRespond;
import edu.lms.dto.request.LessonResourceRequest;
import edu.lms.dto.response.LessonResourceResponse;
import edu.lms.service.LessonResourceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.*;

import java.util.List;

import static lombok.AccessLevel.PRIVATE;

@RestController
@RequestMapping("/tutor") // Thay đổi RequestMapping gốc để linh hoạt hơn
@RequiredArgsConstructor
@FieldDefaults(level = PRIVATE, makeFinal = true)
public class LessonResourceController {

        LessonResourceService lessonResourceService;

        // ADD RESOURCE TO A LESSON
        @PostMapping("/lessons/{lessonId}/resources")
        public ApiRespond<LessonResourceResponse> addResource(
                        @PathVariable Long lessonId,
                        @RequestBody @Valid LessonResourceRequest request) {
                // Logic lấy tutorId đã được chuyển vào service
                LessonResourceResponse resource = lessonResourceService.addResource(lessonId, request);

                return ApiRespond.<LessonResourceResponse>builder()
                                .result(resource)
                                .message("Resource added successfully")
                                .build();
        }

        // GET ALL RESOURCES OF A LESSON
        @GetMapping("/lessons/{lessonId}/resources")
        public ApiRespond<List<LessonResourceResponse>> getResourcesByLesson(
                        @PathVariable Long lessonId) {
                // Logic lấy tutorId đã được chuyển vào service
                List<LessonResourceResponse> resources = lessonResourceService.getResourcesByLesson(lessonId);

                return ApiRespond.<List<LessonResourceResponse>>builder()
                                .result(resources)
                                .message("Resources retrieved successfully")
                                .build();
        }

        // UPDATE RESOURCE
        @PutMapping("/resources/{resourceId}") // URL nhất quán: /tutor/resources/{resourceId}
        public ApiRespond<LessonResourceResponse> updateResource(
                        @PathVariable Long resourceId,
                        @RequestBody @Valid LessonResourceRequest request) {
                // Logic lấy tutorId đã được chuyển vào service
                LessonResourceResponse resource = lessonResourceService.updateResource(resourceId, request);

                return ApiRespond.<LessonResourceResponse>builder()
                                .result(resource)
                                .message("Resource updated successfully")
                                .build();
        }

        // DELETE RESOURCE
        @DeleteMapping("/resources/{resourceId}") // URL nhất quán: /tutor/resources/{resourceId}
        public ApiRespond<Void> deleteResource(
                        @PathVariable Long resourceId) {
                // Logic lấy tutorId đã được chuyển vào service
                lessonResourceService.deleteResource(resourceId);

                return ApiRespond.<Void>builder()
                                .message("Resource deleted successfully")
                                .build();
        }
}
