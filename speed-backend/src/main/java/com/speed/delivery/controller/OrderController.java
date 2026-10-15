package com.speed.delivery.controller;

import com.speed.delivery.dto.request.CreateOrderRequest;
import com.speed.delivery.dto.response.ApiResponse;
import com.speed.delivery.dto.response.OrderResponse;
import com.speed.delivery.service.OrderService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/orders")
@RequiredArgsConstructor
@Tag(name = "Orders", description = "API quản lý đơn hàng")
public class OrderController {

    private final OrderService orderService;

    @PostMapping
    @Operation(summary = "Tạo đơn hàng mới")
    public ResponseEntity<ApiResponse<OrderResponse>> createOrder(
            Authentication auth, @Valid @RequestBody CreateOrderRequest request) {
        OrderResponse response = orderService.createOrder(auth.getName(), request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tạo đơn hàng thành công", response));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Lấy thông tin đơn hàng theo ID")
    public ResponseEntity<ApiResponse<OrderResponse>> getOrderById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(orderService.getOrderById(id)));
    }

    @GetMapping("/code/{orderCode}")
    @Operation(summary = "Lấy thông tin đơn hàng theo mã")
    public ResponseEntity<ApiResponse<OrderResponse>> getOrderByCode(@PathVariable String orderCode) {
        return ResponseEntity.ok(ApiResponse.success(orderService.getOrderByCode(orderCode)));
    }

    @GetMapping("/customer/{customerId}")
    @Operation(summary = "Danh sách đơn hàng của khách hàng")
    public ResponseEntity<ApiResponse<Page<OrderResponse>>> getCustomerOrders(
            @PathVariable Long customerId, Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(orderService.getCustomerOrders(customerId, pageable)));
    }

    @PutMapping("/{id}/status")
    @Operation(summary = "Cập nhật trạng thái đơn hàng")
    public ResponseEntity<ApiResponse<OrderResponse>> updateStatus(
            @PathVariable Long id, @RequestParam String status, Authentication auth) {
        // Simplified: using 0L as changedBy placeholder
        return ResponseEntity.ok(ApiResponse.success(orderService.updateOrderStatus(id, status, 0L)));
    }

    @PutMapping("/{id}/cancel")
    @Operation(summary = "Hủy đơn hàng")
    public ResponseEntity<ApiResponse<OrderResponse>> cancelOrder(
            @PathVariable Long id, @RequestParam String reason, Authentication auth) {
        return ResponseEntity.ok(ApiResponse.success(orderService.cancelOrder(id, reason, 0L)));
    }
}
