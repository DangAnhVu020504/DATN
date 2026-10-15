package com.speed.delivery.service.impl;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import static org.assertj.core.api.Assertions.*;

/**
 * Unit Tests cho DistanceServiceImpl - 10 test cases.
 * Test Haversine formula. Không cần mock.
 */
@DisplayName("DistanceServiceImpl Unit Tests")
class DistanceServiceImplTest {

    private DistanceServiceImpl distanceService;

    @BeforeEach
    void setUp() {
        distanceService = new DistanceServiceImpl();
    }

    @Test @DisplayName("Khoảng cách giữa 2 điểm trùng nhau = 0")
    void samePoint_ZeroDistance() {
        double result = distanceService.calculateDistance(10.776, 106.700, 10.776, 106.700);
        assertThat(result).isEqualTo(0.0);
    }

    @Test @DisplayName("Q.1 → Q.3 HCM (~3-4km)")
    void hcm_District1To3() {
        double result = distanceService.calculateDistance(10.7769, 106.7009, 10.7840, 106.6880);
        assertThat(result).isBetween(1.0, 5.0);
    }

    @Test @DisplayName("HCM → Hà Nội (~1200km)")
    void hcm_ToHanoi() {
        double result = distanceService.calculateDistance(10.7769, 106.7009, 21.0285, 105.8542);
        assertThat(result).isBetween(1100.0, 1300.0);
    }

    @ParameterizedTest(name = "({0},{1}) → ({2},{3})")
    @CsvSource({
        "0, 0, 0, 1, 111.19",    // ~111km per degree longitude at equator
        "0, 0, 1, 0, 111.19",    // ~111km per degree latitude
    })
    @DisplayName("Khoảng cách xấp xỉ 111km/degree")
    void degreeApproximation(double lat1, double lon1, double lat2, double lon2, double expected) {
        double result = distanceService.calculateDistance(lat1, lon1, lat2, lon2);
        assertThat(result).isCloseTo(expected, within(1.0));
    }

    @Test @DisplayName("Estimate time - 25km → ~60 phút")
    void estimateTime_25km() {
        int minutes = distanceService.estimateTimeMinutes(25.0);
        assertThat(minutes).isEqualTo(60);
    }

    @Test @DisplayName("Estimate time - 5km → ~12 phút")
    void estimateTime_5km() {
        int minutes = distanceService.estimateTimeMinutes(5.0);
        assertThat(minutes).isEqualTo(12);
    }

    @Test @DisplayName("Estimate time - 0km → 0 phút")
    void estimateTime_Zero() {
        int minutes = distanceService.estimateTimeMinutes(0);
        assertThat(minutes).isEqualTo(0);
    }

    @Test @DisplayName("Khoảng cách luôn dương")
    void distance_AlwaysPositive() {
        double result = distanceService.calculateDistance(10.0, 106.0, 11.0, 107.0);
        assertThat(result).isPositive();
    }

    @Test @DisplayName("Khoảng cách đối xứng (A→B = B→A)")
    void distance_Symmetric() {
        double ab = distanceService.calculateDistance(10.776, 106.700, 21.028, 105.854);
        double ba = distanceService.calculateDistance(21.028, 105.854, 10.776, 106.700);
        assertThat(ab).isEqualTo(ba);
    }
}
