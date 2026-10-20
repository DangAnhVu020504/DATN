package com.speed.delivery.service.impl;

import com.speed.delivery.dto.response.NotificationResponse;
import com.speed.delivery.entity.Notification;
import com.speed.delivery.entity.User;
import com.speed.delivery.enums.NotificationType;
import com.speed.delivery.exception.ResourceNotFoundException;
import com.speed.delivery.repository.NotificationRepository;
import com.speed.delivery.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * NotificationService implementation.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;

    @Override
    @Transactional
    public void sendNotification(Long userId, String title, String message, String type) {
        Notification notification = Notification.builder()
                .user(User.builder().id(userId).build())
                .title(title)
                .message(message)
                .type(NotificationType.valueOf(type))
                .isRead(false)
                .build();
        notificationRepository.save(notification);
        log.info("Notification sent to user {}: {}", userId, title);
    }

    @Override
    @Transactional
    public void sendOrderNotification(Long userId, Long orderId, String title, String message) {
        Notification notification = Notification.builder()
                .user(User.builder().id(userId).build())
                .title(title)
                .message(message)
                .type(NotificationType.ORDER)
                .referenceId(orderId)
                .isRead(false)
                .build();
        notificationRepository.save(notification);
        log.info("Order notification sent to user {}: {}", userId, title);
    }

    @Override
    @Transactional(readOnly = true)
    public List<NotificationResponse> getUserNotifications(Long userId, Pageable pageable) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable)
                .getContent().stream()
                .map(this::mapResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void markAsRead(Long notificationId) {
        notificationRepository.findById(notificationId).ifPresent(n -> {
            n.setIsRead(true);
            notificationRepository.save(n);
        });
    }

    @Override
    @Transactional
    public void deleteNotification(Long notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification", "id", notificationId));
        notificationRepository.delete(notification);
        log.info("Notification deleted: id={}", notificationId);
    }

    @Override
    @Transactional(readOnly = true)
    public long getUnreadCount(Long userId) {
        return notificationRepository.countByUserIdAndIsReadFalse(userId);
    }

    private NotificationResponse mapResponse(Notification n) {
        return NotificationResponse.builder()
                .id(n.getId())
                .title(n.getTitle())
                .message(n.getMessage())
                .type(n.getType().name())
                .isRead(n.getIsRead())
                .referenceId(n.getReferenceId())
                .createdAt(n.getCreatedAt())
                .build();
    }
}
