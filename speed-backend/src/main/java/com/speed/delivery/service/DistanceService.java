package com.speed.delivery.service;

/** Distance Service (Mock) - Tính khoảng cách. */
public interface DistanceService {
    double calculateDistance(double lat1, double lon1, double lat2, double lon2);
    int estimateTimeMinutes(double distanceKm);
}
