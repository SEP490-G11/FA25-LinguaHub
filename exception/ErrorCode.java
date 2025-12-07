package edu.lms.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;

@Getter
public enum ErrorCode {

    UNCATEGORIZED_EXCEPTION(9999,"Uncategorized error", HttpStatus.INTERNAL_SERVER_ERROR),
    INVALID_KEY(1001,"Invalid key", HttpStatus.BAD_REQUEST),
    USER_EXISTED(1002, "Username is Existed", HttpStatus.BAD_REQUEST),
    USERNAME_INVALID(1003, "Username must be at least {min} characters", HttpStatus.BAD_REQUEST),
    INVALID_PASSWORD(1004,"Password must be at least {min} characters", HttpStatus.BAD_REQUEST),
    USER_NOT_EXIST(1005,"User is not exist", HttpStatus.NOT_FOUND),
    UNAUTHENTICATED(1006,"UNAUTHENTICATED YET", HttpStatus.UNAUTHORIZED),
    UNAUTHORIZED(1007,"You do not have permission", HttpStatus.FORBIDDEN),
    INVALID_DOB(1008,"Your age must be at least {min}", HttpStatus.BAD_REQUEST),
    ROLE_NOT_FOUND(1009,"Your role is not found" , HttpStatus.NOT_FOUND ),
    INVALID_OTP(2001, "Invalid or incorrect OTP code", HttpStatus.BAD_REQUEST),
    OTP_EXPIRED(2002, "OTP code has expired", HttpStatus.BAD_REQUEST),
    PASSWORD_NOT_MATCH(2003,"Password is not matched" , HttpStatus.BAD_REQUEST),
    PASSWORD_ENABLED(2004,"The password is false", HttpStatus.BAD_REQUEST),
    EMAIL_EXISTED(2005,"This Email has Signed in before", HttpStatus.BAD_REQUEST),
    USER_NOT_FOUND(2006,"User not found", HttpStatus.NOT_FOUND),
    USER_NOT_EXISTED(2007,"User is not exist", HttpStatus.NOT_FOUND),
    // COURSE
    COURSE_NOT_FOUND(3001, "Course not found", HttpStatus.NOT_FOUND),
    COURSE_HAS_ENROLLMENT(3002, "Cannot modify or delete a course that already has enrolled learners", HttpStatus.CONFLICT),
    COURSE_CATEGORY_NOT_FOUND(3003, "Course category not found", HttpStatus.NOT_FOUND),
    COURSE_ALREADY_EXISTS(3004, "Course with the same title already exists", HttpStatus.BAD_REQUEST),
    COURSE_DELETE_ONLY_DRAFT_OR_REJECTED(3005, "Only Draft or Rejected course can be deleted", HttpStatus.FORBIDDEN),
    SECTION_NOT_FOUND(3006,"Section not found", HttpStatus.NOT_FOUND),
    CAN_NOT_CHANGE_STATUS(3007, "Can't change status", HttpStatus.BAD_REQUEST),
    COURSE_UPDATE_ONLY_DRAFT_OR_REJECTED(3008, "Only Draft or Rejected course can be updated", HttpStatus.BAD_REQUEST),
    COURSE_NOT_STARTED(3009, "You haven't started this course yet", HttpStatus.BAD_REQUEST),
    COURSE_NOT_COMPLETED_HALF(3010, "You must complete at least 50% of the course before reviewing", HttpStatus.BAD_REQUEST),
    COURSE_NOT_APPROVED(3011, "This course is not yet approved for public view", HttpStatus.FORBIDDEN),
    REFUND_NOT_FOUND(1013, "Refund Not found", HttpStatus.NOT_FOUND),
    // COURSE DRAFT / VERSIONING (THÊM MỚI)
    CAN_ONLY_EDIT_DRAFT_FOR_APPROVED_COURSE(
            3012,
            "Can only create or edit draft for an Approved course",
            HttpStatus.BAD_REQUEST
    ),
    DRAFT_NOT_FOUND(
            3013,
            "Course draft not found",
            HttpStatus.NOT_FOUND
    ),
    INVALID_STATE(
            3014,
            "Invalid state for this action",
            HttpStatus.BAD_REQUEST
    ),

