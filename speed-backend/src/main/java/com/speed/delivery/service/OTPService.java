package com.speed.delivery.service;

/** OTP Service (Mock). */
public interface OTPService {
    String generateOtp(Long userId, String purpose);
    boolean verifyOtp(Long userId, String otp, String purpose);
}
