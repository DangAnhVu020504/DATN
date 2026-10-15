package com.speed.delivery.controller;

import com.speed.delivery.dto.response.ApiResponse;
import com.speed.delivery.dto.response.ReviewResponse;
import com.speed.delivery.service.ReviewService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/reviews")
@RequiredArgsConstructor
@Tag(name = "Reviews", description = "API đánh giá")
public class ReviewController {

    private final ReviewService reviewService;

    @PostMapping
    @Operation(summary = "Đánh giá đơn hàng")
    public ResponseEntity<ApiResponse<ReviewResponse>> createReview(
            @RequestParam Long customerId, @RequestParam Long orderId,
            @RequestParam int rating, @RequestParam(required = false) String comment) {
        ReviewResponse response = reviewService.createReview(customerId, orderId, rating, comment);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Đánh giá thành công", response));
    }

    @GetMapping("/order/{orderId}")
    @Operation(summary = "Đánh giá của đơn hàng")
    public ResponseEntity<ApiResponse<ReviewResponse>> getOrderReview(@PathVariable Long orderId) {
        return ResponseEntity.ok(ApiResponse.success(reviewService.getOrderReview(orderId)));
    }

    @GetMapping("/driver/{driverId}")
    @Operation(summary = "Danh sách đánh giá tài xế")
    public ResponseEntity<ApiResponse<Page<ReviewResponse>>> getDriverReviews(
            @PathVariable Long driverId, Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(reviewService.getDriverReviews(driverId, pageable)));
    }
}
