package edu.lms.controller;

import edu.lms.dto.request.ApiRespond;
import edu.lms.dto.response.CourseResponse;
import edu.lms.service.WishlistService;
import io.swagger.v3.oas.annotations.Operation;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

import static lombok.AccessLevel.PRIVATE;

@RestController
@RequestMapping("/wishlist")
@RequiredArgsConstructor
@FieldDefaults(level = PRIVATE, makeFinal = true)
public class WishlistController {

    WishlistService wishlistService;

    @Operation(summary = "Learner: Add course to wishlist")
    @PostMapping("/{courseId}")
    public ApiRespond<String> addToWishlist(@PathVariable Long courseId) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        wishlistService.addToWishlist(email, courseId);
        return ApiRespond.<String>builder().result("Added successfully").build();
    }

    @Operation(summary = "Learner: Remove course from wishlist")
    @DeleteMapping("/{courseId}")
    public ApiRespond<String> removeFromWishlist(@PathVariable Long courseId) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        wishlistService.removeFromWishlist(email, courseId);
        return ApiRespond.<String>builder().result("Removed successfully").build();
    }

    @Operation(summary = "Learner: Get my wishlist")
    @GetMapping
    public ApiRespond<List<CourseResponse>> getMyWishlist() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return ApiRespond.<List<CourseResponse>>builder()
                .result(wishlistService.getMyWishlist(email))
                .build();
    }
}
