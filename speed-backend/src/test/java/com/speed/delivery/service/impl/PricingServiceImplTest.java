package com.speed.delivery.service.impl;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.*;

/**
 * Unit Tests cho PricingServiceImpl - 20 test cases.
 * PricingServiceImpl không có dependency → test trực tiếp (không cần mock).
 * Minh họa: @ParameterizedTest, @CsvSource, boundary testing.
 */
@DisplayName("PricingServiceImpl Unit Tests")
class PricingServiceImplTest {

    private PricingServiceImpl pricingService;

    @BeforeEach
    void setUp() {
        pricingService = new PricingServiceImpl();
    }

    // ===== BASE PRICE =====
    @Nested @DisplayName("Base Price") class BasePriceTests {
        @Test @DisplayName("Base price luôn = 15,000₫")
        void calculateBasePrice() {
            assertThat(pricingService.calculateBasePrice()).isEqualTo(new BigDecimal("15000"));
        }
    }

    // ===== DISTANCE PRICE =====
    @Nested @DisplayName("Distance Price") class DistancePriceTests {
        @Test @DisplayName("0km → 0₫")
        void distancePrice_Zero() {
            assertThat(pricingService.calculateDistancePrice(0)).isEqualTo(BigDecimal.ZERO.setScale(0));
        }

        @Test @DisplayName("1km → 5,000₫")
        void distancePrice_OneKm() {
            assertThat(pricingService.calculateDistancePrice(1.0)).isEqualTo(new BigDecimal("5000"));
        }

        @ParameterizedTest(name = "{0}km → {1}₫")
        @CsvSource({"2.0, 10000", "5.0, 25000", "10.0, 50000", "0.5, 2500"})
        @DisplayName("Distance price calculation")
        void distancePrice_Parametrized(double km, long expectedPrice) {
            BigDecimal result = pricingService.calculateDistancePrice(km);
            assertThat(result.longValue()).isEqualTo(expectedPrice);
        }
    }

    // ===== WEIGHT SURCHARGE =====
    @Nested @DisplayName("Weight Surcharge") class WeightTests {
        @Test @DisplayName("null weight → 0₫ surcharge")
        void weightSurcharge_Null() {
            assertThat(pricingService.calculateWeightSurcharge(null)).isEqualTo(BigDecimal.ZERO);
        }

        @Test @DisplayName("≤5kg → 0₫ surcharge")
        void weightSurcharge_UnderThreshold() {
            assertThat(pricingService.calculateWeightSurcharge(BigDecimal.valueOf(3))).isEqualTo(BigDecimal.ZERO);
            assertThat(pricingService.calculateWeightSurcharge(BigDecimal.valueOf(5))).isEqualTo(BigDecimal.ZERO);
        }

        @Test @DisplayName("5kg (boundary) → 0₫ surcharge")
        void weightSurcharge_ExactThreshold() {
            assertThat(pricingService.calculateWeightSurcharge(BigDecimal.valueOf(5))).isEqualTo(BigDecimal.ZERO);
        }

        @Test @DisplayName("6kg → 3,000₫ surcharge (1kg excess)")
        void weightSurcharge_OneKgOver() {
            BigDecimal result = pricingService.calculateWeightSurcharge(BigDecimal.valueOf(6));
            assertThat(result).isEqualTo(new BigDecimal("3000"));
        }

        @Test @DisplayName("10kg → 15,000₫ surcharge (5kg excess)")
        void weightSurcharge_FiveKgOver() {
            BigDecimal result = pricingService.calculateWeightSurcharge(BigDecimal.valueOf(10));
            assertThat(result).isEqualTo(new BigDecimal("15000"));
        }

        @ParameterizedTest(name = "{0}kg → {1}₫ surcharge")
        @CsvSource({"5.1, 300", "7.0, 6000", "15.0, 30000", "20.0, 45000"})
        @DisplayName("Weight surcharge parametrized")
        void weightSurcharge_Parametrized(double weight, long expectedSurcharge) {
            BigDecimal result = pricingService.calculateWeightSurcharge(BigDecimal.valueOf(weight));
            assertThat(result.longValue()).isEqualTo(expectedSurcharge);
        }
    }

    // ===== TOTAL DELIVERY PRICE =====
    @Nested @DisplayName("Total Delivery Price") class TotalPriceTests {
        @Test @DisplayName("5km, 2kg → base + distance + 0 surcharge")
        void totalPrice_NormalOrder() {
            BigDecimal result = pricingService.calculateDeliveryPrice(5.0, BigDecimal.valueOf(2));
            // 15000 + 25000 + 0 = 40000
            assertThat(result).isEqualTo(new BigDecimal("40000"));
        }

        @Test @DisplayName("10km, 8kg → base + distance + weight surcharge")
        void totalPrice_HeavyOrder() {
            BigDecimal result = pricingService.calculateDeliveryPrice(10.0, BigDecimal.valueOf(8));
            // 15000 + 50000 + 9000 = 74000
            assertThat(result).isEqualTo(new BigDecimal("74000"));
        }

        @Test @DisplayName("0km, 0kg → only base price")
        void totalPrice_ZeroDistance() {
            BigDecimal result = pricingService.calculateDeliveryPrice(0, BigDecimal.ZERO);
            assertThat(result).isEqualTo(new BigDecimal("15000"));
        }
    }

    // ===== DRIVER EARNINGS =====
    @Nested @DisplayName("Driver Earnings") class EarningsTests {
        @Test @DisplayName("40,000₫ → 32,000₫ earnings (80%)")
        void driverEarnings_Normal() {
            assertThat(pricingService.calculateDriverEarnings(BigDecimal.valueOf(40000)))
                    .isEqualTo(new BigDecimal("32000"));
        }

        @Test @DisplayName("0₫ → 0₫ earnings")
        void driverEarnings_Zero() {
            assertThat(pricingService.calculateDriverEarnings(BigDecimal.ZERO))
                    .isEqualTo(new BigDecimal("0"));
        }

        @Test @DisplayName("100,000₫ → 80,000₫ earnings")
        void driverEarnings_Large() {
            assertThat(pricingService.calculateDriverEarnings(BigDecimal.valueOf(100000)))
                    .isEqualTo(new BigDecimal("80000"));
        }
    }
}
