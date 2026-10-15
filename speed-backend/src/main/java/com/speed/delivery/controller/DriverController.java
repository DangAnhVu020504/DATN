package com.speed.delivery.controller;

import com.speed.delivery.dto.response.ApiResponse;
import com.speed.delivery.dto.response.OrderResponse;
import com.speed.delivery.service.DriverService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;

@RestController
@RequestMapping("/drivers")
@RequiredArgsConstructor
@Tag(name = "Drivers", description = "API tài xế")
public class DriverController {

    private final DriverService driverService;

    @PutMapping("/{driverId}/availability")
    @Operation(summary = "Bật/Tắt nhận đơn")
    public ResponseEntity<ApiResponse<Void>> toggleAvailability(
            @PathVariable Long driverId, @RequestParam boolean available) {
        driverService.toggleAvailability(driverId, available);
        return ResponseEntity.ok(ApiResponse.success(available ? "Đã bật nhận đơn" : "Đã tắt nhận đơn"));
    }

    @PostMapping("/{driverId}/orders/{orderId}/accept")
    @Operation(summary = "Nhận đơn hàng")
    public ResponseEntity<ApiResponse<OrderResponse>> acceptOrder(
            @PathVariable Long driverId, @PathVariable Long orderId) {
        return ResponseEntity.ok(ApiResponse.success("Nhận đơn thành công", driverService.acceptOrder(driverId, orderId)));
    }

    @PostMapping("/{driverId}/orders/{orderId}/reject")
    @Operation(summary = "Từ chối đơn hàng")
    public ResponseEntity<ApiResponse<Void>> rejectOrder(
            @PathVariable Long driverId, @PathVariable Long orderId) {
        driverService.rejectOrder(driverId, orderId);
        return ResponseEntity.ok(ApiResponse.success("Đã từ chối đơn hàng"));
    }

    @PutMapping("/{driverId}/orders/{orderId}/complete")
    @Operation(summary = "Hoàn thành giao hàng")
    public ResponseEntity<ApiResponse<OrderResponse>> completeDelivery(
            @PathVariable Long driverId, @PathVariable Long orderId) {
        return ResponseEntity.ok(ApiResponse.success("Giao hàng thành công", driverService.completeDelivery(driverId, orderId)));
    }

    @GetMapping("/{driverId}/orders")
    @Operation(summary = "Lịch sử giao hàng")
    public ResponseEntity<ApiResponse<Page<OrderResponse>>> getDeliveryHistory(
            @PathVariable Long driverId, Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(driverService.getDeliveryHistory(driverId, pageable)));
    }

    @GetMapping("/{driverId}/earnings")
    @Operation(summary = "Thu nhập tài xế")
    public ResponseEntity<ApiResponse<BigDecimal>> getEarnings(@PathVariable Long driverId) {
        return ResponseEntity.ok(ApiResponse.success(driverService.getEarnings(driverId)));
    }
}
