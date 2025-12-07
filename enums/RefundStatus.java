package edu.lms.enums;

public enum RefundStatus {
    PENDING,        // Tự tạo khi slot bị reject
    SUBMITTED,      // Learner đã nhập bank info
    APPROVED,       // Admin đồng ý refund
    REJECTED        // Admin từ chối
}
