/**
 * Mapping BE error messages to Vietnamese
 * Dùng để chuyển đổi các thông báo lỗi từ BE sang tiếng Việt
 */

const errorMessageMap: Record<string, string> = {
  // Auth & User
  "This Email has Signed in before": "Email này đã được đăng ký trước đó",
  "Username is Existed": "Tên đăng nhập đã tồn tại",
  "Username must be at least {min} characters": "Tên đăng nhập phải có ít nhất 3 ký tự",
  "Password must be at least {min} characters": "Mật khẩu phải có ít nhất 8 ký tự",
  "User is not exist": "Người dùng không tồn tại",
  "User not found": "Không tìm thấy người dùng",
  "UNAUTHENTICATED YET": "Phiên đăng ký đã hết hạn. Vui lòng đăng ký lại.",
  "You do not have permission": "Bạn không có quyền truy cập",
  "Your age must be at least {min}": "Bạn phải ít nhất 10 tuổi",
  "Your role is not found": "Không tìm thấy vai trò",
  "Invalid or incorrect OTP code": "Mã OTP không hợp lệ hoặc không chính xác",
  "OTP code has expired": "Mã OTP đã hết hạn",
  "Password is not matched": "Mật khẩu không khớp",
  "The password is false": "Mật khẩu không đúng",

  // Course
  "Course not found": "Không tìm thấy khóa học",
  "Cannot modify or delete a course that already has enrolled learners": "Không thể sửa hoặc xóa khóa học đã có học viên đăng ký",
  "Course category not found": "Không tìm thấy danh mục khóa học",
  "Course with the same title already exists": "Khóa học với tên này đã tồn tại",
  "Only Draft or Rejected course can be deleted": "Chỉ có thể xóa khóa học ở trạng thái Nháp hoặc Bị từ chối",
  "Section not found": "Không tìm thấy chương",
  "Can't change status": "Không thể thay đổi trạng thái",
  "Only Draft or Rejected course can be updated": "Chỉ có thể cập nhật khóa học ở trạng thái Nháp hoặc Bị từ chối",
  "You haven't started this course yet": "Bạn chưa bắt đầu khóa học này",
  "You must complete at least 50% of the course before reviewing": "Bạn phải hoàn thành ít nhất 50% khóa học trước khi đánh giá",
  "This course is not yet approved for public view": "Khóa học này chưa được phê duyệt để công khai",
  "Can only create or edit draft for an Approved course": "Chỉ có thể tạo hoặc chỉnh sửa bản nháp cho khóa học đã được phê duyệt",
  "Course draft not found": "Không tìm thấy bản nháp khóa học",
  "Invalid state for this action": "Trạng thái không hợp lệ cho hành động này",

  // Tutor
  "Tutor not found": "Không tìm thấy gia sư",
  "Tutor is not approved yet": "Gia sư chưa được phê duyệt",
  "Tutor application is still pending": "Đơn đăng ký gia sư đang chờ xử lý",
  "Tutor application not found": "Không tìm thấy đơn đăng ký gia sư",
  "Tutor account is locked or inactive": "Tài khoản gia sư bị khóa hoặc không hoạt động",
  "Tutor package not found": "Không tìm thấy gói học",
  "Package name already exists for this tutor": "Tên gói học đã tồn tại cho gia sư này",
  "This package has been purchased. Cannot modify.": "Gói học này đã được mua. Không thể chỉnh sửa.",
  "User package not found": "Không tìm thấy gói học của người dùng",
  "Not enough slots remaining in this package": "Không đủ slot còn lại trong gói học này",
  "Number of slot_content must equal max_slots": "Số lượng nội dung slot phải bằng số slot tối đa",

  // Enrollment
  "Enrollment not found": "Không tìm thấy đăng ký",
  "User already enrolled in this course": "Bạn đã đăng ký khóa học này rồi",
  "User is not enrolled": "Người dùng chưa đăng ký",

  // Payment
  "Payment not found": "Không tìm thấy thanh toán",
  "Payment transaction failed": "Giao dịch thanh toán thất bại",
  "Refund not allowed for this transaction": "Không được phép hoàn tiền cho giao dịch này",
  "Ballance is not enough": "Số dư không đủ",
  "withDraw Not found": "Không tìm thấy yêu cầu rút tiền",
  "WithDraw Status Not Found": "Không tìm thấy trạng thái rút tiền",
  "Refund Not found": "Không tìm thấy yêu cầu hoàn tiền",

  // Booking
  "BookingPlan not found": "Không tìm thấy lịch làm việc",
  "Booking not found": "Không tìm thấy đặt lịch",
  "Booking is already confirmed": "Đặt lịch đã được xác nhận",
  "Tutor schedule conflict at this time": "Lịch gia sư bị trùng vào thời gian này",
  "This booking plan already has booked slots": "Lịch làm việc này đã có slot được đặt",
  "Booking slot not found": "Không tìm thấy slot đặt lịch",
  "Booking slot lock has expired": "Khóa slot đặt lịch đã hết hạn",
  "Tutor can only work maximum 4 days per week": "Gia sư chỉ có thể làm việc tối đa 4 ngày mỗi tuần",
  "Thanh toan bi huy qua nhieu lan vui long thu lai sau 1 gio": "Thanh toán bị hủy quá nhiều lần, vui lòng thử lại sau 1 giờ",

  // Chat
  "Chat room not found": "Không tìm thấy phòng chat",
  "Policy not found": "Không tìm thấy chính sách",
  "Meeting link must be a valid Google Meet link (https://meet.google.com/)": "Link họp phải là link Google Meet hợp lệ (https://meet.google.com/)",

  // Payment Type
  "Ivalid Payment Type": "Loại thanh toán không hợp lệ",
  "Booking Slot Amount of this Tutor is 0, Please Choose other Tutor ": "Gia sư này không còn slot trống, vui lòng chọn gia sư khác",

  // Wishlist
  "The course already in wishlist": "Khóa học đã có trong danh sách yêu thích",

  // Review
  "You have already reviewed this course": "Bạn đã đánh giá khóa học này rồi",
  "You have already feedback this plan": "Bạn đã phản hồi gói học này rồi",
  "Review not found": "Không tìm thấy đánh giá",
  "Booking is not paid": "Đặt lịch chưa được thanh toán",
  "Invalid rating": "Đánh giá không hợp lệ",
  "Objective not found": "Không tìm thấy mục tiêu",

  // Notification
  "Notify not found": "Không tìm thấy thông báo",

  // Quiz
  "Quiz Question not found": "Không tìm thấy câu hỏi quiz",
  "Lesson not found": "Không tìm thấy bài học",
  "Quiz Result not found": "Không tìm thấy kết quả quiz",

  // Turnstile
  "Verification failed. Please refresh and try again.": "Xác minh thất bại. Vui lòng làm mới trang và thử lại.",

  // Category & Language
  "Category already exists": "Danh mục đã tồn tại",
  "Category not found": "Không tìm thấy danh mục",
  "Category in use": "Danh mục đang được sử dụng",
  "Language already exists": "Ngôn ngữ đã tồn tại",
  "Language not found": "Không tìm thấy ngôn ngữ",
  "Language in use": "Ngôn ngữ đang được sử dụng",
  "Language name in use": "Tên ngôn ngữ đang được sử dụng",

  // Generic
  "Uncategorized error": "Lỗi không xác định",
  "Invalid key": "Khóa không hợp lệ",
};

/**
 * Chuyển đổi error message từ BE sang tiếng Việt
 * @param message - Error message từ BE
 * @returns Message tiếng Việt hoặc message gốc nếu không tìm thấy
 */
export const translateErrorMessage = (message: string): string => {
  // Exact match
  if (errorMessageMap[message]) {
    return errorMessageMap[message];
  }

  // Partial match for messages with dynamic values
  for (const [key, value] of Object.entries(errorMessageMap)) {
    if (message.toLowerCase().includes(key.toLowerCase())) {
      return value;
    }
  }

  // Return original if no translation found
  return message;
};

/**
 * Lấy error message từ API response và chuyển sang tiếng Việt
 * @param error - Error object từ axios
 * @param defaultMessage - Message mặc định nếu không có message từ BE
 * @returns Message tiếng Việt
 */
export const getApiErrorMessage = (
  error: unknown,
  defaultMessage = "Đã xảy ra lỗi. Vui lòng thử lại."
): string => {
  const err = error as { response?: { data?: { message?: string } } };
  const message = err?.response?.data?.message;
  
  if (message) {
    return translateErrorMessage(message);
  }
  
  return defaultMessage;
};
