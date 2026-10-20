package com.speed.delivery.service.impl;

import com.speed.delivery.dto.request.*;
import com.speed.delivery.dto.response.JwtResponse;
import com.speed.delivery.dto.response.UserResponse;
import com.speed.delivery.entity.*;
import com.speed.delivery.exception.*;
import com.speed.delivery.repository.*;
import com.speed.delivery.security.JwtTokenProvider;
import com.speed.delivery.service.AuditLogService;
import com.speed.delivery.service.EmailService;
import com.speed.delivery.service.OTPService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.BDDMockito.*;

/**
 * Unit Tests cho AuthServiceImpl - 26 test cases.
 *
 * <p>Kỹ thuật sử dụng:</p>
 * <ul>
 *   <li>BDDMockito thuần túy: given/willReturn, then/should, shouldHaveNoInteractions</li>
 *   <li>ArgumentCaptor: Bắt đối tượng truyền vào mock để kiểm tra</li>
 *   <li>InOrder: Kiểm tra thứ tự gọi các dependency</li>
 *   <li>Pattern: Arrange → Act → Assert → Verify</li>
 * </ul>
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("AuthServiceImpl Unit Tests")
class AuthServiceImplTest {

    // ===== MOCK DEPENDENCIES =====
    @Mock private UserRepository userRepository;
    @Mock private RoleRepository roleRepository;
    @Mock private CustomerRepository customerRepository;
    @Mock private DriverRepository driverRepository;
    @Mock private RefreshTokenRepository refreshTokenRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private AuthenticationManager authenticationManager;
    @Mock private JwtTokenProvider jwtTokenProvider;
    @Mock private OTPService otpService;
    @Mock private EmailService emailService;
    @Mock private AuditLogService auditLogService;

    // ===== CLASS UNDER TEST =====
    @InjectMocks private AuthServiceImpl authService;

    // ===== TEST DATA =====
    private RegisterRequest registerRequest;
    private LoginRequest loginRequest;
    private User testUser;
    private Role customerRole;

    @BeforeEach
    void setUp() {
        // Arrange chung: Khởi tạo dữ liệu test dùng cho nhiều test case
        customerRole = Role.builder().id(2L).name("ROLE_CUSTOMER").build();

        testUser = User.builder()
                .id(1L).email("test@speed.vn").password("encodedPassword")
                .fullName("Nguyen Van Test").phone("0901234567")
                .isActive(true).isVerified(false).roles(Set.of(customerRole))
                .createdAt(LocalDateTime.now()).build();

        registerRequest = RegisterRequest.builder()
                .email("test@speed.vn").password("Password123")
                .fullName("Nguyen Van Test").phone("0901234567").role("CUSTOMER").build();

        loginRequest = LoginRequest.builder()
                .email("test@speed.vn").password("Password123").build();
    }

    /**
     * Helper: Mock toàn bộ flow tạo token (authenticate + generate + save).
     */
    private void mockTokenGeneration() {
        Authentication auth = mock(Authentication.class);
        given(authenticationManager.authenticate(any())).willReturn(auth);
        given(jwtTokenProvider.generateAccessToken(any(Authentication.class))).willReturn("access-token");
        given(jwtTokenProvider.generateRefreshToken(anyString())).willReturn("refresh-token");
        given(jwtTokenProvider.getRefreshTokenExpirationMs()).willReturn(604800000L);
        given(refreshTokenRepository.save(any(RefreshToken.class))).willReturn(RefreshToken.builder().build());
    }

    // ==================== REGISTER ====================
    @Nested
    @DisplayName("Register")
    class RegisterTests {

        @Test
        @DisplayName("TC01 - Đăng ký thành công")
        void register_Success() {
            // Arrange: Mock tất cả dependency cho happy path
            given(userRepository.existsByEmail(anyString())).willReturn(false);
            given(userRepository.existsByPhone(anyString())).willReturn(false);
            given(roleRepository.findByName("ROLE_CUSTOMER")).willReturn(Optional.of(customerRole));
            given(passwordEncoder.encode(anyString())).willReturn("encodedPassword");
            given(userRepository.save(any(User.class))).willReturn(testUser);
            given(customerRepository.save(any(Customer.class)))
                    .willReturn(Customer.builder().id(1L).user(testUser).build());
            mockTokenGeneration();

            // Act: Gọi phương thức cần test
            JwtResponse response = authService.register(registerRequest);

            // Assert: Kiểm tra kết quả trả về
            assertThat(response).isNotNull();
            assertThat(response.getAccessToken()).isEqualTo("access-token");
            assertThat(response.getEmail()).isEqualTo("test@speed.vn");

            // Verify: Xác minh các dependency được gọi đúng
            then(userRepository).should(times(1)).existsByEmail("test@speed.vn");
            then(userRepository).should(times(1)).existsByPhone("0901234567");
            then(roleRepository).should(times(1)).findByName("ROLE_CUSTOMER");
            then(userRepository).should(times(1)).save(any(User.class));
            then(customerRepository).should(times(1)).save(any(Customer.class));
            then(emailService).should(times(1)).sendWelcomeEmail(eq("test@speed.vn"), anyString());
            then(auditLogService).should(times(1)).log(eq(1L), eq("REGISTER"), eq("User"), eq(1L), anyString());
        }

        @Test
        @DisplayName("TC02 - Email trùng lặp → DuplicateResourceException")
        void register_DuplicateEmail() {
            // Arrange: Email đã tồn tại → existsByEmail trả về true
            given(userRepository.existsByEmail("test@speed.vn")).willReturn(true);

            // Act & Assert: Phải throw DuplicateResourceException
            assertThatThrownBy(() -> authService.register(registerRequest))
                    .isInstanceOf(DuplicateResourceException.class);

            // Verify: Các dependency phía sau KHÔNG được gọi (fail-fast)
            then(userRepository).should(never()).existsByPhone(anyString());
            then(roleRepository).shouldHaveNoInteractions();
            then(passwordEncoder).shouldHaveNoInteractions();
            then(userRepository).should(never()).save(any(User.class));
            then(customerRepository).shouldHaveNoInteractions();
            then(emailService).shouldHaveNoInteractions();
        }

        @Test
        @DisplayName("TC03 - SĐT trùng lặp → DuplicateResourceException")
        void register_DuplicatePhone() {
            // Arrange: Email chưa tồn tại, nhưng SĐT đã có
            given(userRepository.existsByEmail(anyString())).willReturn(false);
            given(userRepository.existsByPhone("0901234567")).willReturn(true);

            // Act & Assert
            assertThatThrownBy(() -> authService.register(registerRequest))
                    .isInstanceOf(DuplicateResourceException.class);

            // Verify: Không tìm role, không tạo user
            then(roleRepository).shouldHaveNoInteractions();
            then(passwordEncoder).shouldHaveNoInteractions();
            then(userRepository).should(never()).save(any(User.class));
        }

        @Test
        @DisplayName("TC04 - Role không tồn tại → ResourceNotFoundException")
        void register_RoleNotFound() {
            // Arrange: Email và SĐT OK, nhưng role không có trong DB
            given(userRepository.existsByEmail(anyString())).willReturn(false);
            given(userRepository.existsByPhone(anyString())).willReturn(false);
            given(roleRepository.findByName("ROLE_CUSTOMER")).willReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> authService.register(registerRequest))
                    .isInstanceOf(ResourceNotFoundException.class);

            // Verify: Không encode password, không save user
            then(passwordEncoder).shouldHaveNoInteractions();
            then(userRepository).should(never()).save(any(User.class));
            then(customerRepository).shouldHaveNoInteractions();
        }

        @Test
        @DisplayName("TC05 - ArgumentCaptor kiểm tra User được save")
        void register_CaptureUser() {
            // Arrange
            ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
            given(userRepository.existsByEmail(anyString())).willReturn(false);
            given(userRepository.existsByPhone(anyString())).willReturn(false);
            given(roleRepository.findByName("ROLE_CUSTOMER")).willReturn(Optional.of(customerRole));
            given(passwordEncoder.encode("Password123")).willReturn("enc");
            given(userRepository.save(any(User.class))).willReturn(testUser);
            given(customerRepository.save(any())).willReturn(Customer.builder().id(1L).user(testUser).build());
            mockTokenGeneration();

            // Act
            authService.register(registerRequest);

            // Verify: Capture đối tượng User truyền vào save()
            then(userRepository).should().save(userCaptor.capture());

            // Assert: Kiểm tra User captured có đúng dữ liệu
            User capturedUser = userCaptor.getValue();
            assertThat(capturedUser.getEmail()).isEqualTo("test@speed.vn");
            assertThat(capturedUser.getFullName()).isEqualTo("Nguyen Van Test");
            assertThat(capturedUser.getPhone()).isEqualTo("0901234567");
            assertThat(capturedUser.getPassword()).isEqualTo("enc");
            assertThat(capturedUser.getIsActive()).isTrue();
        }

        @Test
        @DisplayName("TC23 - Đăng ký role DRIVER → tạo hồ sơ Driver, không tạo Customer")
        void register_DriverRole() {
            // Arrange: Request đăng ký với role DRIVER
            RegisterRequest driverRequest = RegisterRequest.builder()
                    .email("driver@speed.vn").password("Password123")
                    .fullName("Tran Van Tai Xe").phone("0909999999").role("DRIVER").build();
            Role driverRole = Role.builder().id(3L).name("ROLE_DRIVER").build();
            User savedDriverUser = User.builder()
                    .id(9L).email("driver@speed.vn").password("encodedPassword")
                    .fullName("Tran Van Tai Xe").phone("0909999999")
                    .isActive(true).isVerified(false).roles(Set.of(driverRole))
                    .createdAt(LocalDateTime.now()).build();

            given(userRepository.existsByEmail("driver@speed.vn")).willReturn(false);
            given(userRepository.existsByPhone("0909999999")).willReturn(false);
            given(roleRepository.findByName("ROLE_DRIVER")).willReturn(Optional.of(driverRole));
            given(passwordEncoder.encode(anyString())).willReturn("encodedPassword");
            given(userRepository.save(any(User.class))).willReturn(savedDriverUser);
            given(driverRepository.save(any(Driver.class)))
                    .willReturn(Driver.builder().id(5L).user(savedDriverUser).build());
            given(driverRepository.findByUserId(9L))
                    .willReturn(Optional.of(Driver.builder().id(5L).user(savedDriverUser).build()));
            mockTokenGeneration();

            // Act
            JwtResponse response = authService.register(driverRequest);

            // Assert: Response map đúng driverId vừa tạo
            assertThat(response.getAccessToken()).isEqualTo("access-token");
            assertThat(response.getDriverId()).isEqualTo(5L);

            // Verify: Role DRIVER → tạo hồ sơ Driver, KHÔNG tạo Customer profile
            then(roleRepository).should(times(1)).findByName("ROLE_DRIVER");
            then(driverRepository).should(times(1)).save(any(Driver.class));
            then(customerRepository).should(never()).save(any(Customer.class));
            then(emailService).should(times(1)).sendWelcomeEmail(eq("driver@speed.vn"), anyString());
        }
    }

    // ==================== LOGIN ====================
    @Nested
    @DisplayName("Login")
    class LoginTests {

        @Test
        @DisplayName("TC06 - Đăng nhập thành công")
        void login_Success() {
            // Arrange
            Authentication auth = mock(Authentication.class);
            given(authenticationManager.authenticate(any())).willReturn(auth);
            given(userRepository.findByEmail("test@speed.vn")).willReturn(Optional.of(testUser));
            given(jwtTokenProvider.generateAccessToken(auth)).willReturn("access-token");
            given(jwtTokenProvider.generateRefreshToken("test@speed.vn")).willReturn("refresh-token");
            given(jwtTokenProvider.getRefreshTokenExpirationMs()).willReturn(604800000L);
            given(refreshTokenRepository.save(any())).willReturn(RefreshToken.builder().build());

            // Act
            JwtResponse response = authService.login(loginRequest);

            // Assert
            assertThat(response).isNotNull();
            assertThat(response.getAccessToken()).isEqualTo("access-token");
            assertThat(response.getRefreshToken()).isEqualTo("refresh-token");

            // Verify: audit log được ghi
            then(auditLogService).should(times(1))
                    .log(eq(1L), eq("LOGIN"), eq("User"), eq(1L), anyString());
        }

        @Test
        @DisplayName("TC07 - Sai mật khẩu → BadCredentialsException")
        void login_WrongPassword() {
            // Arrange: authenticationManager throw exception khi sai password
            given(authenticationManager.authenticate(any()))
                    .willThrow(new BadCredentialsException("Bad credentials"));

            // Act & Assert
            assertThatThrownBy(() -> authService.login(loginRequest))
                    .isInstanceOf(BadCredentialsException.class);

            // Verify: Không tìm user, không tạo token
            then(userRepository).should(never()).findByEmail(anyString());
            then(jwtTokenProvider).shouldHaveNoInteractions();
            then(auditLogService).shouldHaveNoInteractions();
        }

        @Test
        @DisplayName("TC08 - Tài khoản bị vô hiệu hóa → UnauthorizedException")
        void login_Inactive() {
            // Arrange: User tồn tại nhưng isActive = false
            testUser.setIsActive(false);
            Authentication auth = mock(Authentication.class);
            given(authenticationManager.authenticate(any())).willReturn(auth);
            given(userRepository.findByEmail("test@speed.vn")).willReturn(Optional.of(testUser));

            // Act & Assert
            assertThatThrownBy(() -> authService.login(loginRequest))
                    .isInstanceOf(UnauthorizedException.class);

            // Verify: Không tạo token khi tài khoản bị khóa
            then(jwtTokenProvider).should(never()).generateAccessToken(any(Authentication.class));
            then(auditLogService).shouldHaveNoInteractions();
        }

        @Test
        @DisplayName("TC09 - User không tồn tại → ResourceNotFoundException")
        void login_NotFound() {
            // Arrange: Authenticate OK nhưng không tìm thấy user trong DB
            Authentication auth = mock(Authentication.class);
            given(authenticationManager.authenticate(any())).willReturn(auth);
            given(userRepository.findByEmail("test@speed.vn")).willReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> authService.login(loginRequest))
                    .isInstanceOf(ResourceNotFoundException.class);

            // Verify: Không tạo token
            then(jwtTokenProvider).should(never()).generateAccessToken(any(Authentication.class));
        }

        @Test
        @DisplayName("TC10 - InOrder kiểm tra thứ tự gọi dependency")
        void login_InOrder() {
            // Arrange
            Authentication auth = mock(Authentication.class);
            given(authenticationManager.authenticate(any())).willReturn(auth);
            given(userRepository.findByEmail(anyString())).willReturn(Optional.of(testUser));
            given(jwtTokenProvider.generateAccessToken(auth)).willReturn("t");
            given(jwtTokenProvider.generateRefreshToken(anyString())).willReturn("r");
            given(jwtTokenProvider.getRefreshTokenExpirationMs()).willReturn(604800000L);
            given(refreshTokenRepository.save(any())).willReturn(RefreshToken.builder().build());

            // Act
            authService.login(loginRequest);

            // Verify: Thứ tự gọi phải là authenticate → findByEmail → generateAccessToken
            InOrder inOrder = inOrder(authenticationManager, userRepository, jwtTokenProvider);
            then(authenticationManager).should(inOrder).authenticate(any());
            then(userRepository).should(inOrder).findByEmail("test@speed.vn");
            then(jwtTokenProvider).should(inOrder).generateAccessToken(auth);
        }
    }

    // ==================== REFRESH TOKEN ====================
    @Nested
    @DisplayName("Refresh Token")
    class RefreshTests {

        @Test
        @DisplayName("TC11 - Refresh token thành công")
        void refresh_Success() {
            // Arrange: Token hợp lệ, chưa hết hạn
            RefreshToken stored = RefreshToken.builder()
                    .id(1L).token("old").user(testUser)
                    .expiresAt(LocalDateTime.now().plusDays(7)).isRevoked(false).build();
            given(refreshTokenRepository.findByTokenAndIsRevokedFalse("old")).willReturn(Optional.of(stored));
            given(jwtTokenProvider.generateAccessToken("test@speed.vn")).willReturn("new-access");
            given(jwtTokenProvider.generateRefreshToken("test@speed.vn")).willReturn("new-refresh");
            given(jwtTokenProvider.getRefreshTokenExpirationMs()).willReturn(604800000L);
            given(refreshTokenRepository.save(any())).willReturn(RefreshToken.builder().build());

            // Act
            JwtResponse res = authService.refreshToken(new RefreshTokenRequest("old"));

            // Assert
            assertThat(res.getAccessToken()).isEqualTo("new-access");
            assertThat(res.getRefreshToken()).isEqualTo("new-refresh");
            assertThat(stored.getIsRevoked()).isTrue(); // Token cũ bị revoke

            // Verify: Token cũ được save (revoke) + token mới được tạo
            then(refreshTokenRepository).should(times(2)).save(any(RefreshToken.class));
        }

        @Test
        @DisplayName("TC12 - Token không hợp lệ → UnauthorizedException")
        void refresh_Invalid() {
            // Arrange: Token không tìm thấy
            given(refreshTokenRepository.findByTokenAndIsRevokedFalse("bad")).willReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> authService.refreshToken(new RefreshTokenRequest("bad")))
                    .isInstanceOf(UnauthorizedException.class);

            // Verify: Không tạo token mới
            then(jwtTokenProvider).shouldHaveNoInteractions();
        }

        @Test
        @DisplayName("TC13 - Token hết hạn → UnauthorizedException")
        void refresh_Expired() {
            // Arrange: Token đã hết hạn (expiresAt trong quá khứ)
            RefreshToken expired = RefreshToken.builder()
                    .id(1L).token("exp").user(testUser)
                    .expiresAt(LocalDateTime.now().minusDays(1)).isRevoked(false).build();
            given(refreshTokenRepository.findByTokenAndIsRevokedFalse("exp")).willReturn(Optional.of(expired));
            given(refreshTokenRepository.save(any())).willReturn(expired);

            // Act & Assert
            assertThatThrownBy(() -> authService.refreshToken(new RefreshTokenRequest("exp")))
                    .isInstanceOf(UnauthorizedException.class);

            // Verify: Token hết hạn được revoke và save
            then(refreshTokenRepository).should(times(1)).save(any(RefreshToken.class));
            then(jwtTokenProvider).should(never()).generateAccessToken(anyString());
        }
    }

    // ==================== PASSWORD ====================
    @Nested
    @DisplayName("Password")
    class PasswordTests {

        @Test
        @DisplayName("TC14 - Quên mật khẩu - gửi OTP thành công")
        void forgotPassword_Success() {
            // Arrange
            given(userRepository.findByEmail("test@speed.vn")).willReturn(Optional.of(testUser));
            given(otpService.generateOtp(1L, "PASSWORD_RESET")).willReturn("123456");
            willDoNothing().given(emailService).sendOtpEmail(anyString(), anyString());

            // Act
            authService.forgotPassword("test@speed.vn");

            // Verify: OTP được generate và email được gửi
            then(otpService).should(times(1)).generateOtp(1L, "PASSWORD_RESET");
            then(emailService).should(times(1)).sendOtpEmail("test@speed.vn", "123456");
            then(auditLogService).should(times(1))
                    .log(eq(1L), eq("FORGOT_PASSWORD"), eq("User"), eq(1L), anyString());
        }

        @Test
        @DisplayName("TC15 - Quên mật khẩu - email không tồn tại → ResourceNotFoundException")
        void forgotPassword_NotFound() {
            // Arrange
            given(userRepository.findByEmail("x@x.vn")).willReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> authService.forgotPassword("x@x.vn"))
                    .isInstanceOf(ResourceNotFoundException.class);

            // Verify: Không generate OTP, không gửi email
            then(otpService).shouldHaveNoInteractions();
            then(emailService).shouldHaveNoInteractions();
        }

        @Test
        @DisplayName("TC16 - Reset mật khẩu thành công")
        void resetPassword_Success() {
            // Arrange
            given(userRepository.findByEmail("test@speed.vn")).willReturn(Optional.of(testUser));
            given(otpService.verifyOtp(1L, "123456", "PASSWORD_RESET")).willReturn(true);
            given(passwordEncoder.encode("NewPass")).willReturn("newEnc");

            // Act
            authService.resetPassword("test@speed.vn", "123456", "NewPass");

            // Verify: Mật khẩu được save và tất cả refresh token bị revoke
            then(userRepository).should(times(1)).save(testUser);
            then(refreshTokenRepository).should(times(1)).revokeAllByUserId(1L);
            then(auditLogService).should(times(1))
                    .log(eq(1L), eq("RESET_PASSWORD"), eq("User"), eq(1L), anyString());
        }

        @Test
        @DisplayName("TC17 - Reset mật khẩu - OTP sai → BadRequestException")
        void resetPassword_BadOtp() {
            // Arrange
            given(userRepository.findByEmail("test@speed.vn")).willReturn(Optional.of(testUser));
            given(otpService.verifyOtp(1L, "000", "PASSWORD_RESET")).willReturn(false);

            // Act & Assert
            assertThatThrownBy(() -> authService.resetPassword("test@speed.vn", "000", "x"))
                    .isInstanceOf(BadRequestException.class);

            // Verify: Không encode password, không save, không revoke token
            then(passwordEncoder).shouldHaveNoInteractions();
            then(userRepository).should(never()).save(any(User.class));
            then(refreshTokenRepository).should(never()).revokeAllByUserId(anyLong());
        }

        @Test
        @DisplayName("TC18 - Đổi mật khẩu thành công")
        void changePassword_Success() {
            // Arrange
            given(userRepository.findByEmail("test@speed.vn")).willReturn(Optional.of(testUser));
            given(passwordEncoder.matches("Old", "encodedPassword")).willReturn(true);
            given(passwordEncoder.encode("New")).willReturn("newEnc");

            // Act
            authService.changePassword("test@speed.vn", new ChangePasswordRequest("Old", "New"));

            // Verify: User được save với mật khẩu mới
            then(userRepository).should(times(1)).save(testUser);
            then(auditLogService).should(times(1))
                    .log(eq(1L), eq("CHANGE_PASSWORD"), eq("User"), eq(1L), anyString());
        }

        @Test
        @DisplayName("TC19 - Đổi mật khẩu - sai mật khẩu cũ → BadRequestException")
        void changePassword_WrongOld() {
            // Arrange
            given(userRepository.findByEmail("test@speed.vn")).willReturn(Optional.of(testUser));
            given(passwordEncoder.matches("Wrong", "encodedPassword")).willReturn(false);

            // Act & Assert
            assertThatThrownBy(() -> authService.changePassword("test@speed.vn",
                    new ChangePasswordRequest("Wrong", "New")))
                    .isInstanceOf(BadRequestException.class);

            // Verify: Không encode mật khẩu mới, không save
            then(passwordEncoder).should(never()).encode(anyString());
            then(userRepository).should(never()).save(any(User.class));
        }
    }

    // ==================== LOGOUT ====================
    @Test
    @DisplayName("TC20 - Logout revoke token thành công")
    void logout_Success() {
        // Arrange
        RefreshToken token = RefreshToken.builder().id(1L).token("rt").isRevoked(false).build();
        given(refreshTokenRepository.findByTokenAndIsRevokedFalse("rt")).willReturn(Optional.of(token));
        given(refreshTokenRepository.save(any())).willReturn(token);
        given(userRepository.findByEmail("test@speed.vn")).willReturn(Optional.of(testUser));

        // Act
        authService.logout("test@speed.vn", "rt");

        // Assert: Token bị revoke
        assertThat(token.getIsRevoked()).isTrue();

        // Verify: Token được save và audit log được ghi
        then(refreshTokenRepository).should(times(1)).save(any(RefreshToken.class));
        then(auditLogService).should(times(1))
                .log(eq(1L), eq("LOGOUT"), eq("User"), eq(1L), anyString());
    }

    @Test
    @DisplayName("TC21 - Logout token không tồn tại → không throw exception")
    void logout_NoToken() {
        // Arrange: Token không tìm thấy
        given(refreshTokenRepository.findByTokenAndIsRevokedFalse("x")).willReturn(Optional.empty());
        given(userRepository.findByEmail("test@speed.vn")).willReturn(Optional.of(testUser));

        // Act & Assert: Không throw exception
        assertThatCode(() -> authService.logout("test@speed.vn", "x"))
                .doesNotThrowAnyException();

        // Verify: Không save token (vì không tìm thấy)
        then(refreshTokenRepository).should(never()).save(any(RefreshToken.class));
    }

    // ==================== PROFILE ====================
    @Test
    @DisplayName("TC22 - Get profile thành công")
    void getProfile_Success() {
        // Arrange
        given(userRepository.findByEmail("test@speed.vn")).willReturn(Optional.of(testUser));

        // Act
        UserResponse res = authService.getProfile("test@speed.vn");

        // Assert
        assertThat(res).isNotNull();
        assertThat(res.getEmail()).isEqualTo("test@speed.vn");
        assertThat(res.getFullName()).isEqualTo("Nguyen Van Test");
        assertThat(res.getIsActive()).isTrue();

        // Verify
        then(userRepository).should(times(1)).findByEmail("test@speed.vn");
    }

    // ==================== UPDATE PROFILE ====================
    @Nested
    @DisplayName("Update Profile")
    class UpdateProfileTests {

        @Test
        @DisplayName("TC24 - Cập nhật hồ sơ thành công - đủ trường")
        void updateProfile_Success_AllFields() {
            // Arrange: User tồn tại, SĐT mới chưa ai dùng
            given(userRepository.findByEmail("test@speed.vn")).willReturn(Optional.of(testUser));
            given(userRepository.existsByPhone("0912345678")).willReturn(false);
            given(userRepository.save(any(User.class))).willReturn(testUser);

            // Act: Cập nhật đủ 3 trường
            UserResponse res = authService.updateProfile("test@speed.vn",
                    UpdateProfileRequest.builder()
                            .fullName("Nguyen Van Moi")
                            .phone("0912345678")
                            .avatarUrl("https://speed.vn/avatars/new.jpg")
                            .build());

            // Assert: Các trường được cập nhật đúng
            assertThat(testUser.getFullName()).isEqualTo("Nguyen Van Moi");
            assertThat(testUser.getPhone()).isEqualTo("0912345678");
            assertThat(testUser.getAvatarUrl()).isEqualTo("https://speed.vn/avatars/new.jpg");
            assertThat(res.getFullName()).isEqualTo("Nguyen Van Moi");

            // Verify: Save + audit log
            then(userRepository).should(times(1)).save(testUser);
            then(auditLogService).should(times(1))
                    .log(eq(1L), eq("UPDATE_PROFILE"), eq("User"), eq(1L), anyString());
        }

        @Test
        @DisplayName("TC25 - Cập nhật SĐT trùng người khác → DuplicateResourceException")
        void updateProfile_DuplicatePhone() {
            // Arrange: SĐT mới đã có người dùng
            given(userRepository.findByEmail("test@speed.vn")).willReturn(Optional.of(testUser));
            given(userRepository.existsByPhone("0900000000")).willReturn(true);

            // Act & Assert
            assertThatThrownBy(() -> authService.updateProfile("test@speed.vn",
                    UpdateProfileRequest.builder().phone("0900000000").build()))
                    .isInstanceOf(DuplicateResourceException.class);

            // Verify: Fail-fast - không save, không ghi audit log
            then(userRepository).should(never()).save(any(User.class));
            then(auditLogService).shouldHaveNoInteractions();
        }

        @Test
        @DisplayName("TC26 - Cập nhật hồ sơ - user không tồn tại → ResourceNotFoundException")
        void updateProfile_UserNotFound() {
            // Arrange
            given(userRepository.findByEmail("ghost@speed.vn")).willReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> authService.updateProfile("ghost@speed.vn",
                    UpdateProfileRequest.builder().fullName("X Y").build()))
                    .isInstanceOf(ResourceNotFoundException.class);

            // Verify: Không save gì
            then(userRepository).should(never()).save(any(User.class));
        }
    }
}
