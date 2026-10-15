package com.speed.delivery.service.impl;

import com.speed.delivery.dto.request.*;
import com.speed.delivery.dto.response.JwtResponse;
import com.speed.delivery.dto.response.UserResponse;
import com.speed.delivery.entity.*;
import com.speed.delivery.exception.*;
import com.speed.delivery.repository.*;
import com.speed.delivery.security.JwtTokenProvider;
import com.speed.delivery.service.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Implementation của AuthService.
 * Tất cả dependencies được inject qua constructor (Mockable).
 *
 * <p>Dependencies cần mock trong test:</p>
 * <ul>
 *   <li>UserRepository</li>
 *   <li>RoleRepository</li>
 *   <li>CustomerRepository</li>
 *   <li>DriverRepository</li>
 *   <li>RefreshTokenRepository</li>
 *   <li>PasswordEncoder</li>
 *   <li>AuthenticationManager</li>
 *   <li>JwtTokenProvider</li>
 *   <li>OTPService</li>
 *   <li>EmailService</li>
 *   <li>AuditLogService</li>
 * </ul>
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final CustomerRepository customerRepository;
    private final DriverRepository driverRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider jwtTokenProvider;
    private final OTPService otpService;
    private final EmailService emailService;
    private final AuditLogService auditLogService;

    @Override
    @Transactional
    public JwtResponse register(RegisterRequest request) {
        log.info("Registering new user with email: {}", request.getEmail());

        // Check duplicate email
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateResourceException("Email đã được sử dụng: " + request.getEmail());
        }

        // Check duplicate phone
        if (userRepository.existsByPhone(request.getPhone())) {
            throw new DuplicateResourceException("Số điện thoại đã được sử dụng: " + request.getPhone());
        }

        // Find role
        String roleName = request.getRole().startsWith("ROLE_") ? request.getRole() : "ROLE_" + request.getRole().toUpperCase();
        Role role = roleRepository.findByName(roleName)
                .orElseThrow(() -> new ResourceNotFoundException("Role", "name", roleName));

        // Create user
        User user = User.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName())
                .phone(request.getPhone())
                .isActive(true)
                .isVerified(false)
                .build();
        user.getRoles().add(role);
        user = userRepository.save(user);

        // Create profile based on role
        if ("ROLE_CUSTOMER".equals(roleName)) {
            Customer customer = Customer.builder().user(user).build();
            customerRepository.save(customer);
        } else if ("ROLE_DRIVER".equals(roleName)) {
            Driver driver = Driver.builder().user(user).build();
            driverRepository.save(driver);
        }

        // Generate tokens
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword()));

        String accessToken = jwtTokenProvider.generateAccessToken(authentication);
        String refreshToken = createRefreshToken(user);

        // Send welcome email
        emailService.sendWelcomeEmail(user.getEmail(), user.getFullName());

        // Audit log
        auditLogService.log(user.getId(), "REGISTER", "User", user.getId(), "New user registered: " + user.getEmail());

        log.info("User registered successfully: {}", user.getEmail());

        return buildJwtResponse(user, accessToken, refreshToken);
    }

    @Override
    @Transactional
    public JwtResponse login(LoginRequest request) {
        log.info("User login attempt: {}", request.getEmail());

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword()));

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", request.getEmail()));

        if (!user.getIsActive()) {
            throw new UnauthorizedException("Tài khoản đã bị vô hiệu hóa");
        }

        String accessToken = jwtTokenProvider.generateAccessToken(authentication);
        String refreshToken = createRefreshToken(user);

        auditLogService.log(user.getId(), "LOGIN", "User", user.getId(), "User logged in");

        log.info("User logged in successfully: {}", user.getEmail());

        return buildJwtResponse(user, accessToken, refreshToken);
    }

    @Override
    @Transactional
    public JwtResponse refreshToken(RefreshTokenRequest request) {
        log.info("Refreshing token");

        RefreshToken storedToken = refreshTokenRepository
                .findByTokenAndIsRevokedFalse(request.getRefreshToken())
                .orElseThrow(() -> new UnauthorizedException("Refresh token không hợp lệ"));

        if (storedToken.getExpiresAt().isBefore(LocalDateTime.now())) {
            storedToken.setIsRevoked(true);
            refreshTokenRepository.save(storedToken);
            throw new UnauthorizedException("Refresh token đã hết hạn");
        }

        // Revoke old token (rotation)
        storedToken.setIsRevoked(true);
        refreshTokenRepository.save(storedToken);

        User user = storedToken.getUser();
        String newAccessToken = jwtTokenProvider.generateAccessToken(user.getEmail());
        String newRefreshToken = createRefreshToken(user);

        return buildJwtResponse(user, newAccessToken, newRefreshToken);
    }

    @Override
    @Transactional
    public void forgotPassword(String email) {
        log.info("Forgot password request for: {}", email);

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));

        String otp = otpService.generateOtp(user.getId(), "PASSWORD_RESET");
        emailService.sendOtpEmail(user.getEmail(), otp);

        auditLogService.log(user.getId(), "FORGOT_PASSWORD", "User", user.getId(), "Password reset OTP sent");
    }

    @Override
    @Transactional
    public void resetPassword(String email, String otp, String newPassword) {
        log.info("Reset password for: {}", email);

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));

        boolean isValid = otpService.verifyOtp(user.getId(), otp, "PASSWORD_RESET");
        if (!isValid) {
            throw new BadRequestException("Mã OTP không hợp lệ hoặc đã hết hạn");
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        // Revoke all refresh tokens
        refreshTokenRepository.revokeAllByUserId(user.getId());

        auditLogService.log(user.getId(), "RESET_PASSWORD", "User", user.getId(), "Password reset successfully");
    }

    @Override
    @Transactional
    public void changePassword(String email, ChangePasswordRequest request) {
        log.info("Change password for: {}", email);

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new BadRequestException("Mật khẩu hiện tại không chính xác");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        auditLogService.log(user.getId(), "CHANGE_PASSWORD", "User", user.getId(), "Password changed");
    }

    @Override
    @Transactional
    public void logout(String email, String refreshToken) {
        log.info("User logout: {}", email);

        refreshTokenRepository.findByTokenAndIsRevokedFalse(refreshToken)
                .ifPresent(token -> {
                    token.setIsRevoked(true);
                    refreshTokenRepository.save(token);
                });

        User user = userRepository.findByEmail(email).orElse(null);
        if (user != null) {
            auditLogService.log(user.getId(), "LOGOUT", "User", user.getId(), "User logged out");
        }
    }

    @Override
    @Transactional(readOnly = true)
    public UserResponse getProfile(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));
        return buildUserResponse(user);
    }

    @Override
    @Transactional
    public UserResponse updateProfile(String email, UpdateProfileRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));

        if (request.getFullName() != null) {
            user.setFullName(request.getFullName());
        }
        if (request.getPhone() != null) {
            if (userRepository.existsByPhone(request.getPhone()) &&
                    !request.getPhone().equals(user.getPhone())) {
                throw new DuplicateResourceException("Số điện thoại đã được sử dụng");
            }
            user.setPhone(request.getPhone());
        }
        if (request.getAvatarUrl() != null) {
            user.setAvatarUrl(request.getAvatarUrl());
        }

        user = userRepository.save(user);
        auditLogService.log(user.getId(), "UPDATE_PROFILE", "User", user.getId(), "Profile updated");

        return buildUserResponse(user);
    }

    // ===== Private Helper Methods =====

    private String createRefreshToken(User user) {
        String tokenValue = jwtTokenProvider.generateRefreshToken(user.getEmail());
        RefreshToken refreshToken = RefreshToken.builder()
                .user(user)
                .token(tokenValue)
                .expiresAt(LocalDateTime.now().plusSeconds(
                        jwtTokenProvider.getRefreshTokenExpirationMs() / 1000))
                .isRevoked(false)
                .build();
        refreshTokenRepository.save(refreshToken);
        return tokenValue;
    }

    private JwtResponse buildJwtResponse(User user, String accessToken, String refreshToken) {
        List<String> roles = user.getRoles().stream()
                .map(Role::getName)
                .collect(Collectors.toList());

        Long customerId = customerRepository.findByUserId(user.getId())
                .map(Customer::getId).orElse(null);
        Long driverId = driverRepository.findByUserId(user.getId())
                .map(Driver::getId).orElse(null);

        return JwtResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .userId(user.getId())
                .customerId(customerId)
                .driverId(driverId)
                .email(user.getEmail())
                .fullName(user.getFullName())
                .roles(roles)
                .build();
    }

    private UserResponse buildUserResponse(User user) {
        List<String> roles = user.getRoles().stream()
                .map(Role::getName)
                .collect(Collectors.toList());

        return UserResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .phone(user.getPhone())
                .avatarUrl(user.getAvatarUrl())
                .isActive(user.getIsActive())
                .isVerified(user.getIsVerified())
                .roles(roles)
                .createdAt(user.getCreatedAt() != null ? user.getCreatedAt().toString() : null)
                .build();
    }
}
