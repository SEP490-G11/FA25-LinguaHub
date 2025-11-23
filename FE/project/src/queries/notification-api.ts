import api from "@/config/axiosConfig";
import { Notification } from "@/types/Notification";

export const notificationApi = {

  getAllNotifications: async (): Promise<Notification[]> => {
    const response = await api.get("/api/notifications");
    return response.data;
  },

  getNotificationsByUserId: async (userId: number): Promise<Notification[]> => {
    const response = await api.get(`/api/notifications/user/${userId}`);
    return response.data;
  },

  markAsRead: async (notificationId: number): Promise<void> => {
    await api.patch(`/api/notifications/${notificationId}/read`, { read: true });
  },
};
