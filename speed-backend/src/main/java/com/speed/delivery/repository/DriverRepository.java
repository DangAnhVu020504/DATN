package com.speed.delivery.repository;

import com.speed.delivery.entity.Driver;
import com.speed.delivery.enums.DriverStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface DriverRepository extends JpaRepository<Driver, Long> {
    Optional<Driver> findByUserId(Long userId);
    List<Driver> findByIsAvailableTrueAndStatus(DriverStatus status);
    List<Driver> findTop10ByOrderByTotalDeliveriesDesc();
}
