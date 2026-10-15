package com.speed.delivery.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * DTO phản hồi thông tin đơn hàng.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderResponse {

    private Long id;
    private String orderCode;

    // Customer info
    private Long customerId;
    private String customerName;

    // Driver info
    private Long driverId;
    private String driverName;
    private String driverPhone;

    // Pickup
    private String pickupAddress;
    private String pickupContactName;
    private String pickupContactPhone;

    // Delivery
    private String deliveryAddress;
    private String deliveryContactName;
    private String deliveryContactPhone;

    // Package
    private String packageDescription;
    private BigDecimal packageWeight;
    private String packageNote;

    // Pricing
    private BigDecimal distanceKm;
    private BigDecimal basePrice;
    private BigDecimal distancePrice;
    private BigDecimal weightSurcharge;
    private BigDecimal discountAmount;
    private BigDecimal totalPrice;

    // Status
    private String status;
    private String deliveryType;
    private LocalDateTime scheduledTime;

    // Timestamps
    private LocalDateTime createdAt;
    private LocalDateTime acceptedAt;
    private LocalDateTime deliveredAt;
}
