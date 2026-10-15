package com.speed.delivery.demo;

import com.speed.delivery.dto.request.LoginRequest;
import com.speed.delivery.dto.response.JwtResponse;
import com.speed.delivery.entity.Role;
import com.speed.delivery.entity.User;
import com.speed.delivery.repository.RoleRepository;
import com.speed.delivery.repository.UserRepository;
import com.speed.delivery.service.impl.AuthServiceImpl;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.ApplicationContext;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * DEMO 2 - Chạy KHÔNG dùng kỹ thuật Mocking (đối chứng của {@link MockingDemoTest}).
 *
 * <p>Để test CÙNG một logic login, cách không-Mock buộc phải:</p>
 * <ul>
 *   <li>Nạp TOÀN BỘ Spring Context (hàng trăm bean, security, JPA...)</li>
 *   <li>Khởi tạo Database thật (H2 in-memory, create schema từ entity)</li>
 *   <li>Seed dữ liệu test thủ công vào DB</li>
 * </ul>
 *
 * <p>→ Số liệu của 2 test này dùng để so sánh trực tiếp với Mock trong báo cáo.</p>
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.MOCK)
@ActiveProfiles("test")
@DisplayName("DEMO - Không Mock (Spring Context + H2 Database thật)")
class SpringContextDemoTest {

    /** Thời điểm lớp test được nạp - dùng để đo thời gian khởi tạo Context. */
    private static final long CLASS_LOADED_AT = System.nanoTime();

    @Autowired private ApplicationContext context;
    @Autowired private AuthServiceImpl authService;
    @Autowired private UserRepository userRepository;
    @Autowired private RoleRepository roleRepository;
    @Autowired private PasswordEncoder passwordEncoder;

    @Test
    @DisplayName("DEMO-4: Bắt buộc nạp toàn bộ Spring Context chỉ để chạy 1 test")
    void demo4_springContextStartup() {
        assertThat(context).isNotNull();
        long startupMs = (System.nanoTime() - CLASS_LOADED_AT) / 1_000_000;
        System.out.printf("[DEMO-4 SPRING] Spring Context startup = %d ms%n", startupMs);
    }

    @Test
    @DisplayName("DEMO-5: 10 lần login THẬT với H2 - chậm hơn Mock nhiều lần")
    void demo5_realLogin_withH2() {
        // Arrange: seed 11 user THẬT vào H2 (việc PHẢI làm khi không Mock)
        Role role = roleRepository.findByName("ROLE_CUSTOMER")
                .orElseGet(() -> roleRepository.save(
                        Role.builder().name("ROLE_CUSTOMER").description("Demo").build()));

        int iterations = 10;
        java.util.List<LoginRequest> requests = new java.util.ArrayList<>();
        for (int i = 0; i <= iterations; i++) { // +1 user cho warm-up
            String email = "demo" + System.nanoTime() + "@speed.vn";
            String phone = "09" + String.valueOf(System.nanoTime() % 1_000_000_000L);
            User user = User.builder()
                    .email(email)
                    .password(passwordEncoder.encode("Password123"))
                    .fullName("Demo User").phone(phone)
                    .isActive(true).isVerified(false)
                    .build();
            user.getRoles().add(role);
            userRepository.save(user);
            requests.add(LoginRequest.builder().email(email).password("Password123").build());
        }

        // Warm-up (Hibernate init, pool kết nối...)
        authService.login(requests.get(0));

        // Act: 10 lần login thật - mỗi user đúng 1 lần (mỗi login = 1 vòng full: Security + JWT + JPA)
        JwtResponse response = null;
        long start = System.nanoTime();
        for (int i = 1; i <= iterations; i++) {
            response = authService.login(requests.get(i));
        }
        long elapsedMs = (System.nanoTime() - start) / 1_000_000;
        double msPerOp = elapsedMs / (double) iterations;

        // Assert + in số liệu
        assertThat(response).isNotNull();
        assertThat(response.getAccessToken()).isNotEmpty();
        System.out.printf("[DEMO-5 SPRING+H2] %d login THAT = %d ms (%.2f ms/login)%n",
                iterations, elapsedMs, msPerOp);
    }
}