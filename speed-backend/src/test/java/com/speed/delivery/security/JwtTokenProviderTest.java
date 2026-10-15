package com.speed.delivery.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.User;

import java.util.Collections;

import static org.assertj.core.api.Assertions.*;

/**
 * Unit Tests cho JwtTokenProvider - 10 test cases.
 * Test trực tiếp (không cần mock).
 */
@DisplayName("JwtTokenProvider Unit Tests")
class JwtTokenProviderTest {

    private JwtTokenProvider jwtTokenProvider;

    @BeforeEach
    void setUp() {
        jwtTokenProvider = new JwtTokenProvider(
                "TestSecretKeyForJWT2024MustBeLongEnoughForHS256AlgorithmRequirements",
                900000,     // 15 min
                604800000   // 7 days
        );
    }

    @Nested @DisplayName("Generate Token") class GenerateTests {
        @Test @DisplayName("Tạo access token từ email")
        void generateAccessToken_FromEmail() {
            String token = jwtTokenProvider.generateAccessToken("test@speed.vn");
            assertThat(token).isNotBlank();
            assertThat(token.split("\\.")).hasSize(3); // JWT = header.payload.signature
        }

        @Test @DisplayName("Tạo access token từ Authentication")
        void generateAccessToken_FromAuth() {
            User userDetails = new User("test@speed.vn", "pwd", Collections.emptyList());
            Authentication auth = new UsernamePasswordAuthenticationToken(userDetails, null);
            String token = jwtTokenProvider.generateAccessToken(auth);
            assertThat(token).isNotBlank();
        }

        @Test @DisplayName("Tạo refresh token")
        void generateRefreshToken() {
            String token = jwtTokenProvider.generateRefreshToken("test@speed.vn");
            assertThat(token).isNotBlank();
        }

        @Test @DisplayName("Access token và refresh token khác nhau")
        void accessAndRefresh_AreDifferent() {
            String access = jwtTokenProvider.generateAccessToken("test@speed.vn");
            String refresh = jwtTokenProvider.generateRefreshToken("test@speed.vn");
            assertThat(access).isNotEqualTo(refresh);
        }
    }

    @Nested @DisplayName("Validate & Extract") class ValidateTests {
        @Test @DisplayName("Token hợp lệ → true")
        void validateToken_Valid() {
            String token = jwtTokenProvider.generateAccessToken("test@speed.vn");
            assertThat(jwtTokenProvider.validateToken(token)).isTrue();
        }

        @Test @DisplayName("Token sai format → false")
        void validateToken_Invalid() {
            assertThat(jwtTokenProvider.validateToken("invalid.token.here")).isFalse();
        }

        @Test @DisplayName("Token rỗng → false")
        void validateToken_Empty() {
            assertThat(jwtTokenProvider.validateToken("")).isFalse();
        }

        @Test @DisplayName("Extract email từ token")
        void getEmailFromToken() {
            String token = jwtTokenProvider.generateAccessToken("admin@speed.vn");
            String email = jwtTokenProvider.getEmailFromToken(token);
            assertThat(email).isEqualTo("admin@speed.vn");
        }

        @Test @DisplayName("Extract email giữ đúng giá trị gốc")
        void getEmailFromToken_PreservesOriginal() {
            String token = jwtTokenProvider.generateAccessToken("driver+test@speed.vn");
            assertThat(jwtTokenProvider.getEmailFromToken(token)).isEqualTo("driver+test@speed.vn");
        }
    }

    @Test @DisplayName("getRefreshTokenExpirationMs trả về giá trị đúng")
    void getRefreshTokenExpirationMs() {
        assertThat(jwtTokenProvider.getRefreshTokenExpirationMs()).isEqualTo(604800000L);
    }
}
