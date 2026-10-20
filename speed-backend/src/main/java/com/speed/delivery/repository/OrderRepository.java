package com.speed.delivery.repository;

import com.speed.delivery.entity.Order;
import com.speed.delivery.enums.OrderStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    Optional<Order> findByOrderCode(String orderCode);
    Page<Order> findByCustomerIdOrderByCreatedAtDesc(Long customerId, Pageable pageable);
    Page<Order> findByDriverIdOrderByCreatedAtDesc(Long driverId, Pageable pageable);
    Page<Order> findByStatus(OrderStatus status, Pageable pageable);
    List<Order> findByStatus(OrderStatus status);
    long countByStatus(OrderStatus status);

    @Query("SELECT COUNT(o) FROM Order o WHERE o.createdAt >= :startDate")
    long countOrdersAfter(@Param("startDate") LocalDateTime startDate);

    @Query("SELECT COALESCE(SUM(o.totalPrice), 0) FROM Order o WHERE o.status = 'DELIVERED' AND o.createdAt >= :startDate")
    java.math.BigDecimal calculateRevenueAfter(@Param("startDate") LocalDateTime startDate);
}
