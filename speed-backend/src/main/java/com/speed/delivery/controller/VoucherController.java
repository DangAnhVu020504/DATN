package com.speed.delivery.controller;

import com.speed.delivery.dto.request.VoucherRequest;
import com.speed.delivery.dto.response.ApiResponse;
import com.speed.delivery.dto.response.VoucherResponse;
import com.speed.delivery.entity.Voucher;
import com.speed.delivery.enums.DiscountType;
import com.speed.delivery.service.VoucherService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Controller quản lý voucher.
 */
@RestController
@RequestMapping("/vouchers")
@RequiredArgsConstructor
@Tag(name = "Vouchers", description = "API mã giảm giá")
public class VoucherController {

    private final VoucherService voucherService;

    @GetMapping("/active")
    @Operation(summary = "Danh sách voucher đang hoạt động")
    public ResponseEntity<ApiResponse<List<VoucherResponse>>> getActiveVouchers() {
        List<VoucherResponse> vouchers = voucherService.getActiveVouchers().stream()
                .map(this::mapResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(vouchers));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Chi tiết voucher")
    public ResponseEntity<ApiResponse<VoucherResponse>> getVoucherById(@PathVariable Long id) {
        Voucher voucher = voucherService.getVoucherById(id);
        return ResponseEntity.ok(ApiResponse.success(mapResponse(voucher)));
    }

    @PostMapping("/validate")
    @Operation(summary = "Validate mã voucher")
    public ResponseEntity<ApiResponse<VoucherResponse>> validateVoucher(
            @RequestParam String code, @RequestParam BigDecimal orderValue) {
        Voucher voucher = voucherService.validateVoucher(code, orderValue);
        return ResponseEntity.ok(ApiResponse.success("Voucher hợp lệ", mapResponse(voucher)));
    }

    @PostMapping
    @Operation(summary = "Tạo voucher mới (Admin)")
    public ResponseEntity<ApiResponse<VoucherResponse>> createVoucher(
            @Valid @RequestBody VoucherRequest request) {
        Voucher voucher = Voucher.builder()
                .code(request.getCode())
                .description(request.getDescription())
                .discountType(DiscountType.valueOf(request.getDiscountType().toUpperCase()))
                .discountValue(request.getDiscountValue())
                .maxDiscount(request.getMaxDiscount())
                .minOrderValue(request.getMinOrderValue() != null ? request.getMinOrderValue() : BigDecimal.ZERO)
                .usageLimit(request.getUsageLimit() != null ? request.getUsageLimit() : 100)
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .build();
        Voucher created = voucherService.createVoucher(voucher);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tạo voucher thành công", mapResponse(created)));
    }

    private VoucherResponse mapResponse(Voucher voucher) {
        return VoucherResponse.builder()
                .id(voucher.getId())
                .code(voucher.getCode())
                .description(voucher.getDescription())
                .discountType(voucher.getDiscountType().name())
                .discountValue(voucher.getDiscountValue())
                .maxDiscount(voucher.getMaxDiscount())
                .minOrderValue(voucher.getMinOrderValue())
                .usageLimit(voucher.getUsageLimit())
                .usedCount(voucher.getUsedCount())
                .startDate(voucher.getStartDate())
                .endDate(voucher.getEndDate())
                .isActive(voucher.getIsActive())
                .build();
    }
}
