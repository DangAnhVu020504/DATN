package com.speed.delivery.service.impl;

import com.speed.delivery.dto.request.CreateOrderRequest;
import com.speed.delivery.dto.response.OrderHistoryResponse;
import com.speed.delivery.dto.response.OrderResponse;
import com.speed.delivery.entity.*;
import com.speed.delivery.enums.*;
import com.speed.delivery.exception.*;
import com.speed.delivery.repository.*;
import com.speed.delivery.service.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.BDDMockito.*;
import static org.mockito.Mockito.never;

/**
 * Unit Tests cho OrderServiceImpl - 25 test cases.
 * Minh họa mocking với nhiều dependency phức tạp (10 deps).
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("OrderServiceImpl Unit Tests")
class OrderServiceImplTest {

    @Mock private OrderRepository orderRepository;
    @Mock private CustomerRepository customerRepository;
    @Mock private DriverRepository driverRepository;
    @Mock private OrderHistoryRepository orderHistoryRepository;
    @Mock private PaymentService paymentService;
    @Mock private PricingService pricingService;
    @Mock private NotificationService notificationService;
    @Mock private VoucherService voucherService;
    @Mock private DistanceService distanceService;
    @Mock private AuditLogService auditLogService;
    @Mock private WalletService walletService;

    @InjectMocks private OrderServiceImpl orderService;

    private User customerUser;
    private User driverUser;
    private Customer customer;
    private Driver driver;
    private Order testOrder;
    private CreateOrderRequest createRequest;

    @BeforeEach
    void setUp() {
        Role custRole = Role.builder().id(2L).name("ROLE_CUSTOMER").build();
        Role drvRole = Role.builder().id(3L).name("ROLE_DRIVER").build();

        customerUser = User.builder().id(1L).email("customer@speed.vn")
                .fullName("Khách Hàng").phone("0901111111").isActive(true)
                .roles(Set.of(custRole)).build();
        driverUser = User.builder().id(2L).email("driver@speed.vn")
                .fullName("Tài Xế").phone("0902222222").isActive(true)
                .roles(Set.of(drvRole)).build();

        customer = Customer.builder().id(1L).user(customerUser)
                .totalOrders(5).totalSpent(BigDecimal.valueOf(250000)).build();
        driver = Driver.builder().id(1L).user(driverUser).isAvailable(true)
                .status(DriverStatus.ONLINE).totalDeliveries(10)
                .totalEarnings(BigDecimal.valueOf(800000))
                .rating(BigDecimal.valueOf(4.5)).build();

        testOrder = Order.builder().id(1L).orderCode("SPD12345678")
                .customer(customer).status(OrderStatus.PENDING)
                .pickupAddress("123 Nguyen Hue").deliveryAddress("456 Le Loi")
                .pickupContactName("Sender").pickupContactPhone("0901111111")
                .deliveryContactName("Receiver").deliveryContactPhone("0902222222")
                .packageWeight(BigDecimal.valueOf(2)).distanceKm(BigDecimal.valueOf(5))
                .basePrice(BigDecimal.valueOf(15000)).distancePrice(BigDecimal.valueOf(25000))
                .weightSurcharge(BigDecimal.ZERO).discountAmount(BigDecimal.ZERO)
                .totalPrice(BigDecimal.valueOf(40000)).driverEarning(BigDecimal.valueOf(32000))
                .deliveryType(DeliveryType.STANDARD).createdAt(LocalDateTime.now()).build();

        createRequest = CreateOrderRequest.builder()
                .pickupAddress("123 Nguyen Hue").pickupContactName("Sender").pickupContactPhone("0901111111")
                .pickupLatitude(10.77).pickupLongitude(106.70)
                .deliveryAddress("456 Le Loi").deliveryContactName("Receiver").deliveryContactPhone("0902222222")
                .deliveryLatitude(10.78).deliveryLongitude(106.71)
                .packageWeight(BigDecimal.valueOf(2)).deliveryType("STANDARD")
                .paymentMethod("CASH").build();
    }

    // ===== CREATE ORDER =====
    @Nested @DisplayName("Create Order") class CreateOrderTests {
        @Test @DisplayName("Tạo đơn thành công - Happy path")
        void createOrder_Success() {
            given(customerRepository.findAll()).willReturn(List.of(customer));
            given(distanceService.calculateDistance(anyDouble(), anyDouble(), anyDouble(), anyDouble())).willReturn(5.0);
            given(pricingService.calculateDeliveryPrice(anyDouble(), any())).willReturn(BigDecimal.valueOf(40000));
            given(pricingService.calculateBasePrice()).willReturn(BigDecimal.valueOf(15000));
            given(pricingService.calculateDistancePrice(anyDouble())).willReturn(BigDecimal.valueOf(25000));
            given(pricingService.calculateWeightSurcharge(any())).willReturn(BigDecimal.ZERO);
            given(pricingService.calculateDriverEarnings(any())).willReturn(BigDecimal.valueOf(32000));
            given(orderRepository.save(any(Order.class))).willReturn(testOrder);
            given(orderHistoryRepository.save(any())).willReturn(OrderHistory.builder().build());
            given(paymentService.processPayment(anyLong(), any(), any())).willReturn(true);
            given(customerRepository.save(any())).willReturn(customer);

            OrderResponse response = orderService.createOrder("customer@speed.vn", createRequest);

            assertThat(response).isNotNull();
            assertThat(response.getOrderCode()).isEqualTo("SPD12345678");
            assertThat(response.getTotalPrice()).isEqualTo(BigDecimal.valueOf(40000));

            then(distanceService).should().calculateDistance(anyDouble(), anyDouble(), anyDouble(), anyDouble());
            then(pricingService).should().calculateDeliveryPrice(eq(5.0), any());
            then(paymentService).should().processPayment(eq(1L), any(), eq(PaymentMethod.CASH));
            then(notificationService).should().sendOrderNotification(eq(1L), eq(1L), anyString(), anyString());
            then(auditLogService).should().log(anyLong(), eq("CREATE_ORDER"), anyString(), anyLong(), anyString());
        }

        @Test @DisplayName("Tạo đơn - Customer không tồn tại")
        void createOrder_CustomerNotFound() {
            given(customerRepository.findAll()).willReturn(List.of());
            assertThatThrownBy(() -> orderService.createOrder("unknown@speed.vn", createRequest))
                    .isInstanceOf(ResourceNotFoundException.class);
        }

        @Test @DisplayName("Tạo đơn với voucher")
        void createOrder_WithVoucher() {
            createRequest.setVoucherCode("SALE20");
            Voucher voucher = Voucher.builder().id(1L).code("SALE20").build();

            given(customerRepository.findAll()).willReturn(List.of(customer));
            given(distanceService.calculateDistance(anyDouble(), anyDouble(), anyDouble(), anyDouble())).willReturn(5.0);
            given(pricingService.calculateDeliveryPrice(anyDouble(), any())).willReturn(BigDecimal.valueOf(40000));
            given(pricingService.calculateBasePrice()).willReturn(BigDecimal.valueOf(15000));
            given(pricingService.calculateDistancePrice(anyDouble())).willReturn(BigDecimal.valueOf(25000));
            given(pricingService.calculateWeightSurcharge(any())).willReturn(BigDecimal.ZERO);
            given(pricingService.calculateDriverEarnings(any())).willReturn(BigDecimal.valueOf(28000));
            given(voucherService.validateVoucher("SALE20", BigDecimal.valueOf(40000))).willReturn(voucher);
            given(voucherService.applyVoucher(voucher, BigDecimal.valueOf(40000))).willReturn(BigDecimal.valueOf(5000));
            given(orderRepository.save(any(Order.class))).willReturn(testOrder);
            given(orderHistoryRepository.save(any())).willReturn(OrderHistory.builder().build());
            given(paymentService.processPayment(anyLong(), any(), any())).willReturn(true);
            given(customerRepository.save(any())).willReturn(customer);

            orderService.createOrder("customer@speed.vn", createRequest);

            then(voucherService).should().validateVoucher("SALE20", BigDecimal.valueOf(40000));
            then(voucherService).should().applyVoucher(eq(voucher), any());
        }

        @Test @DisplayName("Tạo đơn - verify ArgumentCaptor cho Order save")
        void createOrder_VerifyOrderSaved() {
            ArgumentCaptor<Order> orderCaptor = ArgumentCaptor.forClass(Order.class);

            given(customerRepository.findAll()).willReturn(List.of(customer));
            given(distanceService.calculateDistance(anyDouble(), anyDouble(), anyDouble(), anyDouble())).willReturn(3.0);
            given(pricingService.calculateDeliveryPrice(anyDouble(), any())).willReturn(BigDecimal.valueOf(30000));
            given(pricingService.calculateBasePrice()).willReturn(BigDecimal.valueOf(15000));
            given(pricingService.calculateDistancePrice(anyDouble())).willReturn(BigDecimal.valueOf(15000));
            given(pricingService.calculateWeightSurcharge(any())).willReturn(BigDecimal.ZERO);
            given(pricingService.calculateDriverEarnings(any())).willReturn(BigDecimal.valueOf(24000));
            given(orderRepository.save(any(Order.class))).willReturn(testOrder);
            given(orderHistoryRepository.save(any())).willReturn(OrderHistory.builder().build());
            given(paymentService.processPayment(anyLong(), any(), any())).willReturn(true);
            given(customerRepository.save(any())).willReturn(customer);

            orderService.createOrder("customer@speed.vn", createRequest);

            then(orderRepository).should().save(orderCaptor.capture());
            Order saved = orderCaptor.getValue();
            assertThat(saved.getPickupAddress()).isEqualTo("123 Nguyen Hue");
            assertThat(saved.getDeliveryAddress()).isEqualTo("456 Le Loi");
            assertThat(saved.getStatus()).isEqualTo(OrderStatus.PENDING);
        }
    }

    // ===== GET ORDER =====
    @Nested @DisplayName("Get Order") class GetOrderTests {
        @Test @DisplayName("Lấy đơn theo ID")
        void getOrderById_Success() {
            when(orderRepository.findById(1L)).thenReturn(Optional.of(testOrder));
            OrderResponse res = orderService.getOrderById(1L);
            assertThat(res.getId()).isEqualTo(1L);
        }

        @Test @DisplayName("Lấy đơn theo ID - không tìm thấy")
        void getOrderById_NotFound() {
            when(orderRepository.findById(99L)).thenReturn(Optional.empty());
            assertThatThrownBy(() -> orderService.getOrderById(99L))
                    .isInstanceOf(ResourceNotFoundException.class);
        }

        @Test @DisplayName("Lấy đơn theo mã code")
        void getOrderByCode_Success() {
            when(orderRepository.findByOrderCode("SPD12345678")).thenReturn(Optional.of(testOrder));
            OrderResponse res = orderService.getOrderByCode("SPD12345678");
            assertThat(res.getOrderCode()).isEqualTo("SPD12345678");
        }

        @Test @DisplayName("Danh sách đơn hàng customer (pagination)")
        void getCustomerOrders_WithPagination() {
            PageRequest pageable = PageRequest.of(0, 10);
            Page<Order> page = new PageImpl<>(List.of(testOrder), pageable, 1);
            when(orderRepository.findByCustomerIdOrderByCreatedAtDesc(1L, pageable)).thenReturn(page);
            Page<OrderResponse> result = orderService.getCustomerOrders(1L, pageable);
            assertThat(result.getTotalElements()).isEqualTo(1);
            assertThat(result.getContent().get(0).getOrderCode()).isEqualTo("SPD12345678");
        }
    }

    // ===== AVAILABLE ORDERS & HISTORY =====
    @Nested @DisplayName("Available Orders & History") class AvailableOrdersAndHistoryTests {
        @Test @DisplayName("ORD-TC18: Lấy danh sách đơn mới (PENDING + CONFIRMED) cho tài xế")
        void getAvailableOrders_Success() {
            // Arrange: 1 đơn PENDING + 1 đơn CONFIRMED
            Order confirmedOrder = Order.builder().id(2L).orderCode("SPD87654321")
                    .customer(customer).status(OrderStatus.CONFIRMED)
                    .deliveryType(DeliveryType.STANDARD).build();
            given(orderRepository.findByStatus(OrderStatus.PENDING)).willReturn(List.of(testOrder));
            given(orderRepository.findByStatus(OrderStatus.CONFIRMED)).willReturn(List.of(confirmedOrder));

            // Act
            List<OrderResponse> result = orderService.getAvailableOrders();

            // Assert: gộp cả 2 trạng thái
            assertThat(result).hasSize(2);
            assertThat(result).extracting(OrderResponse::getStatus)
                    .containsExactly("PENDING", "CONFIRMED");

            // Verify: query cả 2 trạng thái
            then(orderRepository).should(times(1)).findByStatus(OrderStatus.PENDING);
            then(orderRepository).should(times(1)).findByStatus(OrderStatus.CONFIRMED);
        }

        @Test @DisplayName("ORD-TC19: Lấy lịch sử đơn hàng - map đủ trường")
        void getOrderHistory_Success() {
            // Arrange
            OrderHistory h1 = OrderHistory.builder().id(1L).order(testOrder)
                    .status(OrderStatus.PENDING).note("Đơn hàng được tạo")
                    .changedBy(1L).createdAt(LocalDateTime.of(2026, 10, 1, 9, 0)).build();
            OrderHistory h2 = OrderHistory.builder().id(2L).order(testOrder)
                    .status(OrderStatus.CONFIRMED).note("Đã xác nhận")
                    .changedBy(1L).createdAt(LocalDateTime.of(2026, 10, 1, 9, 5)).build();
            given(orderRepository.findById(1L)).willReturn(Optional.of(testOrder));
            given(orderHistoryRepository.findByOrderIdOrderByCreatedAtDesc(1L))
                    .willReturn(List.of(h2, h1));

            // Act
            List<OrderHistoryResponse> result = orderService.getOrderHistory(1L);

            // Assert
            assertThat(result).hasSize(2);
            assertThat(result.get(0).getStatus()).isEqualTo("CONFIRMED");
            assertThat(result.get(0).getNote()).isEqualTo("Đã xác nhận");
            assertThat(result.get(1).getStatus()).isEqualTo("PENDING");

            // Verify
            then(orderHistoryRepository).should(times(1))
                    .findByOrderIdOrderByCreatedAtDesc(1L);
        }

        @Test @DisplayName("ORD-TC20: Lấy lịch sử - đơn không tồn tại → ResourceNotFoundException")
        void getOrderHistory_NotFound() {
            // Arrange
            given(orderRepository.findById(99L)).willReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> orderService.getOrderHistory(99L))
                    .isInstanceOf(ResourceNotFoundException.class);

            // Verify: KHÔNG query lịch sử khi đơn không tồn tại
            then(orderHistoryRepository).shouldHaveNoInteractions();
        }
    }

    // ===== ASSIGN DRIVER =====
    @Nested @DisplayName("Assign Driver") class AssignDriverTests {
        @Test @DisplayName("Gán tài xế thành công")
        void assignDriver_Success() {
            testOrder.setStatus(OrderStatus.PENDING);
            when(orderRepository.findById(1L)).thenReturn(Optional.of(testOrder));
            when(driverRepository.findById(1L)).thenReturn(Optional.of(driver));
            when(orderRepository.save(any())).thenReturn(testOrder);
            when(orderHistoryRepository.save(any())).thenReturn(OrderHistory.builder().build());
            when(driverRepository.save(any())).thenReturn(driver);

            orderService.assignDriver(1L, 1L);

            assertThat(testOrder.getStatus()).isEqualTo(OrderStatus.ASSIGNED);
            assertThat(testOrder.getDriver()).isEqualTo(driver);
            assertThat(driver.getIsAvailable()).isFalse();
            assertThat(driver.getStatus()).isEqualTo(DriverStatus.BUSY);
        }

        @Test @DisplayName("Gán tài xế - đơn sai trạng thái")
        void assignDriver_WrongStatus() {
            testOrder.setStatus(OrderStatus.DELIVERED);
            when(orderRepository.findById(1L)).thenReturn(Optional.of(testOrder));
            assertThatThrownBy(() -> orderService.assignDriver(1L, 1L))
                    .isInstanceOf(BadRequestException.class)
                    .hasMessageContaining("Không thể gán tài xế");
        }

        @Test @DisplayName("Gán tài xế - driver không khả dụng")
        void assignDriver_DriverUnavailable() {
            driver.setIsAvailable(false);
            when(orderRepository.findById(1L)).thenReturn(Optional.of(testOrder));
            when(driverRepository.findById(1L)).thenReturn(Optional.of(driver));
            assertThatThrownBy(() -> orderService.assignDriver(1L, 1L))
                    .isInstanceOf(BadRequestException.class)
                    .hasMessageContaining("không khả dụng");
        }

        @Test @DisplayName("Gán tài xế - verify thông báo gửi cho cả 2 bên")
        void assignDriver_VerifyNotifications() {
            when(orderRepository.findById(1L)).thenReturn(Optional.of(testOrder));
            when(driverRepository.findById(1L)).thenReturn(Optional.of(driver));
            when(orderRepository.save(any())).thenReturn(testOrder);
            when(orderHistoryRepository.save(any())).thenReturn(OrderHistory.builder().build());
            when(driverRepository.save(any())).thenReturn(driver);

            orderService.assignDriver(1L, 1L);

            // Verify 2 notifications: 1 for customer, 1 for driver
            then(notificationService).should(times(2)).sendOrderNotification(anyLong(), anyLong(), anyString(), anyString());
        }
    }

    // ===== UPDATE STATUS =====
    @Nested @DisplayName("Update Status") class StatusTests {
        @Test @DisplayName("Cập nhật PENDING → CONFIRMED")
        void updateStatus_PendingToConfirmed() {
            testOrder.setStatus(OrderStatus.PENDING);
            when(orderRepository.findById(1L)).thenReturn(Optional.of(testOrder));
            when(orderRepository.save(any())).thenReturn(testOrder);
            when(orderHistoryRepository.save(any())).thenReturn(OrderHistory.builder().build());

            orderService.updateOrderStatus(1L, "CONFIRMED", 1L);
            assertThat(testOrder.getStatus()).isEqualTo(OrderStatus.CONFIRMED);
        }

        @Test @DisplayName("Cập nhật IN_TRANSIT → DELIVERED (driver stats update)")
        void updateStatus_Delivered() {
            testOrder.setStatus(OrderStatus.IN_TRANSIT);
            testOrder.setDriver(driver);
            when(orderRepository.findById(1L)).thenReturn(Optional.of(testOrder));
            when(orderRepository.save(any())).thenReturn(testOrder);
            when(orderHistoryRepository.save(any())).thenReturn(OrderHistory.builder().build());
            when(driverRepository.save(any())).thenReturn(driver);

            orderService.updateOrderStatus(1L, "DELIVERED", 2L);

            assertThat(testOrder.getStatus()).isEqualTo(OrderStatus.DELIVERED);
            assertThat(driver.getTotalDeliveries()).isEqualTo(11);
            assertThat(driver.getIsAvailable()).isTrue();

            // Verify: thu nhập được cộng vào ví tài xế
            then(walletService).should(times(1)).addEarning(eq(1L), eq(1L), any(BigDecimal.class));
        }

        @Test @DisplayName("Cập nhật trạng thái không hợp lệ (DELIVERED → PENDING)")
        void updateStatus_InvalidTransition() {
            testOrder.setStatus(OrderStatus.DELIVERED);
            when(orderRepository.findById(1L)).thenReturn(Optional.of(testOrder));
            assertThatThrownBy(() -> orderService.updateOrderStatus(1L, "PENDING", 1L))
                    .isInstanceOf(BadRequestException.class)
                    .hasMessageContaining("Không thể chuyển trạng thái");
        }
    }

    // ===== CANCEL ORDER =====
    @Nested @DisplayName("Cancel Order") class CancelTests {
        @Test @DisplayName("Hủy đơn thành công")
        void cancelOrder_Success() {
            testOrder.setDriver(driver);
            when(orderRepository.findById(1L)).thenReturn(Optional.of(testOrder));
            when(orderRepository.save(any())).thenReturn(testOrder);
            when(orderHistoryRepository.save(any())).thenReturn(OrderHistory.builder().build());
            when(paymentService.refundPayment(1L)).thenReturn(true);
            when(driverRepository.save(any())).thenReturn(driver);

            orderService.cancelOrder(1L, "Khách thay đổi", 1L);

            assertThat(testOrder.getStatus()).isEqualTo(OrderStatus.CANCELLED);
            assertThat(driver.getIsAvailable()).isTrue();
            then(paymentService).should().refundPayment(1L);
            then(notificationService).should().sendOrderNotification(anyLong(), anyLong(), anyString(), contains("hủy"));
        }

        @Test @DisplayName("Hủy đơn đã giao - thất bại")
        void cancelOrder_AlreadyDelivered() {
            testOrder.setStatus(OrderStatus.DELIVERED);
            when(orderRepository.findById(1L)).thenReturn(Optional.of(testOrder));
            assertThatThrownBy(() -> orderService.cancelOrder(1L, "reason", 1L))
                    .isInstanceOf(BadRequestException.class);
            then(paymentService).should(never()).refundPayment(anyLong());
        }
    }
}
