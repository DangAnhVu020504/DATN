package com.speed.delivery.demo;

import com.speed.delivery.dto.request.LoginRequest;
import com.speed.delivery.dto.response.JwtResponse;
import com.speed.delivery.entity.RefreshToken;
import com.speed.delivery.entity.Role;
import com.speed.delivery.entity.User;
import com.speed.delivery.repository.*;
import com.speed.delivery.security.JwtTokenProvider;
import com.speed.delivery.service.AuditLogService;
import com.speed.delivery.service.EmailService;
import com.speed.delivery.service.OTPService;
import com.speed.delivery.service.impl.AuthServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataAccessResourceFailureException;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.BDDMockito.given;
import static org.mockito.BDDMockito.then;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;

/**
 * DEMO 1 - Chứng minh HIỆU QUẢ của kỹ thuật Mocking trong Unit Test.
 *
 * <p>Lớp này chạy THUẦN Mockito: không Spring Context, không Database, không mạng.
 * Được dùng để so sánh trực tiếp với {@link SpringContextDemoTest} (chạy KHÔNG Mock).</p>
 *
 * <ul>
 *   <li>DEMO-1: 10.000 lần login với Mock → đo thời gian (µs/login)</li>
 *   <li>DEMO-2: Mô phỏng "DB sập" → Exception path KHÔNG THỂ kiểm thử khi không Mock</li>
 *   <li>DEMO-3: Không phát sinh side-effect thật (email/OTP không được gửi)</li>
 * </ul>
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("DEMO - Kỹ thuật Mocking (Unit Test thuần, không DB/mạng)")
class MockingDemoTest {

    // ===== 11 DEPENDENCY ĐỀU LÀ MOCK =====
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

    @InjectMocks private AuthServiceImpl authService;

    private LoginRequest loginRequest;
    private User testUser;

    @BeforeEach
    void setUp() {
        Role customerRole = Role.builder().id(2L).name("ROLE_CUSTOMER").build();
        testUser = User.builder()
                .id(1L).email("test@speed.vn").password("encodedPassword")
                .fullName("Nguyen Van Test").phone("0901234567")
                .isActive(true).isVerified(false).roles(Set.of(customerRole))
                .createdAt(LocalDateTime.now()).build();
        loginRequest = LoginRequest.builder()
                .email("test@speed.vn").password("Password123").build();
    }

    /**
     * Arrange chung cho Happy Path của login: mock toàn bộ chuỗi gọi dependency.
     */
    private void mockHappyPathLogin() {
        Authentication auth = mock(Authentication.class);
        given(authenticationManager.authenticate(any())).willReturn(auth);
        given(userRepository.findByEmail("test@speed.vn")).willReturn(Optional.of(testUser));
        given(jwtTokenProvider.generateAccessToken(any(Authentication.class))).willReturn("access-token");
        given(jwtTokenProvider.generateRefreshToken(anyString())).willReturn("refresh-token");
        given(jwtTokenProvider.getRefreshTokenExpirationMs()).willReturn(604800000L);
        given(refreshTokenRepository.save(any(RefreshToken.class)))
                .willReturn(RefreshToken.builder().build());
    }

    @Test
    @DisplayName("DEMO-1: 10.000 lần login THẬT nhưng chỉ dùng Mock - không DB, không mạng")
    void demo1_mockSpeed_10000Logins() {
        // Arrange: mọi thứ đều là mock
        mockHappyPathLogin();
        authService.login(loginRequest); // warm-up

        // Act: chạy 10.000 lần
        int iterations = 10_000;
        long start = System.nanoTime();
        for (int i = 0; i < iterations; i++) {
            authService.login(loginRequest);
        }
        long elapsedMs = (System.nanoTime() - start) / 1_000_000;
        double usPerOp = (System.nanoTime() - start) / 1000.0 / iterations;

        // Assert + in số liệu để so sánh
        System.out.printf("[DEMO-1 MOCK] %,d login = %d ms (%.2f us/login)%n",
                iterations, elapsedMs, usPerOp);
        then(authenticationManager).should(times(iterations + 1)).authenticate(any());
        then(userRepository).should(times(iterations + 1)).findByEmail("test@speed.vn");
        // Nguong 30s du rong de khong flaky tren may cham (thuc do 4-7s/10k = 0,4-0,7 ms/login);
        // trong khi neu goi DB that (~100 ms/login) thi 10k login mat gan 17 phut.
        assertThat(elapsedMs).isLessThan(30_000);
    }

    @Test
    @DisplayName("DEMO-2: Mô phỏng DB sập - Exception path chỉ kiểm thử được khi có Mock")
    void demo2_mockExceptionPath_dbDown() {
        // Arrange: "DB sập" chỉ là 1 dòng stub
        given(authenticationManager.authenticate(any()))
                .willThrow(new DataAccessResourceFailureException("Database is down"));

        // Act & Assert
        assertThatThrownBy(() -> authService.login(loginRequest))
                .isInstanceOf(DataAccessResourceFailureException.class)
                .hasMessageContaining("Database is down");

        // Verify: fail-fast - các bước phía sau KHÔNG được thực hiện
        then(userRepository).shouldHaveNoInteractions();
        then(refreshTokenRepository).shouldHaveNoInteractions();
        then(auditLogService).shouldHaveNoInteractions();
    }

    @Test
    @DisplayName("DEMO-3: Không phát sinh side-effect thật - email/OTP không bao giờ được gửi")
    void demo3_mockIsolation_noRealSideEffect() {
        // Arrange
        mockHappyPathLogin();

        // Act
        JwtResponse response = authService.login(loginRequest);

        // Assert: kết quả đúng VÀ không có hệ thống nào thật sự bị gọi
        assertThat(response.getAccessToken()).isEqualTo("access-token");
        then(emailService).shouldHaveNoInteractions();
        then(otpService).shouldHaveNoInteractions();
        then(auditLogService).should(times(1))
                .log(any(), anyString(), anyString(), any(), anyString());
        // mock không bao giờ gọi DB thật để ghi audit
        then(userRepository).should(never()).save(any(User.class));
    }
}