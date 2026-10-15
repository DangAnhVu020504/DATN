package com.speed.delivery.service.impl;

import com.speed.delivery.service.DistanceService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/**
 * DistanceService implementation (Mock).
 * Sử dụng công thức Haversine để tính khoảng cách.
 */
@Slf4j
@Service
public class DistanceServiceImpl implements DistanceService {

    private static final double EARTH_RADIUS_KM = 6371.0;
    private static final double AVERAGE_SPEED_KMH = 25.0;

    @Override
    public double calculateDistance(double lat1, double lon1, double lat2, double lon2) {
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) *
                        Math.sin(dLon / 2) * Math.sin(dLon / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        double distance = EARTH_RADIUS_KM * c;
        log.debug("Distance calculated: {}km", String.format("%.2f", distance));
        return Math.round(distance * 100.0) / 100.0;
    }

    @Override
    public int estimateTimeMinutes(double distanceKm) {
        return (int) Math.ceil((distanceKm / AVERAGE_SPEED_KMH) * 60);
    }
}
