package com.speed.delivery.service;

/** Email Service (Mock). */
public interface EmailService {
    void sendEmail(String to, String subject, String body);
    void sendOtpEmail(String to, String otp);
    void sendWelcomeEmail(String to, String name);
}
