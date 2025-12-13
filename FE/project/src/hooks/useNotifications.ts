import { useState, useEffect } from "react";
import { notificationApi } from "@/queries/notification-api";
import { Notification } from "@/types/Notification";
import api from "@/config/axiosConfig";

// Tự động refresh mỗi 10 giây để cập nhật nhanh hơn
const AUTO_REFRESH_TIME = 10000;

/**
 * Hook để lấy thông báo của user
 * - Lấy userId từ /users/myInfo
 * - Gọi API /api/notifications/user/{userId}
 * - Tự động refresh mỗi 30 giây
 */
export const useNotifications = () => {
  // State lưu danh sách thông báo
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<number | null>(null);

  // Kiểm tra user đã đăng nhập chưa
  const token =
    localStorage.getItem("access_token") ||
    sessionStorage.getItem("access_token");
  const isAuthenticated = !!token;

  // Effect 1: Lấy userId ngay khi có token
  useEffect(() => {
    if (!isAuthenticated) {
      setUserId(null);
      setNotifications([]);
      setLoading(false);
      return;
    }

    // Fetch userId từ /users/myInfo
    const fetchUserId = async () => {
      try {
        const response = await api.get("/users/myInfo");
        const userID = response.data.result?.userID;
        if (userID) {
          setUserId(userID);
        }
      } catch (err) {
        console.error("Error fetching user info:", err);
        setError("Failed to get user info");
        setLoading(false);
      }
    };

    fetchUserId();
  }, [isAuthenticated]);

  // Hàm lấy thông báo từ API
  const fetchNotifications = async () => {
    // Nếu chưa có userId thì không fetch
    if (!userId) {
      return;
    }

    try {
      // Gọi API lấy thông báo theo userId
      const data = await notificationApi.getNotificationsByUserId(userId);
      setNotifications(data);
      setError(null);
    } catch (err) {
      console.error("Error fetching notifications:", err);
      setError("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  // Effect 2: Fetch thông báo khi có userId và setup auto-refresh
  useEffect(() => {
    // Nếu chưa có userId thì không làm gì
    if (!userId) {
      return;
    }

    // Fetch ngay lập tức
    fetchNotifications();

    // Setup auto-refresh mỗi 30 giây
    const interval = setInterval(fetchNotifications, AUTO_REFRESH_TIME);

    // Cleanup: Xóa interval khi component unmount
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // Hàm đánh dấu thông báo đã đọc
  const markAsRead = async (notificationId: number) => {
    try {
      await api.patch(`/api/notifications/${notificationId}/read`, {
        read: true
      });
      
      // Cập nhật state local
      setNotifications(prev => 
        prev.map(n => 
          n.notificationId === notificationId 
            ? { ...n, isRead: true }
            : n
        )
      );
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }
  };

  // Tính số lượng thông báo chưa đọc
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // Lấy 3 thông báo gần nhất
  const recentNotifications = notifications.slice(0, 3);

  return {
    notifications, // Tất cả thông báo
    recentNotifications, // 3 thông báo gần nhất
    unreadCount, // Số lượng chưa đọc
    loading, // Đang loading
    error, // Lỗi nếu có
    refetch: fetchNotifications, // Hàm để refresh thủ công
    markAsRead, // Hàm đánh dấu đã đọc
  };
};
