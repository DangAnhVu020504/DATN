package com.speed.delivery.service.impl;

import com.speed.delivery.dto.response.DriverResponse;
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
import org.mockito.InOrder;
import org.mockito.InjectMocks;
import org.mockito.Mock;
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

/**
 * Unit Tests cho DriverServiceImpl - 18 test cases.
 *
 * <p>Kỹ thuật sử dụng:</p>
 * <ul>
 *   <li>BDDMockito thuần túy: given/willReturn, then/should, shouldHaveNoInteractions</li>
 *   <li>Mock Service-to-Service: OrderService (service phụ thuộc service)</li>
 *   <li>InOrder: Kiểm tra thứ tự gọi dependency</li>
 *   <li>Pattern: Arrange → Act → Assert → Verify</li>
 * </ul>
 *
 * <p>Dependencies cần mock:</p>
 * <ul>
 *   <li>DriverRepository</li>
 *   <li>OrderRepository</li>
 *   <li>OrderService (Service-to-Service mock)</li>
 *   <li>NotificationService</li>
 *   <li>AuditLogService</li>
 * </ul>
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("DriverServiceImpl Unit Tests")
class DriverServiceImplTest {

    // ===== MOCK DEPENDENCIES =====
    @Mock private DriverRepository driverRepository;
    @Mock private OrderRepository orderRepository;
    @Mock private OrderService orderService;
    @Mock private NotificationService notificationService;
    @Mock private AuditLogService auditLogService;

    // ===== CLASS UNDER TEST =====
    @InjectMocks private DriverServiceImpl driverService;

    // ===== TEST DATA =====
    private User driverUser;
    private User customerUser;
    private Driver testDriver;
    private Customer testCustomer;
    private Order testOrder;

    @BeforeEach
    void setUp() {
        // Arrange chung: Khởi tạo dữ liệu test
        Role driverRole = Role.builder().id(3L).name("ROLE_DRIVER").build();
        Role customerRole = Role.builder().id(2L).name("ROLE_CUSTOMER").build();

        driverUser = User.builder()
                .id(2L).email("driver@speed.vn").fullName("Tran Van Tai Xe")
                .phone("0902222222").avatarUrl("https://speed.vn/avatars/driver1.jpg")
                .isActive(true).roles(Set.of(driverRole)).build();

        customerUser = User.builder()
                .id(1L).email("customer@speed.vn").fullName("Nguyen Van Khach")
                .phone("0901111111").isActive(true).roles(Set.of(customerRole)).build();

        testDriver = Driver.builder()
                .id(1L).user(driverUser).isAvailable(true).status(DriverStatus.ONLINE)
                .licensePlate("59A-12345").vehicleType("MOTORBIKE")
                .totalDeliveries(10).totalEarnings(BigDecimal.valueOf(800000))
                .rating(BigDecimal.valueOf(4.5)).build();

        testCustomer = Customer.builder().id(1L).user(customerUser).build();

        testOrder = Order.builder()
                .id(1L).orderCode("SPD12345678").customer(testCustomer).driver(testDriver)
                .status(OrderStatus.IN_TRANSIT).totalPrice(BigDecimal.valueOf(40000))
                .driverEarning(BigDecimal.valueOf(32000)).build();
    }

    // ==================== TOGGLE AVAILABILITY ====================
    @Nested
    @DisplayName("Toggle Availability")
    class ToggleAvailabilityTests {

        @Test
        @DisplayName("DR-TC01: Bật trạng thái khả dụng - ONLINE")
        void toggleAvailability_SetOnline() {
            // Arrange: Driver tồn tại, hiện đang OFFLINE
            testDriver.setIsAvailable(false);
            testDriver.setStatus(DriverStatus.OFFLINE);
            given(driverRepository.findById(1L)).willReturn(Optional.of(testDriver));
            given(driverRepository.save(any(Driver.class))).willReturn(testDriver);

            // Act: Bật khả dụng
            driverService.toggleAvailability(1L, true);

            // Assert: Trạng thái được cập nhật
            assertThat(testDriver.getIsAvailable()).isTrue();
            assertThat(testDriver.getStatus()).isEqualTo(DriverStatus.ONLINE);

            // Verify: Driver được save và audit log ghi nhận
            then(driverRepository).should(times(1)).save(testDriver);
            then(auditLogService).should(times(1))
                    .log(eq(2L), eq("TOGGLE_AVAILABILITY"), eq("Driver"), eq(1L), anyString());
        }

        @Test
        @DisplayName("DR-TC02: Tắt trạng thái khả dụng - OFFLINE")
        void toggleAvailability_SetOffline() {
            // Arrange: Driver tồn tại, hiện đang ONLINE
            given(driverRepository.findById(1L)).willReturn(Optional.of(testDriver));
            given(driverRepository.save(any(Driver.class))).willReturn(testDriver);

            // Act: Tắt khả dụng
            driverService.toggleAvailability(1L, false);

            // Assert: Trạng thái được cập nhật
            assertThat(testDriver.getIsAvailable()).isFalse();
            assertThat(testDriver.getStatus()).isEqualTo(DriverStatus.OFFLINE);

            // Verify: Driver được save
            then(driverRepository).should(times(1)).save(testDriver);
        }

        @Test
        @DisplayName("DR-TC03: Toggle - driver không tồn tại → ResourceNotFoundException")
        void toggleAvailability_DriverNotFound() {
            // Arrange: DriverRepository trả về empty
            given(driverRepository.findById(999L)).willReturn(Optional.empty());

            // Act & Assert: Phải throw ResourceNotFoundException
            assertThatThrownBy(() -> driverService.toggleAvailability(999L, true))
                    .isInstanceOf(ResourceNotFoundException.class);

            // Verify: KHÔNG save, KHÔNG ghi audit log
            then(driverRepository).should(never()).save(any(Driver.class));
            then(auditLogService).shouldHaveNoInteractions();
        }
    }

    // ==================== ACCEPT ORDER ====================
    @Nested
    @DisplayName("Accept Order")
    class AcceptOrderTests {

        @Test
        @DisplayName("DR-TC04: Nhận đơn hàng thành công - delegate sang OrderService")
        void acceptOrder_Success() {
            // Arrange: Driver khả dụng, OrderService.assignDriver trả về OrderResponse
            given(driverRepository.findById(1L)).willReturn(Optional.of(testDriver));
            OrderResponse expectedResponse = OrderResponse.builder()
                    .id(1L).orderCode("SPD12345678").driverId(1L).status("ASSIGNED").build();
            given(orderService.assignDriver(1L, 1L)).willReturn(expectedResponse);

            // Act: Nhận đơn
            OrderResponse result = driverService.acceptOrder(1L, 1L);

            // Assert: Response từ OrderService
            assertThat(result).isNotNull();
            assertThat(result.getStatus()).isEqualTo("ASSIGNED");

            // Verify: OrderService.assignDriver được gọi (Service-to-Service mock)
            then(driverRepository).should(times(1)).findById(1L);
            then(orderService).should(times(1)).assignDriver(1L, 1L);
        }

        @Test
        @DisplayName("DR-TC05: Nhận đơn - tài xế không khả dụng → BadRequestException")
        void acceptOrder_DriverUnavailable() {
            // Arrange: Driver tồn tại nhưng isAvailable = false
            testDriver.setIsAvailable(false);
            given(driverRepository.findById(1L)).willReturn(Optional.of(testDriver));

            // Act & Assert: Phải throw BadRequestException
            assertThatThrownBy(() -> driverService.acceptOrder(1L, 1L))
                    .isInstanceOf(BadRequestException.class)
                    .hasMessageContaining("không khả dụng");

            // Verify: OrderService KHÔNG được gọi khi driver không khả dụng
            then(orderService).shouldHaveNoInteractions();
        }

        @Test
        @DisplayName("DR-TC15: Nhận đơn - driver không tồn tại → ResourceNotFoundException")
        void acceptOrder_DriverNotFound() {
            // Arrange: DriverRepository trả về empty
            given(driverRepository.findById(999L)).willReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> driverService.acceptOrder(999L, 1L))
                    .isInstanceOf(ResourceNotFoundException.class);

            // Verify: Không delegate sang OrderService
            then(orderService).shouldHaveNoInteractions();
        }
    }

    // ==================== REJECT ORDER ====================
    @Test
    @DisplayName("DR-TC06: Từ chối đơn hàng - ghi audit log và gửi thông báo")
    void rejectOrder_Success() {
        // Arrange: Driver và Order tồn tại
        given(driverRepository.findById(1L)).willReturn(Optional.of(testDriver));
        given(orderRepository.findById(1L)).willReturn(Optional.of(testOrder));

        // Act: Từ chối đơn
        driverService.rejectOrder(1L, 1L);

        // Verify: Audit log ghi nhận + Notification gửi cho customer
        then(auditLogService).should(times(1))
                .log(eq(2L), eq("REJECT_ORDER"), eq("Order"), eq(1L), anyString());
        then(notificationService).should(times(1))
                .sendOrderNotification(eq(1L), eq(1L), anyString(), anyString());
    }

    @Test
    @DisplayName("DR-TC18: Từ chối đơn - đơn không tồn tại → ResourceNotFoundException")
    void rejectOrder_OrderNotFound() {
        // Arrange: Driver tồn tại, Order không tìm thấy
        given(driverRepository.findById(1L)).willReturn(Optional.of(testDriver));
        given(orderRepository.findById(999L)).willReturn(Optional.empty());

        // Act & Assert
        assertThatThrownBy(() -> driverService.rejectOrder(1L, 999L))
                .isInstanceOf(ResourceNotFoundException.class);

        // Verify: Không ghi audit log, không gửi thông báo
        then(auditLogService).shouldHaveNoInteractions();
        then(notificationService).shouldHaveNoInteractions();
    }

    // ==================== COMPLETE DELIVERY ====================
    @Nested
    @DisplayName("Complete Delivery")
    class CompleteDeliveryTests {

        @Test
        @DisplayName("DR-TC07: Hoàn thành giao hàng thành công")
        void completeDelivery_Success() {
            // Arrange: Driver là owner, order đang IN_TRANSIT
            given(driverRepository.findById(1L)).willReturn(Optional.of(testDriver));
            given(orderRepository.findById(1L)).willReturn(Optional.of(testOrder));
            OrderResponse expectedResponse = OrderResponse.builder()
                    .id(1L).status("DELIVERED").build();
            given(orderService.updateOrderStatus(1L, "DELIVERED", 2L)).willReturn(expectedResponse);

            // Act: Hoàn thành giao hàng
            OrderResponse result = driverService.completeDelivery(1L, 1L);

            // Assert: Trạng thái DELIVERED
            assertThat(result.getStatus()).isEqualTo("DELIVERED");

            // Verify: OrderService.updateOrderStatus được gọi với đúng tham số
            InOrder inOrder = inOrder(driverRepository, orderRepository, orderService);
            then(driverRepository).should(inOrder).findById(1L);
            then(orderRepository).should(inOrder).findById(1L);
            then(orderService).should(inOrder).updateOrderStatus(1L, "DELIVERED", 2L);
        }

        @Test
        @DisplayName("DR-TC08: Hoàn thành giao hàng - đơn không thuộc driver → BadRequestException")
        void completeDelivery_WrongDriver() {
            // Arrange: Order thuộc driver khác (driverId=99)
            Driver otherDriver = Driver.builder().id(99L).build();
            testOrder.setDriver(otherDriver);
            given(driverRepository.findById(1L)).willReturn(Optional.of(testDriver));
            given(orderRepository.findById(1L)).willReturn(Optional.of(testOrder));

            // Act & Assert: Phải throw BadRequestException
            assertThatThrownBy(() -> driverService.completeDelivery(1L, 1L))
                    .isInstanceOf(BadRequestException.class)
                    .hasMessageContaining("không thuộc");

            // Verify: OrderService KHÔNG được gọi
            then(orderService).shouldHaveNoInteractions();
        }

        @Test
        @DisplayName("DR-TC09: Hoàn thành giao hàng - đơn chưa đang giao → BadRequestException")
        void completeDelivery_WrongStatus() {
            // Arrange: Order ở trạng thái PENDING (không phải IN_TRANSIT)
            testOrder.setStatus(OrderStatus.PENDING);
            given(driverRepository.findById(1L)).willReturn(Optional.of(testDriver));
            given(orderRepository.findById(1L)).willReturn(Optional.of(testOrder));

            // Act & Assert: Phải throw BadRequestException
            assertThatThrownBy(() -> driverService.completeDelivery(1L, 1L))
                    .isInstanceOf(BadRequestException.class)
                    .hasMessageContaining("chưa đang giao");

            // Verify: OrderService KHÔNG được gọi
            then(orderService).shouldHaveNoInteractions();
        }

        @Test
        @DisplayName("DR-TC16: Hoàn thành giao hàng - driver không tồn tại → ResourceNotFoundException")
        void completeDelivery_DriverNotFound() {
            // Arrange
            given(driverRepository.findById(999L)).willReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> driverService.completeDelivery(999L, 1L))
                    .isInstanceOf(ResourceNotFoundException.class);

            // Verify: Không tìm order, không delegate sang OrderService
            then(orderRepository).shouldHaveNoInteractions();
            then(orderService).shouldHaveNoInteractions();
        }
    }

    // ==================== GET DELIVERY HISTORY & EARNINGS ====================
    @Nested
    @DisplayName("History & Earnings")
    class HistoryAndEarningsTests {

        @Test
        @DisplayName("DR-TC10: Lấy lịch sử giao hàng - delegate sang OrderService")
        void getDeliveryHistory_Success() {
            // Arrange: Driver tồn tại, OrderService trả về Page
            given(driverRepository.findById(1L)).willReturn(Optional.of(testDriver));
            PageRequest pageable = PageRequest.of(0, 10);
            Page<OrderResponse> expectedPage = new PageImpl<>(List.of(
                    OrderResponse.builder().id(1L).orderCode("SPD12345678").build()), pageable, 1);
            given(orderService.getDriverOrders(1L, pageable)).willReturn(expectedPage);

            // Act: Lấy lịch sử
            Page<OrderResponse> result = driverService.getDeliveryHistory(1L, pageable);

            // Assert: Trả về đúng dữ liệu
            assertThat(result.getTotalElements()).isEqualTo(1);

            // Verify: OrderService.getDriverOrders được gọi
            then(orderService).should(times(1)).getDriverOrders(1L, pageable);
        }

        @Test
        @DisplayName("DR-TC11: Lấy thu nhập tài xế")
        void getEarnings_Success() {
            // Arrange: Driver tồn tại với earnings = 800,000
            given(driverRepository.findById(1L)).willReturn(Optional.of(testDriver));

            // Act: Lấy thu nhập
            BigDecimal earnings = driverService.getEarnings(1L);

            // Assert: Trả về đúng giá trị
            assertThat(earnings).isEqualTo(BigDecimal.valueOf(800000));

            // Verify: DriverRepository được gọi 1 lần
            then(driverRepository).should(times(1)).findById(1L);
        }

        @Test
        @DisplayName("DR-TC12: Lấy thu nhập - driver không tồn tại → ResourceNotFoundException")
        void getEarnings_DriverNotFound() {
            // Arrange: DriverRepository trả về empty
            given(driverRepository.findById(999L)).willReturn(Optional.empty());

            // Act & Assert: Phải throw ResourceNotFoundException
            assertThatThrownBy(() -> driverService.getEarnings(999L))
                    .isInstanceOf(ResourceNotFoundException.class);
        }

        @Test
        @DisplayName("DR-TC19: Lấy danh sách đơn mới (available orders) - delegate sang OrderService")
        void getAvailableOrders_Success() {
            // Arrange: Driver tồn tại, OrderService trả về danh sách đơn PENDING
            given(driverRepository.findById(1L)).willReturn(Optional.of(testDriver));
            List<OrderResponse> expected = List.of(
                    OrderResponse.builder().id(2L).orderCode("SPDNEWWWWW").status("PENDING").build());
            given(orderService.getAvailableOrders()).willReturn(expected);

            // Act
            List<OrderResponse> result = driverService.getAvailableOrders(1L);

            // Assert
            assertThat(result).hasSize(1);
            assertThat(result.get(0).getStatus()).isEqualTo("PENDING");

            // Verify: delegate sang OrderService.getAvailableOrders
            then(orderService).should(times(1)).getAvailableOrders();
        }

        @Test
        @DisplayName("DR-TC20: Lấy đơn mới - driver không tồn tại → ResourceNotFoundException")
        void getAvailableOrders_DriverNotFound() {
            // Arrange
            given(driverRepository.findById(999L)).willReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> driverService.getAvailableOrders(999L))
                    .isInstanceOf(ResourceNotFoundException.class);

            // Verify: KHÔNG delegate sang OrderService
            then(orderService).shouldHaveNoInteractions();
        }

        @Test
        @DisplayName("DR-TC17: Lấy lịch sử - driver không tồn tại → ResourceNotFoundException")
        void getDeliveryHistory_DriverNotFound() {
            // Arrange
            given(driverRepository.findById(999L)).willReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> driverService.getDeliveryHistory(999L, PageRequest.of(0, 10)))
                    .isInstanceOf(ResourceNotFoundException.class);

            // Verify: Không delegate sang OrderService
            then(orderService).shouldHaveNoInteractions();
        }
    }

    // ==================== GET DRIVER PROFILE ====================
    @Nested
    @DisplayName("Get Driver Profile")
    class GetDriverProfileTests {

        @Test
        @DisplayName("DR-TC13: Lấy hồ sơ tài xế thành công - map đủ trường")
        void getDriverProfile_Success() {
            // Arrange: Driver tồn tại đầy đủ thông tin
            given(driverRepository.findById(1L)).willReturn(Optional.of(testDriver));

            // Act
            DriverResponse profile = driverService.getDriverProfile(1L);

            // Assert: Map đầy đủ thông tin user + driver
            assertThat(profile.getId()).isEqualTo(1L);
            assertThat(profile.getUserId()).isEqualTo(2L);
            assertThat(profile.getFullName()).isEqualTo("Tran Van Tai Xe");
            assertThat(profile.getPhone()).isEqualTo("0902222222");
            assertThat(profile.getEmail()).isEqualTo("driver@speed.vn");
            assertThat(profile.getAvatarUrl()).isEqualTo("https://speed.vn/avatars/driver1.jpg");
            assertThat(profile.getLicensePlate()).isEqualTo("59A-12345");
            assertThat(profile.getVehicleType()).isEqualTo("MOTORBIKE");
            assertThat(profile.getStatus()).isEqualTo("ONLINE");
            assertThat(profile.getIsAvailable()).isTrue();
            assertThat(profile.getRating()).isEqualByComparingTo("4.5");
            assertThat(profile.getTotalDeliveries()).isEqualTo(10);
            assertThat(profile.getTotalEarnings()).isEqualByComparingTo("800000");
        }

        @Test
        @DisplayName("DR-TC14: Lấy hồ sơ - driver không tồn tại → ResourceNotFoundException")
        void getDriverProfile_DriverNotFound() {
            // Arrange
            given(driverRepository.findById(999L)).willReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> driverService.getDriverProfile(999L))
                    .isInstanceOf(ResourceNotFoundException.class);
        }
    }
}
