package com.speed.delivery.service.impl;

import com.speed.delivery.enums.PaymentMethod;
import com.speed.delivery.enums.PaymentStatus;
import com.speed.delivery.entity.Order;
import com.speed.delivery.entity.Payment;
import com.speed.delivery.exception.PaymentFailedException;
import com.speed.delivery.exception.ResourceNotFoundException;
import com.speed.delivery.repository.OrderRepository;
import com.speed.delivery.repository.PaymentRepository;
import com.speed.delivery.service.PaymentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * PaymentService implementation (Mock-friendly).
 * Mô phỏng xử lý thanh toán - không kết nối cổng thanh toán thực.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PaymentServiceImpl implements PaymentService {

    private final PaymentRepository paymentRepository;
    private final OrderRepository orderRepository;

    @Override
    @Transactional
    public boolean processPayment(Long orderId, BigDecimal amount, PaymentMethod method) {
        log.info("Processing payment for order {}: {} via {}", orderId, amount, method);

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", orderId));

        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new PaymentFailedException("Số tiền thanh toán không hợp lệ");
        }

        Payment payment = Payment.builder()
                .order(order)
                .paymentMethod(method)
                .amount(amount)
                .paymentStatus(method == PaymentMethod.CASH ? PaymentStatus.PENDING : PaymentStatus.COMPLETED)
                .transactionId("TXN-" + System.currentTimeMillis())
                .paidAt(method != PaymentMethod.CASH ? LocalDateTime.now() : null)
                .build();

        paymentRepository.save(payment);
        log.info("[MOCK PAYMENT] Payment processed: orderId={}, status={}", orderId, payment.getPaymentStatus());
        return true;
    }

    @Override
    @Transactional
    public boolean refundPayment(Long orderId) {
        log.info("Refunding payment for order {}", orderId);

        return paymentRepository.findByOrderId(orderId)
                .map(payment -> {
                    payment.setPaymentStatus(PaymentStatus.REFUNDED);
                    paymentRepository.save(payment);
                    log.info("[MOCK PAYMENT] Refund processed for order {}", orderId);
                    return true;
                })
                .orElse(false);
    }

    @Override
    @Transactional(readOnly = true)
    public String getPaymentStatus(Long orderId) {
        return paymentRepository.findByOrderId(orderId)
                .map(payment -> payment.getPaymentStatus().name())
                .orElse("NOT_FOUND");
    }
}
