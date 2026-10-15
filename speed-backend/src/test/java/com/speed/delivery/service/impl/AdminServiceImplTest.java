package com.speed.delivery.service.impl;

import com.speed.delivery.dto.response.DashboardResponse;
import com.speed.delivery.dto.response.UserResponse;
import com.speed.delivery.entity.*;
import com.speed.delivery.enums.OrderStatus;
import com.speed.delivery.exception.ResourceNotFoundException;
import com.speed.delivery.repository.*;
import com.speed.delivery.service.AuditLogService;
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

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.BDDMockito.*;

/**
 * Unit Tests cho AdminServiceImpl - 10 test cases.
 *
 * <p>Kỹ thuật sử dụng:</p>
 * <ul>
 *   <li>BDDMockito thuần túy: given/willReturn, then/should</li>
 *   <li>Mock nhiều count() queries cho Dashboard</li>
 *   <li>ArgumentCaptor: Bắt đối tượng User khi toggle active</li>
 *   <li>Pattern: Arrange → Act → Assert → Verify</li>
 * </ul>
 *
 * <p>Dependencies cần mock:</p>
 * <ul>
 *   <li>UserRepository</li>
 *   <li>CustomerRepository</li>
 *   <li>DriverRepository</li>
 *   <li>OrderRepository</li>
 *   <li>AuditLogService</li>
 * </ul>
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("AdminServiceImpl Unit Tests")
class AdminServiceImplTest {

    // ===== MOCK DEPENDENCIES =====
    @Mock private UserRepository userRepository;
    @Mock private CustomerRepository customerRepository;
    @Mock private DriverRepository driverRepository;
    @Mock private OrderRepository orderRepository;
    @Mock private AuditLogService auditLogService;

    // ===== CLASS UNDER TEST =====
    @InjectMocks private AdminServiceImpl adminService;

    // ===== TEST DATA =====
    private User testUser;

    @BeforeEach
    void setUp() {
        // Arrange chung: Khởi tạo dữ liệu test
        Role adminRole = Role.builder().id(1L).name("ROLE_ADMIN").build();

        testUser = User.builder()
                .id(1L).email("admin@speed.vn").password("encodedPassword")
                .fullName("Admin Speed").phone("0900000000")
                .isActive(true).isVerified(true).roles(Set.of(adminRole))
                .createdAt(LocalDateTime.now()).build();
    }

    // ==================== DASHBOARD STATS ====================
    @Nested
    @DisplayName("Dashboard Stats")
    class DashboardTests {

        @Test
        @DisplayName("AD-TC01: Dashboard stats - dữ liệu bình thường")
        void getDashboardStats_Success() {
            // Arrange: Mock tất cả count queries
            given(orderRepository.count()).willReturn(50L);
            given(customerRepository.count()).willReturn(30L);
            given(driverRepository.count()).willReturn(10L);
            given(orderRepository.calculateRevenueAfter(any(LocalDateTime.class)))
                    .willReturn(BigDecimal.valueOf(5000000));
            given(orderRepository.countByStatus(OrderStatus.PENDING)).willReturn(5L);
            given(orderRepository.countByStatus(OrderStatus.IN_TRANSIT)).willReturn(3L);
            given(orderRepository.countByStatus(OrderStatus.PICKING_UP)).willReturn(2L);
            given(orderRepository.countByStatus(OrderStatus.ASSIGNED)).willReturn(1L);
            given(orderRepository.countByStatus(OrderStatus.DELIVERED)).willReturn(35L);
            given(orderRepository.countByStatus(OrderStatus.CANCELLED)).willReturn(4L);

            // Act: Lấy dashboard stats
            DashboardResponse response = adminService.getDashboardStats();

            // Assert: Kiểm tra tất cả thống kê
            assertThat(response).isNotNull();
            assertThat(response.getTotalOrders()).isEqualTo(50);
            assertThat(response.getTotalCustomers()).isEqualTo(30);
            assertThat(response.getTotalDrivers()).isEqualTo(10);
            assertThat(response.getTotalRevenue()).isEqualTo(BigDecimal.valueOf(5000000));
            assertThat(response.getPendingOrders()).isEqualTo(5);
            assertThat(response.getDeliveringOrders()).isEqualTo(6); // 3 + 2 + 1
            assertThat(response.getCompletedOrders()).isEqualTo(35);
            assertThat(response.getCancelledOrders()).isEqualTo(4);

            // Verify: Tất cả repository count được gọi
            then(orderRepository).should(times(1)).count();
            then(customerRepository).should(times(1)).count();
            then(driverRepository).should(times(1)).count();
        }

        @Test
        @DisplayName("AD-TC02: Dashboard stats - revenue null → return 0")
        void getDashboardStats_NullRevenue() {
            // Arrange: Revenue trả về null (chưa có đơn hàng nào delivered)
            given(orderRepository.count()).willReturn(0L);
            given(customerRepository.count()).willReturn(0L);
            given(driverRepository.count()).willReturn(0L);
            given(orderRepository.calculateRevenueAfter(any(LocalDateTime.class))).willReturn(null);
            given(orderRepository.countByStatus(any())).willReturn(0L);

            // Act: Lấy dashboard stats
            DashboardResponse response = adminService.getDashboardStats();

            // Assert: Revenue phải là 0 (không null)
            assertThat(response.getTotalRevenue()).isEqualTo(BigDecimal.ZERO);
            assertThat(response.getTotalOrders()).isEqualTo(0);
        }
    }

    // ==================== GET USERS ====================
    @Nested
    @DisplayName("Get Users")
    class GetUsersTests {

        @Test
        @DisplayName("AD-TC03: Lấy danh sách users (phân trang)")
        void getAllUsers_WithPagination() {
            // Arrange: Mock UserRepository trả về Page<User>
            PageRequest pageable = PageRequest.of(0, 10);
            Page<User> userPage = new PageImpl<>(List.of(testUser), pageable, 1);
            given(userRepository.findAll(pageable)).willReturn(userPage);

            // Act: Lấy danh sách users
            Page<UserResponse> result = adminService.getAllUsers(pageable);

            // Assert: Trả về đúng dữ liệu
            assertThat(result.getTotalElements()).isEqualTo(1);
            assertThat(result.getContent().get(0).getEmail()).isEqualTo("admin@speed.vn");

            // Verify: UserRepository.findAll được gọi 1 lần
            then(userRepository).should(times(1)).findAll(pageable);
        }

        @Test
        @DisplayName("AD-TC04: Lấy user theo ID - thành công")
        void getUserById_Success() {
            // Arrange: UserRepository trả về User
            given(userRepository.findById(1L)).willReturn(Optional.of(testUser));

            // Act: Lấy user
            UserResponse response = adminService.getUserById(1L);

            // Assert: Dữ liệu đúng
            assertThat(response).isNotNull();
            assertThat(response.getEmail()).isEqualTo("admin@speed.vn");
            assertThat(response.getFullName()).isEqualTo("Admin Speed");

            // Verify: findById gọi 1 lần
            then(userRepository).should(times(1)).findById(1L);
        }

        @Test
        @DisplayName("AD-TC05: Lấy user theo ID - không tìm thấy → ResourceNotFoundException")
        void getUserById_NotFound() {
            // Arrange: UserRepository trả về empty
            given(userRepository.findById(999L)).willReturn(Optional.empty());

            // Act & Assert: Phải throw ResourceNotFoundException
            assertThatThrownBy(() -> adminService.getUserById(999L))
                    .isInstanceOf(ResourceNotFoundException.class);
        }
    }

    // ==================== TOGGLE USER ACTIVE ====================
    @Nested
    @DisplayName("Toggle User Active")
    class ToggleActiveTests {

        @Test
        @DisplayName("AD-TC06: Kích hoạt tài khoản - isActive = true")
        void toggleUserActive_Activate() {
            // Arrange: User tồn tại, hiện đang inactive
            testUser.setIsActive(false);
            given(userRepository.findById(1L)).willReturn(Optional.of(testUser));
            given(userRepository.save(any(User.class))).willReturn(testUser);

            // Act: Kích hoạt tài khoản
            adminService.toggleUserActive(1L, true);

            // Assert: User được kích hoạt
            assertThat(testUser.getIsActive()).isTrue();

            // Verify: User được save và audit log ghi nhận "activated"
            then(userRepository).should(times(1)).save(testUser);
            then(auditLogService).should(times(1))
                    .log(isNull(), eq("TOGGLE_USER_ACTIVE"), eq("User"), eq(1L), contains("activated"));
        }

        @Test
        @DisplayName("AD-TC07: Vô hiệu hóa tài khoản - isActive = false")
        void toggleUserActive_Deactivate() {
            // Arrange: User tồn tại, hiện đang active
            given(userRepository.findById(1L)).willReturn(Optional.of(testUser));
            given(userRepository.save(any(User.class))).willReturn(testUser);

            // Act: Vô hiệu hóa tài khoản
            adminService.toggleUserActive(1L, false);

            // Assert: User bị vô hiệu hóa
            assertThat(testUser.getIsActive()).isFalse();

            // Verify: Audit log ghi nhận "deactivated"
            then(auditLogService).should(times(1))
                    .log(isNull(), eq("TOGGLE_USER_ACTIVE"), eq("User"), eq(1L), contains("deactivated"));
        }

        @Test
        @DisplayName("AD-TC08: Toggle - user không tồn tại → ResourceNotFoundException")
        void toggleUserActive_NotFound() {
            // Arrange: UserRepository trả về empty
            given(userRepository.findById(999L)).willReturn(Optional.empty());

            // Act & Assert: Phải throw ResourceNotFoundException
            assertThatThrownBy(() -> adminService.toggleUserActive(999L, true))
                    .isInstanceOf(ResourceNotFoundException.class);

            // Verify: KHÔNG save, KHÔNG ghi audit log
            then(userRepository).should(never()).save(any(User.class));
            then(auditLogService).shouldHaveNoInteractions();
        }
    }

    // ==================== DELETE USER ====================
    @Nested
    @DisplayName("Delete User")
    class DeleteUserTests {

        @Test
        @DisplayName("AD-TC09: Xóa user - thành công")
        void deleteUser_Success() {
            // Arrange: User tồn tại
            given(userRepository.findById(1L)).willReturn(Optional.of(testUser));

            // Act: Xóa user
            adminService.deleteUser(1L);

            // Verify: delete được gọi và audit log ghi nhận
            then(userRepository).should(times(1)).delete(testUser);
            then(auditLogService).should(times(1))
                    .log(isNull(), eq("DELETE_USER"), eq("User"), eq(1L), contains("admin@speed.vn"));
        }

        @Test
        @DisplayName("AD-TC10: Xóa user - không tồn tại → ResourceNotFoundException")
        void deleteUser_NotFound() {
            // Arrange: UserRepository trả về empty
            given(userRepository.findById(999L)).willReturn(Optional.empty());

            // Act & Assert: Phải throw ResourceNotFoundException
            assertThatThrownBy(() -> adminService.deleteUser(999L))
                    .isInstanceOf(ResourceNotFoundException.class);

            // Verify: KHÔNG delete, KHÔNG ghi audit log
            then(userRepository).should(never()).delete(any(User.class));
            then(auditLogService).shouldHaveNoInteractions();
        }
    }
}
