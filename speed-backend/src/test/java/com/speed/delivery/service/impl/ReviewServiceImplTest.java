package com.speed.delivery.service.impl;

import com.speed.delivery.dto.response.ReviewResponse;
import com.speed.delivery.entity.*;
import com.speed.delivery.enums.DriverStatus;
import com.speed.delivery.enums.OrderStatus;
import com.speed.delivery.exception.BadRequestException;
import com.speed.delivery.exception.ResourceNotFoundException;
import com.speed.delivery.repository.*;
import com.speed.delivery.service.AuditLogService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.BDDMockito.*;

/**
 * Unit Tests cho ReviewServiceImpl - 8 test cases.
 * Minh họa mock cho entity quan hệ phức tạp.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("ReviewServiceImpl Unit Tests")
class ReviewServiceImplTest {

    @Mock private ReviewRepository reviewRepository;
    @Mock private OrderRepository orderRepository;
    @Mock private CustomerRepository customerRepository;
    @Mock private DriverRepository driverRepository;
    @Mock private AuditLogService auditLogService;

    @InjectMocks private ReviewServiceImpl reviewService;

    private User custUser, drvUser;
    private Customer customer;
    private Driver driver;
    private Order order;

    @BeforeEach
    void setUp() {
        custUser = User.builder().id(1L).fullName("Khách").build();
        drvUser = User.builder().id(2L).fullName("Tài xế").build();
        customer = Customer.builder().id(1L).user(custUser).build();
        driver = Driver.builder().id(1L).user(drvUser).rating(BigDecimal.valueOf(4.5)).build();
        order = Order.builder().id(1L).customer(customer).driver(driver).status(OrderStatus.DELIVERED).build();
    }

    @Test @DisplayName("Đánh giá 5 sao thành công")
    void createReview_Success() {
        given(reviewRepository.existsByOrderId(1L)).willReturn(false);
        given(orderRepository.findById(1L)).willReturn(Optional.of(order));
        given(customerRepository.findById(1L)).willReturn(Optional.of(customer));
        given(reviewRepository.save(any())).willReturn(Review.builder().id(1L)
                .order(order).customer(customer).driver(driver).rating(5).comment("Tuyệt vời").build());
        given(reviewRepository.calculateAverageRatingByDriverId(1L)).willReturn(4.8);
        given(driverRepository.save(any())).willReturn(driver);

        ReviewResponse res = reviewService.createReview(1L, 1L, 5, "Tuyệt vời");

        assertThat(res.getRating()).isEqualTo(5);
        assertThat(res.getComment()).isEqualTo("Tuyệt vời");
        then(driverRepository).should().save(any());
    }

    @Test @DisplayName("Rating ngoài khoảng 1-5")
    void createReview_InvalidRating() {
        assertThatThrownBy(() -> reviewService.createReview(1L, 1L, 0, ""))
                .isInstanceOf(BadRequestException.class).hasMessageContaining("1 đến 5");
        assertThatThrownBy(() -> reviewService.createReview(1L, 1L, 6, ""))
                .isInstanceOf(BadRequestException.class);
    }

    @Test @DisplayName("Đánh giá trùng - đã đánh giá rồi")
    void createReview_AlreadyReviewed() {
        given(reviewRepository.existsByOrderId(1L)).willReturn(true);
        assertThatThrownBy(() -> reviewService.createReview(1L, 1L, 5, "ok"))
                .isInstanceOf(BadRequestException.class).hasMessageContaining("đã được đánh giá");
    }

    @Test @DisplayName("Đánh giá đơn chưa giao")
    void createReview_NotDelivered() {
        order.setStatus(OrderStatus.PENDING);
        given(reviewRepository.existsByOrderId(1L)).willReturn(false);
        given(orderRepository.findById(1L)).willReturn(Optional.of(order));
        assertThatThrownBy(() -> reviewService.createReview(1L, 1L, 5, ""))
                .isInstanceOf(BadRequestException.class).hasMessageContaining("đã giao");
    }

    @Test @DisplayName("Đánh giá đơn không thuộc customer")
    void createReview_WrongCustomer() {
        given(reviewRepository.existsByOrderId(1L)).willReturn(false);
        given(orderRepository.findById(1L)).willReturn(Optional.of(order));
        assertThatThrownBy(() -> reviewService.createReview(99L, 1L, 5, ""))
                .isInstanceOf(BadRequestException.class).hasMessageContaining("không thuộc");
    }

    @Test @DisplayName("Lấy review theo orderId")
    void getOrderReview_Success() {
        Review review = Review.builder().id(1L).order(order).customer(customer).driver(driver)
                .rating(4).comment("Tốt").build();
        given(reviewRepository.findByOrderId(1L)).willReturn(Optional.of(review));
        ReviewResponse res = reviewService.getOrderReview(1L);
        assertThat(res.getRating()).isEqualTo(4);
    }

    @Test @DisplayName("Lấy review - không tìm thấy")
    void getOrderReview_NotFound() {
        given(reviewRepository.findByOrderId(99L)).willReturn(Optional.empty());
        assertThatThrownBy(() -> reviewService.getOrderReview(99L))
                .isInstanceOf(ResourceNotFoundException.class);
    }
}
