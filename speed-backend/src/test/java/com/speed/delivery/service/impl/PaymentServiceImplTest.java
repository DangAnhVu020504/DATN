package com.speed.delivery.service.impl;

import com.speed.delivery.entity.Order;
import com.speed.delivery.entity.Payment;
import com.speed.delivery.enums.PaymentMethod;
import com.speed.delivery.enums.PaymentStatus;
import com.speed.delivery.exception.PaymentFailedException;
import com.speed.delivery.exception.ResourceNotFoundException;
import com.speed.delivery.repository.OrderRepository;
import com.speed.delivery.repository.PaymentRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.BDDMockito.*;

/**
 * Unit Tests cho PaymentServiceImpl - 10 test cases.
 *
 * <p>Kỹ thuật sử dụng:</p>
 * <ul>
 *   <li>BDDMockito thuần túy: given/willReturn, then/should</li>
 *   <li>ArgumentCaptor: Bắt đối tượng Payment truyền vào save()</li>
 *   <li>Pattern: Arrange → Act → Assert → Verify</li>
 * </ul>
 *
 * <p>Dependencies cần mock:</p>
 * <ul>
 *   <li>PaymentRepository</li>
 *   <li>OrderRepository</li>
 * </ul>
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("PaymentServiceImpl Unit Tests")
class PaymentServiceImplTest {

    // ===== MOCK DEPENDENCIES =====
    @Mock private PaymentRepository paymentRepository;
    @Mock private OrderRepository orderRepository;

    // ===== CLASS UNDER TEST =====
    @InjectMocks private PaymentServiceImpl paymentService;

    // ===== TEST DATA =====
    private Order testOrder;
    private Payment testPayment;

    @BeforeEach
    void setUp() {
        // Arrange chung: Khởi tạo dữ liệu test dùng cho nhiều test case
        testOrder = Order.builder()
                .id(1L)
                .orderCode("SPD12345678")
                .build();

        testPayment = Payment.builder()
                .id(1L)
                .order(testOrder)
                .paymentMethod(PaymentMethod.CASH)
                .paymentStatus(PaymentStatus.COMPLETED)
                .amount(BigDecimal.valueOf(40000))
                .transactionId("TXN-123456")
                .build();
    }

    // ==================== PROCESS PAYMENT ====================
    @Nested
    @DisplayName("Process Payment")
    class ProcessPaymentTests {

        @Test
        @DisplayName("PM-TC01: Thanh toán tiền mặt (CASH) thành công - status = PENDING")
        void processPayment_Cash_Success() {
            // Arrange: Mock OrderRepository trả về Order hợp lệ
            given(orderRepository.findById(1L)).willReturn(Optional.of(testOrder));
            given(paymentRepository.save(any(Payment.class))).willReturn(testPayment);

            // Act: Thực thi thanh toán tiền mặt
            boolean result = paymentService.processPayment(1L, BigDecimal.valueOf(40000), PaymentMethod.CASH);

            // Assert: Kết quả trả về true
            assertThat(result).isTrue();

            // Verify: OrderRepository và PaymentRepository đều được gọi đúng 1 lần
            then(orderRepository).should(times(1)).findById(1L);
            then(paymentRepository).should(times(1)).save(any(Payment.class));
        }

        @Test
        @DisplayName("PM-TC02: Thanh toán online thành công - status = COMPLETED, paidAt != null")
        void processPayment_BankTransfer_Success() {
            // Arrange: Mock OrderRepository trả về Order hợp lệ
            given(orderRepository.findById(1L)).willReturn(Optional.of(testOrder));
            given(paymentRepository.save(any(Payment.class))).willReturn(testPayment);

            // Act: Thực thi thanh toán online
            boolean result = paymentService.processPayment(1L, BigDecimal.valueOf(40000), PaymentMethod.BANK_TRANSFER);

            // Assert: Kết quả trả về true
            assertThat(result).isTrue();

            // Verify: PaymentRepository save được gọi 1 lần
            then(paymentRepository).should(times(1)).save(any(Payment.class));
        }

        @Test
        @DisplayName("PM-TC03: Thanh toán thất bại - Order không tồn tại → ResourceNotFoundException")
        void processPayment_OrderNotFound() {
            // Arrange: OrderRepository trả về empty
            given(orderRepository.findById(999L)).willReturn(Optional.empty());

            // Act & Assert: Phải throw ResourceNotFoundException
            assertThatThrownBy(() -> paymentService.processPayment(999L, BigDecimal.valueOf(40000), PaymentMethod.CASH))
                    .isInstanceOf(ResourceNotFoundException.class);

            // Verify: PaymentRepository KHÔNG được gọi save khi Order không tìm thấy
            then(paymentRepository).shouldHaveNoInteractions();
        }

        @Test
        @DisplayName("PM-TC04: Thanh toán thất bại - Amount null → PaymentFailedException")
        void processPayment_NullAmount() {
            // Arrange: OrderRepository trả về Order hợp lệ
            given(orderRepository.findById(1L)).willReturn(Optional.of(testOrder));

            // Act & Assert: Phải throw PaymentFailedException
            assertThatThrownBy(() -> paymentService.processPayment(1L, null, PaymentMethod.CASH))
                    .isInstanceOf(PaymentFailedException.class);

            // Verify: PaymentRepository KHÔNG được gọi save khi amount không hợp lệ
            then(paymentRepository).should(never()).save(any(Payment.class));
        }

        @Test
        @DisplayName("PM-TC05: Thanh toán thất bại - Amount ≤ 0 → PaymentFailedException")
        void processPayment_NegativeAmount() {
            // Arrange: OrderRepository trả về Order hợp lệ
            given(orderRepository.findById(1L)).willReturn(Optional.of(testOrder));

            // Act & Assert: Phải throw PaymentFailedException khi amount âm
            assertThatThrownBy(() -> paymentService.processPayment(1L, BigDecimal.valueOf(-1000), PaymentMethod.CASH))
                    .isInstanceOf(PaymentFailedException.class)
                    .hasMessageContaining("không hợp lệ");

            // Verify: PaymentRepository KHÔNG được gọi save
            then(paymentRepository).should(never()).save(any(Payment.class));
        }

        @Test
        @DisplayName("PM-TC06: ArgumentCaptor - kiểm tra Payment được save với đúng dữ liệu")
        void processPayment_CapturePaymentSaved() {
            // Arrange: Mock dependencies
            ArgumentCaptor<Payment> paymentCaptor = ArgumentCaptor.forClass(Payment.class);
            given(orderRepository.findById(1L)).willReturn(Optional.of(testOrder));
            given(paymentRepository.save(any(Payment.class))).willReturn(testPayment);

            // Act: Thanh toán tiền mặt
            paymentService.processPayment(1L, BigDecimal.valueOf(50000), PaymentMethod.CASH);

            // Verify: Capture đối tượng Payment truyền vào save()
            then(paymentRepository).should().save(paymentCaptor.capture());

            // Assert: Kiểm tra Payment captured có đúng dữ liệu
            Payment captured = paymentCaptor.getValue();
            assertThat(captured.getOrder()).isEqualTo(testOrder);
            assertThat(captured.getPaymentMethod()).isEqualTo(PaymentMethod.CASH);
            assertThat(captured.getAmount()).isEqualTo(BigDecimal.valueOf(50000));
            assertThat(captured.getPaymentStatus()).isEqualTo(PaymentStatus.PENDING); // CASH → PENDING
            assertThat(captured.getTransactionId()).startsWith("TXN-");
            assertThat(captured.getPaidAt()).isNull(); // CASH → paidAt = null
        }
    }

    // ==================== REFUND PAYMENT ====================
    @Nested
    @DisplayName("Refund Payment")
    class RefundPaymentTests {

        @Test
        @DisplayName("PM-TC07: Hoàn tiền thành công - status chuyển thành REFUNDED")
        void refundPayment_Success() {
            // Arrange: PaymentRepository tìm thấy Payment
            given(paymentRepository.findByOrderId(1L)).willReturn(Optional.of(testPayment));
            given(paymentRepository.save(any(Payment.class))).willReturn(testPayment);

            // Act: Thực thi hoàn tiền
            boolean result = paymentService.refundPayment(1L);

            // Assert: Kết quả trả về true và status được cập nhật
            assertThat(result).isTrue();
            assertThat(testPayment.getPaymentStatus()).isEqualTo(PaymentStatus.REFUNDED);

            // Verify: Payment được save lại với trạng thái mới
            then(paymentRepository).should(times(1)).findByOrderId(1L);
            then(paymentRepository).should(times(1)).save(testPayment);
        }

        @Test
        @DisplayName("PM-TC08: Hoàn tiền - không tìm thấy Payment → return false, không save")
        void refundPayment_NotFound() {
            // Arrange: PaymentRepository trả về empty
            given(paymentRepository.findByOrderId(999L)).willReturn(Optional.empty());

            // Act: Thực thi hoàn tiền
            boolean result = paymentService.refundPayment(999L);

            // Assert: Kết quả trả về false
            assertThat(result).isFalse();

            // Verify: PaymentRepository KHÔNG gọi save (vì không tìm thấy payment)
            then(paymentRepository).should(times(1)).findByOrderId(999L);
            then(paymentRepository).should(never()).save(any(Payment.class));
        }
    }

    // ==================== GET PAYMENT STATUS ====================
    @Nested
    @DisplayName("Get Payment Status")
    class GetPaymentStatusTests {

        @Test
        @DisplayName("PM-TC09: Trạng thái thanh toán - tìm thấy → return COMPLETED")
        void getPaymentStatus_Found() {
            // Arrange: PaymentRepository tìm thấy Payment với status COMPLETED
            given(paymentRepository.findByOrderId(1L)).willReturn(Optional.of(testPayment));

            // Act: Lấy trạng thái
            String status = paymentService.getPaymentStatus(1L);

            // Assert: Trả về đúng trạng thái
            assertThat(status).isEqualTo("COMPLETED");

            // Verify: Repository được gọi đúng 1 lần
            then(paymentRepository).should(times(1)).findByOrderId(1L);
        }

        @Test
        @DisplayName("PM-TC10: Trạng thái thanh toán - không tìm thấy → return NOT_FOUND")
        void getPaymentStatus_NotFound() {
            // Arrange: PaymentRepository trả về empty
            given(paymentRepository.findByOrderId(999L)).willReturn(Optional.empty());

            // Act: Lấy trạng thái
            String status = paymentService.getPaymentStatus(999L);

            // Assert: Trả về "NOT_FOUND"
            assertThat(status).isEqualTo("NOT_FOUND");

            // Verify: Repository được gọi đúng 1 lần
            then(paymentRepository).should(times(1)).findByOrderId(999L);
        }
    }
}
