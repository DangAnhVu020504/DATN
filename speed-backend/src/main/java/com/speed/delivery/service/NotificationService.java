package com.speed.delivery.service;

/**
 * Service gửi thông báo (Mock Service).
 */
public interface NotificationService {
    void sendNotification(Long userId, String title, String message, String type);
    void sendOrderNotification(Long userId, Long orderId, String title, String message);
    java.util.List<com.speed.delivery.dto.response.NotificationResponse> getUserNotifications(Long userId, org.springframework.data.domain.Pageable pageable);
    void markAsRead(Long notificationId);
    void deleteNotification(Long notificationId);
    long getUnreadCount(Long userId);
}