    // TUTOR MODULE
    TUTOR_NOT_FOUND(4001, "Tutor not found", HttpStatus.NOT_FOUND),
    TUTOR_NOT_APPROVED(4002, "Tutor is not approved yet", HttpStatus.FORBIDDEN),
    TUTOR_APPLICATION_PENDING(4003, "Tutor application is still pending", HttpStatus.BAD_REQUEST),
    TUTOR_APPLICATION_NOT_FOUND(4004, "Tutor application not found", HttpStatus.NOT_FOUND),
    TUTOR_ACCOUNT_LOCKED(4010, "Tutor account is locked or inactive", HttpStatus.FORBIDDEN),
    TUTOR_PACKAGE_NOT_FOUND(4011, "Tutor package not found", HttpStatus.NOT_FOUND),
    TUTOR_PACKAGE_DUPLICATE_NAME(4012, "Package name already exists for this tutor", HttpStatus.BAD_REQUEST),
    TUTOR_PACKAGE_ALREADY_PURCHASED(4013, "This package has been purchased. Cannot modify.", HttpStatus.CONFLICT),
    USER_PACKAGE_NOT_FOUND(4014, "User package not found", HttpStatus.NOT_FOUND),
    USER_PACKAGE_SLOT_NOT_ENOUGH(4015, "Not enough slots remaining in this package", HttpStatus.BAD_REQUEST),
    TUTOR_PACKAGE_SLOT_CONTENT_MISMATCH(4016, "Number of slot_content must equal max_slots", HttpStatus.BAD_REQUEST),

    // ENROLLMENT & LEARNER MODULE
    ENROLLMENT_NOT_FOUND(5001, "Enrollment not found", HttpStatus.NOT_FOUND),
    ENROLLMENT_ALREADY_EXISTS(5002, "User already enrolled in this course", HttpStatus.CONFLICT),
    NOT_ENROLLED(5003, "User is not enrolled", HttpStatus.NOT_FOUND),

    // PAYMENT & TRANSACTION
    PAYMENT_NOT_FOUND(6001, "Payment not found", HttpStatus.NOT_FOUND),
    PAYMENT_FAILED(6002, "Payment transaction failed", HttpStatus.BAD_REQUEST),
    REFUND_NOT_ALLOWED(6003, "Refund not allowed for this transaction", HttpStatus.FORBIDDEN),
    INVALID_AMOUNT(6004, "Ballance is not enough", HttpStatus.FORBIDDEN),
    NOT_FOUND(6005, "withDraw Not found", HttpStatus.FORBIDDEN),
    INVALID_STATUS(6006, "WithDraw Status Not Found", HttpStatus.FORBIDDEN),




    // BOOKING_PLAN & BOOKING
    BOOKING_PLAN_NOT_FOUND(7001, "BookingPlan not found", HttpStatus.NOT_FOUND),
    BOOKING_NOT_FOUND(7002, "Booking not found", HttpStatus.NOT_FOUND),
    BOOKING_ALREADY_CONFIRMED(7003, "Booking is already confirmed", HttpStatus.BAD_REQUEST),
    BOOKING_TIME_CONFLICT(7004, "Tutor schedule conflict at this time", HttpStatus.CONFLICT),
    BOOKING_PLAN_HAS_BOOKED_SLOT(7005, "This booking plan already has booked slots", HttpStatus.CONFLICT),
    BOOKING_SLOT_NOT_FOUND(7006, "Booking slot not found", HttpStatus.NOT_FOUND),
    BOOKING_SLOT_EXPIRED(7007, "Booking slot lock has expired", HttpStatus.BAD_REQUEST),

