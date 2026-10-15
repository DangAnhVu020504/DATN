package com.speed.delivery.service;

/** Map Service (Mock) - Geocoding and routing. */
public interface MapService {
    double[] geocodeAddress(String address);
    String reverseGeocode(double latitude, double longitude);
}
