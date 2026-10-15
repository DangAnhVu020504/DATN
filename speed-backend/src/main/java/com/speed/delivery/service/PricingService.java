package com.speed.delivery.service;

import java.math.BigDecimal;

/**
 * Service tính giá giao hàng.
 * Mock-friendly: dễ dàng thay đổi logic pricing trong test.
 */
public interface PricingService {
    BigDecimal calculateDeliveryPrice(double distanceKm, BigDecimal weight);
    BigDecimal calculateBasePrice();
    BigDecimal calculateDistancePrice(double distanceKm);
    BigDecimal calculateWeightSurcharge(BigDecimal weight);
    BigDecimal calculateDriverEarnings(BigDecimal totalPrice);
}
