package com.speed.delivery.service;

import com.speed.delivery.dto.response.OrderResponse;
import com.speed.delivery.dto.request.CreateOrderRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface OrderService {
    OrderResponse createOrder(String customerEmail, CreateOrderRequest request);
    OrderResponse getOrderById(Long orderId);
    OrderResponse getOrderByCode(String orderCode);
    Page<OrderResponse> getCustomerOrders(Long customerId, Pageable pageable);
    Page<OrderResponse> getDriverOrders(Long driverId, Pageable pageable);
    OrderResponse assignDriver(Long orderId, Long driverId);
    OrderResponse updateOrderStatus(Long orderId, String status, Long changedBy);
    OrderResponse cancelOrder(Long orderId, String reason, Long cancelledBy);
}
