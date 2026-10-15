package com.speed.delivery.service;

import com.speed.delivery.dto.response.TransactionResponse;
import com.speed.delivery.dto.response.WalletResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.math.BigDecimal;

/**
 * Service quản lý ví tài xế và giao dịch.
 *
 * <p>Dependencies cần mock trong test:</p>
 * <ul>
 *   <li>WalletRepository</li>
 *   <li>TransactionRepository</li>
 *   <li>DriverRepository</li>
 * </ul>
 */
public interface WalletService {
    WalletResponse getWallet(Long driverId);
    WalletResponse addEarning(Long driverId, Long orderId, BigDecimal amount);
    Page<TransactionResponse> getTransactions(Long driverId, Pageable pageable);
    WalletResponse withdraw(Long driverId, BigDecimal amount);
}
