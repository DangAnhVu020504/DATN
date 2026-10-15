package com.speed.delivery.security;

import com.speed.delivery.entity.Role;
import com.speed.delivery.entity.User;
import com.speed.delivery.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.BDDMockito.*;

/**
 * Unit Tests cho CustomUserDetailsService - 5 test cases.
 *
 * <p>Kỹ thuật sử dụng:</p>
 * <ul>
 *   <li>BDDMockito thuần túy: given/willReturn, then/should</li>
 *   <li>Mock UserRepository trong Security context</li>
 *   <li>Verify authorities mapping từ Role → GrantedAuthority</li>
 *   <li>Pattern: Arrange → Act → Assert → Verify</li>
 * </ul>
 *
 * <p>Dependencies cần mock:</p>
 * <ul>
 *   <li>UserRepository</li>
 * </ul>
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("CustomUserDetailsService Unit Tests")
class CustomUserDetailsServiceTest {

    // ===== MOCK DEPENDENCIES =====
    @Mock private UserRepository userRepository;

    // ===== CLASS UNDER TEST =====
    @InjectMocks private CustomUserDetailsService userDetailsService;

    // ===== TEST DATA =====
    private User activeUser;
    private User inactiveUser;
    private User multiRoleUser;

    @BeforeEach
    void setUp() {
        // Arrange chung: Khởi tạo dữ liệu test
        Role adminRole = Role.builder().id(1L).name("ROLE_ADMIN").build();
        Role customerRole = Role.builder().id(2L).name("ROLE_CUSTOMER").build();

        activeUser = User.builder()
                .id(1L).email("admin@speed.vn").password("encodedPassword")
                .fullName("Admin Speed").phone("0900000000")
                .isActive(true).isVerified(true).roles(Set.of(adminRole)).build();

        inactiveUser = User.builder()
                .id(2L).email("locked@speed.vn").password("encodedPassword")
                .fullName("Locked User").phone("0911111111")
                .isActive(false).isVerified(true).roles(Set.of(customerRole)).build();

        multiRoleUser = User.builder()
                .id(3L).email("superadmin@speed.vn").password("encodedPassword")
                .fullName("Super Admin").phone("0922222222")
                .isActive(true).isVerified(true).roles(Set.of(adminRole, customerRole)).build();
    }

    @Test
    @DisplayName("UD-TC01: Load user thành công - enabled, authority = ROLE_ADMIN")
    void loadUserByUsername_Success() {
        // Arrange: UserRepository trả về User active
        given(userRepository.findByEmail("admin@speed.vn")).willReturn(Optional.of(activeUser));

        // Act: Load UserDetails
        UserDetails userDetails = userDetailsService.loadUserByUsername("admin@speed.vn");

        // Assert: Kiểm tra UserDetails
        assertThat(userDetails).isNotNull();
        assertThat(userDetails.getUsername()).isEqualTo("admin@speed.vn");
        assertThat(userDetails.getPassword()).isEqualTo("encodedPassword");
        assertThat(userDetails.isEnabled()).isTrue();
        assertThat(userDetails.getAuthorities()).hasSize(1);
        assertThat(userDetails.getAuthorities().iterator().next().getAuthority())
                .isEqualTo("ROLE_ADMIN");

        // Verify: UserRepository được gọi đúng 1 lần
        then(userRepository).should(times(1)).findByEmail("admin@speed.vn");
    }

    @Test
    @DisplayName("UD-TC02: Load user - tài khoản bị khóa → disabled = true")
    void loadUserByUsername_InactiveUser() {
        // Arrange: UserRepository trả về User inactive
        given(userRepository.findByEmail("locked@speed.vn")).willReturn(Optional.of(inactiveUser));

        // Act: Load UserDetails
        UserDetails userDetails = userDetailsService.loadUserByUsername("locked@speed.vn");

        // Assert: User bị disabled (isActive = false → disabled = true)
        assertThat(userDetails).isNotNull();
        assertThat(userDetails.getUsername()).isEqualTo("locked@speed.vn");
        assertThat(userDetails.isEnabled()).isFalse(); // isActive = false → disabled

        // Verify: UserRepository được gọi đúng 1 lần
        then(userRepository).should(times(1)).findByEmail("locked@speed.vn");
    }

    @Test
    @DisplayName("UD-TC03: Load user - không tồn tại → UsernameNotFoundException")
    void loadUserByUsername_NotFound() {
        // Arrange: UserRepository trả về empty
        given(userRepository.findByEmail("unknown@speed.vn")).willReturn(Optional.empty());

        // Act & Assert: Phải throw UsernameNotFoundException
        assertThatThrownBy(() -> userDetailsService.loadUserByUsername("unknown@speed.vn"))
                .isInstanceOf(UsernameNotFoundException.class)
                .hasMessageContaining("unknown@speed.vn");

        // Verify: UserRepository được gọi 1 lần
        then(userRepository).should(times(1)).findByEmail("unknown@speed.vn");
    }

    @Test
    @DisplayName("UD-TC04: Load user - nhiều roles → authorities chứa cả 2 roles")
    void loadUserByUsername_MultipleRoles() {
        // Arrange: UserRepository trả về User có 2 roles
        given(userRepository.findByEmail("superadmin@speed.vn")).willReturn(Optional.of(multiRoleUser));

        // Act: Load UserDetails
        UserDetails userDetails = userDetailsService.loadUserByUsername("superadmin@speed.vn");

        // Assert: Authorities chứa cả ROLE_ADMIN và ROLE_CUSTOMER
        assertThat(userDetails.getAuthorities()).hasSize(2);
        assertThat(userDetails.getAuthorities())
                .extracting("authority")
                .containsExactlyInAnyOrder("ROLE_ADMIN", "ROLE_CUSTOMER");
    }

    @Test
    @DisplayName("UD-TC05: Verify repository chỉ gọi 1 lần - không có side effects")
    void loadUserByUsername_VerifySingleCall() {
        // Arrange: UserRepository trả về User
        given(userRepository.findByEmail("admin@speed.vn")).willReturn(Optional.of(activeUser));

        // Act: Load UserDetails
        userDetailsService.loadUserByUsername("admin@speed.vn");

        // Verify: Repository chỉ gọi findByEmail đúng 1 lần, không có tương tác khác
        then(userRepository).should(times(1)).findByEmail("admin@speed.vn");
        then(userRepository).shouldHaveNoMoreInteractions();
    }
}
