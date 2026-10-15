package com.speed.delivery.service;

import com.speed.delivery.enums.PaymentMethod;
import java.math.BigDecimal;

/**
 * Service xử lý thanh toán (Mock Service).
 */
public interface PaymentService {
    boolean processPayment(Long orderId, BigDecimal amount, PaymentMethod method);
    boolean refundPayment(Long orderId);
    String getPaymentStatus(Long orderId);
}
