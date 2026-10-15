package com.speed.delivery.service.impl;

import com.speed.delivery.service.EmailService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/**
 * EmailService implementation (Mock).
 * Chỉ log thay vì gửi email thực.
 */
@Slf4j
@Service
public class EmailServiceImpl implements EmailService {

    @Override
    public void sendEmail(String to, String subject, String body) {
        log.info("[MOCK EMAIL] To: {}, Subject: {}, Body: {}", to, subject, body);
    }

    @Override
    public void sendOtpEmail(String to, String otp) {
        log.info("[MOCK EMAIL] OTP to {}: {}", to, otp);
    }

    @Override
    public void sendWelcomeEmail(String to, String name) {
        log.info("[MOCK EMAIL] Welcome email to {}: Xin chào {}", to, name);
    }
}
