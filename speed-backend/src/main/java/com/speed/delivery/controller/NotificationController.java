package com.speed.delivery.controller;

import com.speed.delivery.dto.response.ApiResponse;
import com.speed.delivery.dto.response.NotificationResponse;
import com.speed.delivery.service.NotificationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controller quản lý thông báo.
 */
@RestController
@RequestMapping("/notifications")
@RequiredArgsConstructor
@Tag(name = "Notifications", description = "API thông báo")
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping("/user/{userId}")
    @Operation(summary = "Danh sách thông báo của user")
    public ResponseEntity<ApiResponse<List<NotificationResponse>>> getUserNotifications(
            @PathVariable Long userId, Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(notificationService.getUserNotifications(userId, pageable)));
    }

    @PutMapping("/{id}/read")
    @Operation(summary = "Đánh dấu đã đọc")
    public ResponseEntity<ApiResponse<Void>> markAsRead(@PathVariable Long id) {
        notificationService.markAsRead(id);
        return ResponseEntity.ok(ApiResponse.success("Đã đánh dấu đã đọc"));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Xóa thông báo")
    public ResponseEntity<ApiResponse<Void>> deleteNotification(@PathVariable Long id) {
        notificationService.deleteNotification(id);
        return ResponseEntity.ok(ApiResponse.success("Đã xóa thông báo"));
    }

    @GetMapping("/user/{userId}/unread-count")
    @Operation(summary = "Số thông báo chưa đọc")
    public ResponseEntity<ApiResponse<Long>> getUnreadCount(@PathVariable Long userId) {
        return ResponseEntity.ok(ApiResponse.success(notificationService.getUnreadCount(userId)));
    }

    @PostMapping
    @Operation(summary = "Gửi thông báo")
    public ResponseEntity<ApiResponse<Void>> sendNotification(
            @RequestParam Long userId, @RequestParam String title,
            @RequestParam String message, @RequestParam String type) {
        notificationService.sendNotification(userId, title, message, type);
        return ResponseEntity.ok(ApiResponse.success("Đã gửi thông báo"));
    }

    @PostMapping("/order")
    @Operation(summary = "Gửi thông báo đơn hàng")
    public ResponseEntity<ApiResponse<Void>> sendOrderNotification(
            @RequestParam Long userId, @RequestParam Long orderId,
            @RequestParam String title, @RequestParam String message) {
        notificationService.sendOrderNotification(userId, orderId, title, message);
        return ResponseEntity.ok(ApiResponse.success("Đã gửi thông báo đơn hàng"));
    }
}
