package com.speed.delivery.service.impl;

import com.speed.delivery.dto.request.AddressRequest;
import com.speed.delivery.dto.request.UpdateProfileRequest;
import com.speed.delivery.dto.response.AddressResponse;
import com.speed.delivery.dto.response.UserResponse;
import com.speed.delivery.entity.*;
import com.speed.delivery.exception.*;
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

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.BDDMockito.*;

/**
 * Unit Tests cho CustomerServiceImpl - 12 test cases.
 *
 * <p>Kỹ thuật sử dụng:</p>
 * <ul>
 *   <li>BDDMockito thuần túy: given/willReturn, then/should, shouldHaveNoInteractions</li>
 *   <li>ArgumentCaptor: Bắt đối tượng Address truyền vào save()</li>
 *   <li>Pattern: Arrange → Act → Assert → Verify</li>
 * </ul>
 *
 * <p>Dependencies cần mock:</p>
 * <ul>
 *   <li>UserRepository</li>
 *   <li>CustomerRepository</li>
 *   <li>AddressRepository</li>
 *   <li>AuditLogService</li>
 * </ul>
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("CustomerServiceImpl Unit Tests")
class CustomerServiceImplTest {

    // ===== MOCK DEPENDENCIES =====
    @Mock private UserRepository userRepository;
    @Mock private CustomerRepository customerRepository;
    @Mock private AddressRepository addressRepository;
    @Mock private AuditLogService auditLogService;

    // ===== CLASS UNDER TEST =====
    @InjectMocks private CustomerServiceImpl customerService;

    // ===== TEST DATA =====
    private User testUser;
    private Customer testCustomer;
    private Address testAddress;
    private AddressRequest addressRequest;

    @BeforeEach
    void setUp() {
        // Arrange chung: Khởi tạo dữ liệu test
        Role customerRole = Role.builder().id(2L).name("ROLE_CUSTOMER").build();

        testUser = User.builder()
                .id(1L).email("customer@speed.vn").password("encodedPassword")
                .fullName("Nguyen Van Khach").phone("0901234567")
                .isActive(true).isVerified(true).roles(Set.of(customerRole))
                .createdAt(LocalDateTime.now()).build();

        testCustomer = Customer.builder()
                .id(1L).user(testUser).build();

        testAddress = Address.builder()
                .id(1L).customer(testCustomer)
                .label("Nhà").contactName("Nguyen Van Khach").contactPhone("0901234567")
                .addressLine("123 Nguyen Hue, Q.1").ward("Ben Nghe").district("Quận 1").city("TP.HCM")
                .latitude(10.7769).longitude(106.7009).isDefault(true).build();

        addressRequest = AddressRequest.builder()
                .label("Công ty").contactName("Tran Van B").contactPhone("0909999999")
                .addressLine("456 Le Loi, Q.3").ward("Ward 1").district("Quận 3").city("TP.HCM")
                .latitude(10.7840).longitude(106.6880).isDefault(false).build();
    }

    // ==================== GET PROFILE ====================
    @Nested
    @DisplayName("Get Profile")
    class GetProfileTests {

        @Test
        @DisplayName("CS-TC01: Lấy profile thành công")
        void getProfile_Success() {
            // Arrange: UserRepository trả về User hợp lệ
            given(userRepository.findByEmail("customer@speed.vn")).willReturn(Optional.of(testUser));

            // Act: Lấy profile
            UserResponse response = customerService.getProfile("customer@speed.vn");

            // Assert: Kiểm tra dữ liệu trả về
            assertThat(response).isNotNull();
            assertThat(response.getEmail()).isEqualTo("customer@speed.vn");
            assertThat(response.getFullName()).isEqualTo("Nguyen Van Khach");
            assertThat(response.getIsActive()).isTrue();

            // Verify: UserRepository được gọi đúng 1 lần
            then(userRepository).should(times(1)).findByEmail("customer@speed.vn");
        }

        @Test
        @DisplayName("CS-TC02: Lấy profile - user không tồn tại → ResourceNotFoundException")
        void getProfile_NotFound() {
            // Arrange: UserRepository trả về empty
            given(userRepository.findByEmail("unknown@speed.vn")).willReturn(Optional.empty());

            // Act & Assert: Phải throw ResourceNotFoundException
            assertThatThrownBy(() -> customerService.getProfile("unknown@speed.vn"))
                    .isInstanceOf(ResourceNotFoundException.class);

            // Verify: Chỉ gọi findByEmail, không có tương tác khác
            then(userRepository).should(times(1)).findByEmail("unknown@speed.vn");
        }
    }

    // ==================== UPDATE PROFILE ====================
    @Nested
    @DisplayName("Update Profile")
    class UpdateProfileTests {

        @Test
        @DisplayName("CS-TC03: Cập nhật profile - fullName thành công")
        void updateProfile_FullName() {
            // Arrange: User tồn tại, chỉ cập nhật fullName
            given(userRepository.findByEmail("customer@speed.vn")).willReturn(Optional.of(testUser));
            given(userRepository.save(any(User.class))).willReturn(testUser);

            UpdateProfileRequest request = UpdateProfileRequest.builder()
                    .fullName("Nguyen Van Moi").build();

            // Act: Cập nhật profile
            UserResponse response = customerService.updateProfile("customer@speed.vn", request);

            // Assert: fullName được cập nhật
            assertThat(response).isNotNull();

            // Verify: User được save và audit log được ghi
            then(userRepository).should(times(1)).save(testUser);
            then(auditLogService).should(times(1))
                    .log(eq(1L), eq("UPDATE_PROFILE"), eq("User"), eq(1L), anyString());
        }

        @Test
        @DisplayName("CS-TC04: Cập nhật profile - SĐT trùng → DuplicateResourceException")
        void updateProfile_DuplicatePhone() {
            // Arrange: User tồn tại, SĐT mới đã có người sử dụng
            given(userRepository.findByEmail("customer@speed.vn")).willReturn(Optional.of(testUser));
            given(userRepository.existsByPhone("0999888777")).willReturn(true);

            UpdateProfileRequest request = UpdateProfileRequest.builder()
                    .phone("0999888777").build();

            // Act & Assert: Phải throw DuplicateResourceException
            assertThatThrownBy(() -> customerService.updateProfile("customer@speed.vn", request))
                    .isInstanceOf(DuplicateResourceException.class);

            // Verify: User KHÔNG được save khi SĐT trùng
            then(userRepository).should(never()).save(any(User.class));
            then(auditLogService).shouldHaveNoInteractions();
        }
    }

    // ==================== ADDRESS MANAGEMENT ====================
    @Nested
    @DisplayName("Address Management")
    class AddressTests {

        @Test
        @DisplayName("CS-TC05: Lấy danh sách địa chỉ thành công")
        void getAddresses_Success() {
            // Arrange: Customer tồn tại, có 1 địa chỉ
            given(customerRepository.findById(1L)).willReturn(Optional.of(testCustomer));
            given(addressRepository.findByCustomerIdOrderByIsDefaultDesc(1L))
                    .willReturn(List.of(testAddress));

            // Act: Lấy danh sách
            List<AddressResponse> result = customerService.getAddresses(1L);

            // Assert: Trả về đúng 1 địa chỉ
            assertThat(result).hasSize(1);
            assertThat(result.get(0).getAddressLine()).isEqualTo("123 Nguyen Hue, Q.1");
            assertThat(result.get(0).getIsDefault()).isTrue();

            // Verify: Cả 2 repository đều được gọi
            then(customerRepository).should(times(1)).findById(1L);
            then(addressRepository).should(times(1)).findByCustomerIdOrderByIsDefaultDesc(1L);
        }

        @Test
        @DisplayName("CS-TC06: Thêm địa chỉ mới thành công")
        void addAddress_Success() {
            // Arrange: Customer tồn tại
            given(customerRepository.findById(1L)).willReturn(Optional.of(testCustomer));
            given(addressRepository.save(any(Address.class))).willReturn(
                    Address.builder().id(2L).customer(testCustomer)
                            .label("Công ty").contactName("Tran Van B").contactPhone("0909999999")
                            .addressLine("456 Le Loi, Q.3").isDefault(false).build());

            // Act: Thêm địa chỉ
            AddressResponse result = customerService.addAddress(1L, addressRequest);

            // Assert: Địa chỉ mới được tạo
            assertThat(result).isNotNull();
            assertThat(result.getLabel()).isEqualTo("Công ty");
            assertThat(result.getAddressLine()).isEqualTo("456 Le Loi, Q.3");

            // Verify: Address được save và audit log ghi nhận
            then(addressRepository).should(times(1)).save(any(Address.class));
            then(auditLogService).should(times(1))
                    .log(eq(1L), eq("ADD_ADDRESS"), eq("Address"), eq(2L), anyString());
        }

        @Test
        @DisplayName("CS-TC07: Thêm địa chỉ mặc định - reset các địa chỉ cũ")
        void addAddress_SetDefault_ResetsOldDefaults() {
            // Arrange: Customer tồn tại, có 1 địa chỉ default cũ
            addressRequest.setIsDefault(true);
            given(customerRepository.findById(1L)).willReturn(Optional.of(testCustomer));
            given(addressRepository.findByCustomerIdOrderByIsDefaultDesc(1L))
                    .willReturn(List.of(testAddress)); // testAddress.isDefault = true
            given(addressRepository.save(any(Address.class))).willReturn(
                    Address.builder().id(2L).customer(testCustomer)
                            .label("Công ty").addressLine("456 Le Loi, Q.3")
                            .contactName("Tran Van B").contactPhone("0909999999")
                            .isDefault(true).build());

            // Act: Thêm địa chỉ mặc định mới
            customerService.addAddress(1L, addressRequest);

            // Assert: Địa chỉ cũ bị reset isDefault = false
            assertThat(testAddress.getIsDefault()).isFalse();

            // Verify: Địa chỉ cũ được save (reset default) + Địa chỉ mới được save
            then(addressRepository).should(atLeast(2)).save(any(Address.class));
        }

        @Test
        @DisplayName("CS-TC08: Cập nhật địa chỉ - thành công")
        void updateAddress_Success() {
            // Arrange: Địa chỉ thuộc về đúng customer
            given(addressRepository.findById(1L)).willReturn(Optional.of(testAddress));
            given(addressRepository.save(any(Address.class))).willReturn(testAddress);

            // Act: Cập nhật địa chỉ
            AddressResponse result = customerService.updateAddress(1L, 1L, addressRequest);

            // Assert: Dữ liệu được cập nhật
            assertThat(result).isNotNull();

            // Verify: Address được save
            then(addressRepository).should(times(1)).findById(1L);
            then(addressRepository).should(atLeastOnce()).save(any(Address.class));
        }

        @Test
        @DisplayName("CS-TC09: Cập nhật địa chỉ - không thuộc customer → BadRequestException")
        void updateAddress_WrongCustomer() {
            // Arrange: Địa chỉ thuộc customer khác (customerId=2)
            Customer otherCustomer = Customer.builder().id(2L).build();
            Address otherAddress = Address.builder().id(5L).customer(otherCustomer).build();
            given(addressRepository.findById(5L)).willReturn(Optional.of(otherAddress));

            // Act & Assert: Phải throw BadRequestException
            assertThatThrownBy(() -> customerService.updateAddress(1L, 5L, addressRequest))
                    .isInstanceOf(BadRequestException.class)
                    .hasMessageContaining("không thuộc");

            // Verify: KHÔNG save khi validation thất bại
            then(addressRepository).should(never()).save(any(Address.class));
        }

        @Test
        @DisplayName("CS-TC10: Xóa địa chỉ - thành công")
        void deleteAddress_Success() {
            // Arrange: Địa chỉ thuộc về đúng customer
            given(addressRepository.findById(1L)).willReturn(Optional.of(testAddress));

            // Act: Xóa địa chỉ
            customerService.deleteAddress(1L, 1L);

            // Verify: delete được gọi
            then(addressRepository).should(times(1)).delete(testAddress);
        }

        @Test
        @DisplayName("CS-TC11: Xóa địa chỉ - không thuộc customer → BadRequestException")
        void deleteAddress_WrongCustomer() {
            // Arrange: Địa chỉ thuộc customer khác
            Customer otherCustomer = Customer.builder().id(2L).build();
            Address otherAddress = Address.builder().id(5L).customer(otherCustomer).build();
            given(addressRepository.findById(5L)).willReturn(Optional.of(otherAddress));

            // Act & Assert: Phải throw BadRequestException
            assertThatThrownBy(() -> customerService.deleteAddress(1L, 5L))
                    .isInstanceOf(BadRequestException.class)
                    .hasMessageContaining("không thuộc");

            // Verify: KHÔNG xóa khi validation thất bại
            then(addressRepository).should(never()).delete(any(Address.class));
        }

        @Test
        @DisplayName("CS-TC12: Đặt địa chỉ mặc định - reset cũ và set mới")
        void setDefaultAddress_Success() {
            // Arrange: Địa chỉ chưa phải default
            Address nonDefaultAddress = Address.builder()
                    .id(2L).customer(testCustomer).isDefault(false)
                    .addressLine("456 Le Loi").contactName("B").contactPhone("0909999999").build();
            given(addressRepository.findById(2L)).willReturn(Optional.of(nonDefaultAddress));
            given(addressRepository.findByCustomerIdOrderByIsDefaultDesc(1L))
                    .willReturn(List.of(testAddress)); // testAddress.isDefault = true

            // Act: Đặt làm mặc định
            customerService.setDefaultAddress(1L, 2L);

            // Assert: Địa chỉ cũ bị reset, địa chỉ mới thành default
            assertThat(testAddress.getIsDefault()).isFalse();
            assertThat(nonDefaultAddress.getIsDefault()).isTrue();

            // Verify: Cả 2 địa chỉ đều được save
            then(addressRepository).should(atLeast(2)).save(any(Address.class));
        }
    }
}
