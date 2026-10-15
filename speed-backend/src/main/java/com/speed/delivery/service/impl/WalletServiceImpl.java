package com.speed.delivery.service.impl;

import com.speed.delivery.dto.response.TransactionResponse;
import com.speed.delivery.dto.response.WalletResponse;
import com.speed.delivery.entity.Driver;
import com.speed.delivery.entity.Transaction;
import com.speed.delivery.entity.Wallet;
import com.speed.delivery.enums.TransactionType;
import com.speed.delivery.exception.BadRequestException;
import com.speed.delivery.exception.ResourceNotFoundException;
import com.speed.delivery.repository.DriverRepository;
import com.speed.delivery.repository.TransactionRepository;
import com.speed.delivery.repository.WalletRepository;
import com.speed.delivery.service.WalletService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

/**
 * WalletService implementation - Quản lý ví tài xế.
 *
 * <p>Dependencies (3 — cần Mock trong test):</p>
 * <ul>
 *   <li>WalletRepository — CRUD ví</li>
 *   <li>TransactionRepository — CRUD giao dịch</li>
 *   <li>DriverRepository — Tìm tài xế</li>
 * </ul>
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class WalletServiceImpl implements WalletService {

    private final WalletRepository walletRepository;
    private final TransactionRepository transactionRepository;
    private final DriverRepository driverRepository;

    @Override
    @Transactional(readOnly = true)
    public WalletResponse getWallet(Long driverId) {
        Driver driver = driverRepository.findById(driverId)
                .orElseThrow(() -> new ResourceNotFoundException("Driver", "id", driverId));

        Wallet wallet = walletRepository.findByDriverId(driverId)
                .orElseGet(() -> createWallet(driver));

        return mapWalletResponse(wallet);
    }

    @Override
    @Transactional
    public WalletResponse addEarning(Long driverId, Long orderId, BigDecimal amount) {
        log.info("Adding earning {} to driver {} for order {}", amount, driverId, orderId);

        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BadRequestException("Số tiền phải lớn hơn 0");
        }

        Driver driver = driverRepository.findById(driverId)
                .orElseThrow(() -> new ResourceNotFoundException("Driver", "id", driverId));

        Wallet wallet = walletRepository.findByDriverId(driverId)
                .orElseGet(() -> createWallet(driver));

        wallet.setBalance(wallet.getBalance().add(amount));
        wallet = walletRepository.save(wallet);

        // Tạo giao dịch
        Transaction transaction = Transaction.builder()
                .wallet(wallet)
                .order(com.speed.delivery.entity.Order.builder().id(orderId).build())
                .type(TransactionType.EARNING)
                .amount(amount)
                .balanceAfter(wallet.getBalance())
                .description("Thu nhập đơn hàng #" + orderId)
                .build();
        transactionRepository.save(transaction);

        log.info("Earning added: driver={}, amount={}, newBalance={}", driverId, amount, wallet.getBalance());
        return mapWalletResponse(wallet);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<TransactionResponse> getTransactions(Long driverId, Pageable pageable) {
        Wallet wallet = walletRepository.findByDriverId(driverId)
                .orElseThrow(() -> new ResourceNotFoundException("Wallet", "driverId", driverId));

        return transactionRepository.findByWalletIdOrderByCreatedAtDesc(wallet.getId(), pageable)
                .map(this::mapTransactionResponse);
    }

    @Override
    @Transactional
    public WalletResponse withdraw(Long driverId, BigDecimal amount) {
        log.info("Withdraw {} from driver {}", amount, driverId);

        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BadRequestException("Số tiền rút phải lớn hơn 0");
        }

        Wallet wallet = walletRepository.findByDriverId(driverId)
                .orElseThrow(() -> new ResourceNotFoundException("Wallet", "driverId", driverId));

        if (wallet.getBalance().compareTo(amount) < 0) {
            throw new BadRequestException("Số dư không đủ. Số dư hiện tại: " + wallet.getBalance());
        }

        wallet.setBalance(wallet.getBalance().subtract(amount));
        wallet = walletRepository.save(wallet);

        // Tạo giao dịch rút tiền
        Transaction transaction = Transaction.builder()
                .wallet(wallet)
                .type(TransactionType.WITHDRAWAL)
                .amount(amount)
                .balanceAfter(wallet.getBalance())
                .description("Rút tiền")
                .build();
        transactionRepository.save(transaction);

        log.info("Withdrawal completed: driver={}, amount={}, newBalance={}", driverId, amount, wallet.getBalance());
        return mapWalletResponse(wallet);
    }

    // ===== Private Helpers =====

    private Wallet createWallet(Driver driver) {
        Wallet wallet = Wallet.builder()
                .driver(driver)
                .balance(BigDecimal.ZERO)
                .build();
        return walletRepository.save(wallet);
    }

    private WalletResponse mapWalletResponse(Wallet wallet) {
        return WalletResponse.builder()
                .id(wallet.getId())
                .driverId(wallet.getDriver().getId())
                .driverName(wallet.getDriver().getUser().getFullName())
                .balance(wallet.getBalance())
                .createdAt(wallet.getCreatedAt())
                .updatedAt(wallet.getUpdatedAt())
                .build();
    }

    private TransactionResponse mapTransactionResponse(Transaction tx) {
        return TransactionResponse.builder()
                .id(tx.getId())
                .type(tx.getType().name())
                .amount(tx.getAmount())
                .balanceAfter(tx.getBalanceAfter())
                .description(tx.getDescription())
                .orderId(tx.getOrder() != null ? tx.getOrder().getId() : null)
                .createdAt(tx.getCreatedAt())
                .build();
    }
}
