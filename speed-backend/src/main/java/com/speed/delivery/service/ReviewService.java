package com.speed.delivery.service;

public interface ReviewService {
    com.speed.delivery.dto.response.ReviewResponse createReview(Long customerId, Long orderId, int rating, String comment);
    com.speed.delivery.dto.response.ReviewResponse getOrderReview(Long orderId);
    org.springframework.data.domain.Page<com.speed.delivery.dto.response.ReviewResponse> getDriverReviews(Long driverId, org.springframework.data.domain.Pageable pageable);
}
