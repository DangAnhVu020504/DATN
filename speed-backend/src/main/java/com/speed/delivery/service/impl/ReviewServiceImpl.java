package com.speed.delivery.service.impl;

import com.speed.delivery.dto.response.ReviewResponse;
import com.speed.delivery.entity.*;
import com.speed.delivery.enums.OrderStatus;
import com.speed.delivery.exception.BadRequestException;
import com.speed.delivery.exception.ResourceNotFoundException;
import com.speed.delivery.repository.*;
import com.speed.delivery.service.AuditLogService;
import com.speed.delivery.service.ReviewService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * ReviewService implementation.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ReviewServiceImpl implements ReviewService {

    private final ReviewRepository reviewRepository;
    private final OrderRepository orderRepository;
    private final CustomerRepository customerRepository;
    private final DriverRepository driverRepository;
    private final AuditLogService auditLogService;

    @Override
    @Transactional
    public ReviewResponse createReview(Long customerId, Long orderId, int rating, String comment) {
        if (rating < 1 || rating > 5) {
            throw new BadRequestException("Đánh giá phải từ 1 đến 5 sao");
        }

        if (reviewRepository.existsByOrderId(orderId)) {
            throw new BadRequestException("Đơn hàng đã được đánh giá");
        }

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", orderId));

        if (order.getStatus() != OrderStatus.DELIVERED) {
            throw new BadRequestException("Chỉ có thể đánh giá đơn hàng đã giao thành công");
        }

        if (!order.getCustomer().getId().equals(customerId)) {
            throw new BadRequestException("Đơn hàng không thuộc về khách hàng này");
        }

        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new ResourceNotFoundException("Customer", "id", customerId));

        Driver driver = order.getDriver();
        if (driver == null) {
            throw new BadRequestException("Đơn hàng chưa có tài xế");
        }

        Review review = Review.builder()
                .order(order)
                .customer(customer)
                .driver(driver)
                .rating(rating)
                .comment(comment)
                .build();

        review = reviewRepository.save(review);

        // Cập nhật rating trung bình cho driver
        Double avgRating = reviewRepository.calculateAverageRatingByDriverId(driver.getId());
        if (avgRating != null) {
            driver.setRating(BigDecimal.valueOf(avgRating).setScale(2, RoundingMode.HALF_UP));
            driverRepository.save(driver);
        }

        auditLogService.log(customer.getUser().getId(), "CREATE_REVIEW", "Review", review.getId(),
                "Rating: " + rating);

        log.info("Review created for order {}: {} stars", orderId, rating);
        return mapResponse(review);
    }

    @Override
    @Transactional(readOnly = true)
    public ReviewResponse getOrderReview(Long orderId) {
        Review review = reviewRepository.findByOrderId(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Review", "orderId", orderId));
        return mapResponse(review);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ReviewResponse> getDriverReviews(Long driverId, Pageable pageable) {
        return reviewRepository.findByDriverIdOrderByCreatedAtDesc(driverId, pageable)
                .map(this::mapResponse);
    }

    private ReviewResponse mapResponse(Review review) {
        return ReviewResponse.builder()
                .id(review.getId())
                .orderId(review.getOrder().getId())
                .customerName(review.getCustomer().getUser().getFullName())
                .driverName(review.getDriver().getUser().getFullName())
                .rating(review.getRating())
                .comment(review.getComment())
                .createdAt(review.getCreatedAt())
                .build();
    }
}
