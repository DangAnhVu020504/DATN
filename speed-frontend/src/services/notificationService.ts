import api from './api';
import type { ApiResponse, NotificationResponse } from '@/types';

export const notificationService = {
  getUserNotifications: (userId: number, page = 0, size = 20) =>
    api.get<ApiResponse<NotificationResponse[]>>(`/notifications/user/${userId}`, {
      params: { page, size },
    }),

  markAsRead: (id: number) =>
    api.put<ApiResponse<void>>(`/notifications/${id}/read`),

  deleteNotification: (id: number) =>
    api.delete<ApiResponse<void>>(`/notifications/${id}`),

  getUnreadCount: (userId: number) =>
    api.get<ApiResponse<number>>(`/notifications/user/${userId}/unread-count`),

  sendNotification: (userId: number, title: string, message: string, type: string) =>
    api.post<ApiResponse<void>>('/notifications', null, {
      params: { userId, title, message, type },
    }),
};
