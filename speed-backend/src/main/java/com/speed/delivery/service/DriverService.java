package com.speed.delivery.service;

public interface DriverService {
    void toggleAvailability(Long driverId, boolean available);
    com.speed.delivery.dto.response.OrderResponse acceptOrder(Long driverId, Long orderId);
    void rejectOrder(Long driverId, Long orderId);
    com.speed.delivery.dto.response.OrderResponse completeDelivery(Long driverId, Long orderId);
    org.springframework.data.domain.Page<com.speed.delivery.dto.response.OrderResponse> getDeliveryHistory(Long driverId, org.springframework.data.domain.Pageable pageable);
    java.math.BigDecimal getEarnings(Long driverId);
}