    // CHAT & POLICY
    CHAT_ROOM_NOT_FOUND(8001, "Chat room not found", HttpStatus.NOT_FOUND),
    POLICY_NOT_FOUND(8002, "Policy not found", HttpStatus.NOT_FOUND),
    INVALID_MEETING_LINK(8007, "Meeting link must be a valid Google Meet link (https://meet.google.com/)", HttpStatus.BAD_REQUEST),

    // PAYMENT
    INVALID_PAYMENT_TYPE(8003, "Ivalid Payment Type", HttpStatus.NOT_FOUND),
    BOOKING_SLOT_NOT_AVAILABLE(8004, "Booking Slot Amount of this Tutor is 0, Please Choose other Tutor ", HttpStatus.NOT_FOUND),
    BOOKING_PLAN_MAX_DAYS_EXCEEDED(8005, "Tutor can only work maximum 4 days per week", HttpStatus.BAD_REQUEST),
    BOOKING_PAYMENT_CANCEL_TOO_MANY_TIMES(8006, "Thanh toan bi huy qua nhieu lan vui long thu lai sau 1 gio", HttpStatus.BAD_REQUEST),
    // WISH LIST
    ALREADY_IN_WISHLIST(8005, "The course already in wishlist", HttpStatus.CONFLICT),

    // REVIEW OR FEEDBACK
    ALREADY_REVIEWED(9000, "You have already reviewed this course", HttpStatus.CONFLICT),
    ALREADY_FEEDBACK(9005, "You have already feedback this plan", HttpStatus.CONFLICT),
    REVIEW_NOT_FOUND(9001, "Review not found", HttpStatus.NOT_FOUND),
    BOOKING_NOT_PAID(9003,"Booking is not paid", HttpStatus.BAD_REQUEST),
    INVALID_RATING(9004, "Invalid rating", HttpStatus.BAD_REQUEST),
    // OBJECTIVE COURSE
    OBJECTIVE_NOT_FOUND(9002, "Objective not found", HttpStatus.NOT_FOUND),

    //Notification
    NOTIFICATION_NOT_FOUND(9100, "Notify not found", HttpStatus.NOT_FOUND),

    //QUIZ
    QUIZ_QUESTION_NOT_FOUND(10000, "Quiz Question not found", HttpStatus.NOT_FOUND),
    LESSON_NOT_FOUND(10001, "Lesson not found", HttpStatus.NOT_FOUND),
    QUIZ_NO_QUESTION(10002, "Quiz Question not found", HttpStatus.NOT_FOUND),
    QUIZ_RESULT_NOT_FOUND(10003, "Quiz Result not found", HttpStatus.NOT_FOUND),

    //CloudFlare
    INVALID_TURNSTILE_TOKEN(100,"Verification failed. Please refresh and try again.", HttpStatus.BAD_REQUEST),

    CATEGORY_ALREADY_EXISTS(10004, "Category already exists", HttpStatus.CONFLICT),
    CATEGORY_NOT_FOUND(10005, "Category not found", HttpStatus.NOT_FOUND),
    CATEGORY_IN_USE(10006, "Category in use", HttpStatus.CONFLICT),
    LANGUAGE_ALREADY_EXISTS(10007, "Language already exists", HttpStatus.CONFLICT),
    LANGUAGE_NOT_FOUND(10008, "Language not found", HttpStatus.NOT_FOUND),
    LANGUAGE_IN_USE(10009, "Language in use", HttpStatus.NOT_FOUND),
    LANGUAGE_NAME_EN_IN_USE(10010, "Language name in use", HttpStatus.NOT_FOUND),

    ;

    ErrorCode(int code, String message, HttpStatusCode httpStatusCode) {
        this.code = code;
        this.message = message;
        this.statusCode = httpStatusCode;
    }

    private final int code;
    private final String message;
    private final HttpStatusCode statusCode;
}
