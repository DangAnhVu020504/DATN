package com.speed.delivery.service.impl;

import com.speed.delivery.entity.OtpCode;
import com.speed.delivery.repository.OtpCodeRepository;
import com.speed.delivery.service.OTPService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.Random;

/**
 * OTPService implementation (Mock Service).
 * Sinh OTP 6 số, lưu DB, verify. Không gửi SMS/Email thực.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class OTPServiceImpl implements OTPService {

    private final OtpCodeRepository otpCodeRepository;

    @Override
    public String generateOtp(Long userId, String purpose) {
        String otp = String.format("%06d", new Random().nextInt(999999));

        OtpCode otpCode = OtpCode.builder()
                .user(com.speed.delivery.entity.User.builder().id(userId).build())
                .code(otp)
                .purpose(purpose)
                .expiresAt(LocalDateTime.now().plusMinutes(5))
                .isUsed(false)
                .build();
        otpCodeRepository.save(otpCode);

        log.info("OTP generated for userId={}, purpose={}: {}", userId, purpose, otp);
        return otp;
    }

    @Override
    public boolean verifyOtp(Long userId, String otp, String purpose) {
        return otpCodeRepository
                .findTopByUserIdAndPurposeAndIsUsedFalseOrderByCreatedAtDesc(userId, purpose)
                .map(otpCode -> {
                    if (otpCode.getExpiresAt().isBefore(LocalDateTime.now())) {
                        return false;
                    }
                    if (!otpCode.getCode().equals(otp)) {
                        return false;
                    }
                    otpCode.setIsUsed(true);
                    otpCodeRepository.save(otpCode);
                    return true;
                })
                .orElse(false);
    }
}
