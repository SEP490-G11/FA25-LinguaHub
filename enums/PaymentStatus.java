package edu.lms.enums;

/**
 * Enum mô tả trạng thái thanh toán trong hệ thống PayOS/VNPAY.
 * Dùng cho cả Course Payment và Booking 1:1 Slot Payment.
 */
public enum PaymentStatus {
    PENDING,    // Đã tạo link, chưa thanh toán
    PAID,       // Thanh toán thành công
    FAILED,     // Giao dịch thất bại
    CANCELLED,  // Người dùng hủy thanh toán
    REFUND,     // Đã hoàn tiền
    EXPIRED     // Hết hạn (QR quá 15 phút chưa thanh toán)
}
