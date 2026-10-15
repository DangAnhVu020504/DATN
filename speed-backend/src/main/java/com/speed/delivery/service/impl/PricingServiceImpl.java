package com.speed.delivery.service.impl;

import com.speed.delivery.service.PricingService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * PricingService implementation - Tính giá giao hàng.
 */
@Slf4j
@Service
public class PricingServiceImpl implements PricingService {

    private static final BigDecimal BASE_PRICE = new BigDecimal("15000");
    private static final BigDecimal PRICE_PER_KM = new BigDecimal("5000");
    private static final BigDecimal WEIGHT_THRESHOLD = new BigDecimal("5");
    private static final BigDecimal WEIGHT_SURCHARGE_PER_KG = new BigDecimal("3000");
    private static final BigDecimal DRIVER_EARNING_RATE = new BigDecimal("0.80");

    @Override
    public BigDecimal calculateDeliveryPrice(double distanceKm, BigDecimal weight) {
        BigDecimal base = calculateBasePrice();
        BigDecimal distance = calculateDistancePrice(distanceKm);
        BigDecimal weightSurcharge = calculateWeightSurcharge(weight);
        return base.add(distance).add(weightSurcharge).setScale(0, RoundingMode.CEILING);
    }

    @Override
    public BigDecimal calculateBasePrice() {
        return BASE_PRICE;
    }

    @Override
    public BigDecimal calculateDistancePrice(double distanceKm) {
        return PRICE_PER_KM.multiply(BigDecimal.valueOf(distanceKm))
                .setScale(0, RoundingMode.CEILING);
    }

    @Override
    public BigDecimal calculateWeightSurcharge(BigDecimal weight) {
        if (weight == null || weight.compareTo(WEIGHT_THRESHOLD) <= 0) {
            return BigDecimal.ZERO;
        }
        BigDecimal excess = weight.subtract(WEIGHT_THRESHOLD);
        return excess.multiply(WEIGHT_SURCHARGE_PER_KG).setScale(0, RoundingMode.CEILING);
    }

    @Override
    public BigDecimal calculateDriverEarnings(BigDecimal totalPrice) {
        return totalPrice.multiply(DRIVER_EARNING_RATE).setScale(0, RoundingMode.FLOOR);
    }
}
