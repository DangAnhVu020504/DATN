package com.speed.delivery.controller;

import com.speed.delivery.dto.response.ApiResponse;
import com.speed.delivery.dto.response.TransactionResponse;
import com.speed.delivery.dto.response.WalletResponse;
import com.speed.delivery.service.WalletService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;

/**
 * Controller quản lý ví tài xế.
 */
@RestController
@RequestMapping("/wallets")
@RequiredArgsConstructor
@Tag(name = "Wallets", description = "API ví tài xế")
public class WalletController {

    private final WalletService walletService;

    @GetMapping("/driver/{driverId}")
    @Operation(summary = "Xem ví tài xế")
    public ResponseEntity<ApiResponse<WalletResponse>> getWallet(@PathVariable Long driverId) {
        return ResponseEntity.ok(ApiResponse.success(walletService.getWallet(driverId)));
    }

    @GetMapping("/driver/{driverId}/transactions")
    @Operation(summary = "Lịch sử giao dịch")
    public ResponseEntity<ApiResponse<Page<TransactionResponse>>> getTransactions(
            @PathVariable Long driverId, Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(walletService.getTransactions(driverId, pageable)));
    }

    @PostMapping("/driver/{driverId}/withdraw")
    @Operation(summary = "Rút tiền")
    public ResponseEntity<ApiResponse<WalletResponse>> withdraw(
            @PathVariable Long driverId, @RequestParam BigDecimal amount) {
        return ResponseEntity.ok(ApiResponse.success("Rút tiền thành công", walletService.withdraw(driverId, amount)));
    }
}
