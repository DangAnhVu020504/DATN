package com.speed.delivery.service.impl;

import com.speed.delivery.service.MapService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/**
 * MapService implementation (Mock).
 * Returns mock coordinates.
 */
@Slf4j
@Service
public class MapServiceImpl implements MapService {

    @Override
    public double[] geocodeAddress(String address) {
        log.info("[MOCK MAP] Geocoding address: {}", address);
        // Mock: trả về tọa độ TP.HCM
        return new double[]{10.7769, 106.7009};
    }

    @Override
    public String reverseGeocode(double latitude, double longitude) {
        log.info("[MOCK MAP] Reverse geocoding: {}, {}", latitude, longitude);
        return "TP. Hồ Chí Minh, Việt Nam";
    }
}
