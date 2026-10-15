package com.speed.delivery.controller;

import com.speed.delivery.dto.request.AddressRequest;
import com.speed.delivery.dto.response.AddressResponse;
import com.speed.delivery.dto.response.ApiResponse;
import com.speed.delivery.service.CustomerService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/customers")
@RequiredArgsConstructor
@Tag(name = "Customers", description = "API khách hàng")
public class CustomerController {

    private final CustomerService customerService;

    @GetMapping("/{customerId}/addresses")
    @Operation(summary = "Danh sách địa chỉ")
    public ResponseEntity<ApiResponse<List<AddressResponse>>> getAddresses(@PathVariable Long customerId) {
        return ResponseEntity.ok(ApiResponse.success(customerService.getAddresses(customerId)));
    }

    @PostMapping("/{customerId}/addresses")
    @Operation(summary = "Thêm địa chỉ mới")
    public ResponseEntity<ApiResponse<AddressResponse>> addAddress(
            @PathVariable Long customerId, @Valid @RequestBody AddressRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Thêm địa chỉ thành công", customerService.addAddress(customerId, request)));
    }

    @PutMapping("/{customerId}/addresses/{addressId}")
    @Operation(summary = "Cập nhật địa chỉ")
    public ResponseEntity<ApiResponse<AddressResponse>> updateAddress(
            @PathVariable Long customerId, @PathVariable Long addressId,
            @Valid @RequestBody AddressRequest request) {
        return ResponseEntity.ok(ApiResponse.success(customerService.updateAddress(customerId, addressId, request)));
    }

    @DeleteMapping("/{customerId}/addresses/{addressId}")
    @Operation(summary = "Xóa địa chỉ")
    public ResponseEntity<ApiResponse<Void>> deleteAddress(
            @PathVariable Long customerId, @PathVariable Long addressId) {
        customerService.deleteAddress(customerId, addressId);
        return ResponseEntity.ok(ApiResponse.success("Xóa địa chỉ thành công"));
    }
}
