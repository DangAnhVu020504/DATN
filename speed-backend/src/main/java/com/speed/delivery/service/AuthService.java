package com.speed.delivery.service;

import com.speed.delivery.dto.request.*;
import com.speed.delivery.dto.response.JwtResponse;
import com.speed.delivery.dto.response.UserResponse;

/**
 * Service interface cho xác thực và phân quyền.
 * Interface-based design cho phép dễ dàng mock trong unit test.
 */
public interface AuthService {
    JwtResponse register(RegisterRequest request);
    JwtResponse login(LoginRequest request);
    JwtResponse refreshToken(RefreshTokenRequest request);
    void forgotPassword(String email);
    void resetPassword(String email, String otp, String newPassword);
    void changePassword(String email, ChangePasswordRequest request);
    void logout(String email, String refreshToken);
    UserResponse getProfile(String email);
    UserResponse updateProfile(String email, UpdateProfileRequest request);
}
