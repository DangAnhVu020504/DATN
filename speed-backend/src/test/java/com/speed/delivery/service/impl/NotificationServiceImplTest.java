package com.speed.delivery.service.impl;

import com.speed.delivery.dto.response.NotificationResponse;
import com.speed.delivery.entity.Notification;
import com.speed.delivery.entity.User;
import com.speed.delivery.enums.NotificationType;
import com.speed.delivery.repository.NotificationRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.BDDMockito.*;

/**
 * Unit Tests cho NotificationServiceImpl - 7 test cases.
 *
 * <p>Kỹ thuật sử dụng:</p>
 * <ul>
 *   <li>BDDMockito thuần túy: given/willReturn, then/should</li>
 *   <li>ArgumentCaptor: Bắt đối tượng Notification truyền vào save()</li>
 *   <li>Pattern: Arrange → Act → Assert → Verify</li>
 * </ul>
 *
 * <p>Dependencies cần mock:</p>
 * <ul>
 *   <li>NotificationRepository</li>
 * </ul>
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("NotificationServiceImpl Unit Tests")
class NotificationServiceImplTest {

    // ===== MOCK DEPENDENCIES =====
    @Mock private NotificationRepository notificationRepository;

    // ===== CLASS UNDER TEST =====
    @InjectMocks private NotificationServiceImpl notificationService;

    // ===== TEST DATA =====
    private Notification testNotification;

    @BeforeEach
    void setUp() {
        // Arrange chung: Khởi tạo dữ liệu test
        testNotification = Notification.builder()
                .id(1L)
                .user(User.builder().id(1L).build())
                .title("Đơn hàng mới")
                .message("Bạn có đơn hàng SPD12345678")
                .type(NotificationType.ORDER)
                .isRead(false)
                .referenceId(1L)
                .createdAt(LocalDateTime.now())
                .build();
    }

    // ==================== SEND NOTIFICATION ====================
    @Nested
    @DisplayName("Send Notification")
    class SendNotificationTests {

        @Test
        @DisplayName("NF-TC01: Gửi notification thành công - isRead = false")
        void sendNotification_Success() {
            // Arrange: ArgumentCaptor để bắt Notification
            ArgumentCaptor<Notification> notifCaptor = ArgumentCaptor.forClass(Notification.class);
            given(notificationRepository.save(any(Notification.class))).willReturn(testNotification);

            // Act: Gửi notification
            notificationService.sendNotification(1L, "Chào mừng", "Chào mừng bạn đến Speed", "SYSTEM");

            // Verify: Notification được save
            then(notificationRepository).should(times(1)).save(notifCaptor.capture());

            // Assert: Kiểm tra Notification captured
            Notification captured = notifCaptor.getValue();
            assertThat(captured.getUser().getId()).isEqualTo(1L);
            assertThat(captured.getTitle()).isEqualTo("Chào mừng");
            assertThat(captured.getMessage()).isEqualTo("Chào mừng bạn đến Speed");
            assertThat(captured.getType()).isEqualTo(NotificationType.SYSTEM);
            assertThat(captured.getIsRead()).isFalse();
        }

        @Test
        @DisplayName("NF-TC02: Gửi order notification - type = ORDER, referenceId = orderId")
        void sendOrderNotification_Success() {
            // Arrange: ArgumentCaptor để bắt Notification
            ArgumentCaptor<Notification> notifCaptor = ArgumentCaptor.forClass(Notification.class);
            given(notificationRepository.save(any(Notification.class))).willReturn(testNotification);

            // Act: Gửi order notification
            notificationService.sendOrderNotification(1L, 100L, "Đặt hàng thành công", "Đơn hàng SPD12345678 đã được tạo");

            // Verify: Notification được save
            then(notificationRepository).should(times(1)).save(notifCaptor.capture());

            // Assert: Kiểm tra type = ORDER và referenceId = orderId
            Notification captured = notifCaptor.getValue();
            assertThat(captured.getType()).isEqualTo(NotificationType.ORDER);
            assertThat(captured.getReferenceId()).isEqualTo(100L);
            assertThat(captured.getTitle()).isEqualTo("Đặt hàng thành công");
            assertThat(captured.getIsRead()).isFalse();
        }

        @Test
        @DisplayName("NF-TC03: ArgumentCaptor - verify notification content chính xác")
        void sendNotification_VerifyContent() {
            // Arrange
            ArgumentCaptor<Notification> notifCaptor = ArgumentCaptor.forClass(Notification.class);
            given(notificationRepository.save(any(Notification.class))).willReturn(testNotification);

            // Act: Gửi notification với nội dung cụ thể
            notificationService.sendNotification(5L, "Tài xế đã nhận đơn", "Tài xế Nguyen Van A đang đến lấy hàng", "ORDER");

            // Verify & Assert: Capture và kiểm tra
            then(notificationRepository).should().save(notifCaptor.capture());
            Notification captured = notifCaptor.getValue();
            assertThat(captured.getUser().getId()).isEqualTo(5L);
            assertThat(captured.getTitle()).isEqualTo("Tài xế đã nhận đơn");
            assertThat(captured.getMessage()).contains("Nguyen Van A");
        }
    }

    // ==================== GET USER NOTIFICATIONS ====================
    @Test
    @DisplayName("NF-TC04: Lấy notifications (phân trang)")
    void getUserNotifications_Success() {
        // Arrange: NotificationRepository trả về Page<Notification>
        PageRequest pageable = PageRequest.of(0, 10);
        Page<Notification> page = new PageImpl<>(List.of(testNotification), pageable, 1);
        given(notificationRepository.findByUserIdOrderByCreatedAtDesc(1L, pageable)).willReturn(page);

        // Act: Lấy notifications
        List<NotificationResponse> result = notificationService.getUserNotifications(1L, pageable);

        // Assert: Trả về đúng dữ liệu
        assertThat(result).hasSize(1);
        assertThat(result.get(0).getTitle()).isEqualTo("Đơn hàng mới");
        assertThat(result.get(0).getType()).isEqualTo("ORDER");
        assertThat(result.get(0).getIsRead()).isFalse();

        // Verify: Repository được gọi đúng 1 lần
        then(notificationRepository).should(times(1))
                .findByUserIdOrderByCreatedAtDesc(1L, pageable);
    }

    // ==================== MARK AS READ ====================
    @Nested
    @DisplayName("Mark As Read")
    class MarkAsReadTests {

        @Test
        @DisplayName("NF-TC05: Đánh dấu đã đọc - thành công")
        void markAsRead_Success() {
            // Arrange: Notification tồn tại, chưa đọc
            given(notificationRepository.findById(1L)).willReturn(Optional.of(testNotification));
            given(notificationRepository.save(any(Notification.class))).willReturn(testNotification);

            // Act: Đánh dấu đã đọc
            notificationService.markAsRead(1L);

            // Assert: isRead = true
            assertThat(testNotification.getIsRead()).isTrue();

            // Verify: Notification được save lại
            then(notificationRepository).should(times(1)).findById(1L);
            then(notificationRepository).should(times(1)).save(testNotification);
        }

        @Test
        @DisplayName("NF-TC06: Đánh dấu đã đọc - không tìm thấy → silent (không throw)")
        void markAsRead_NotFound() {
            // Arrange: Notification không tồn tại
            given(notificationRepository.findById(999L)).willReturn(Optional.empty());

            // Act & Assert: Không throw exception (silent)
            assertThatCode(() -> notificationService.markAsRead(999L))
                    .doesNotThrowAnyException();

            // Verify: KHÔNG gọi save (vì ifPresent không thỏa)
            then(notificationRepository).should(times(1)).findById(999L);
            then(notificationRepository).should(never()).save(any(Notification.class));
        }
    }

    // ==================== UNREAD COUNT ====================
    @Test
    @DisplayName("NF-TC07: Đếm notification chưa đọc")
    void getUnreadCount_Success() {
        // Arrange: Mock count query
        given(notificationRepository.countByUserIdAndIsReadFalse(1L)).willReturn(5L);

        // Act: Đếm chưa đọc
        long count = notificationService.getUnreadCount(1L);

        // Assert: Trả về đúng giá trị
        assertThat(count).isEqualTo(5);

        // Verify: Repository được gọi đúng 1 lần
        then(notificationRepository).should(times(1)).countByUserIdAndIsReadFalse(1L);
    }
}
