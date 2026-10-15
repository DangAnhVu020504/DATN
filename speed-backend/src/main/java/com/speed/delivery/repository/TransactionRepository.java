package com.speed.delivery.repository;

import com.speed.delivery.entity.Transaction;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, Long> {
    Page<Transaction> findByWalletIdOrderByCreatedAtDesc(Long walletId, Pageable pageable);
}
