package com.speed.delivery.repository;

import com.speed.delivery.entity.Review;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {
    Optional<Review> findByOrderId(Long orderId);
    Page<Review> findByDriverIdOrderByCreatedAtDesc(Long driverId, Pageable pageable);
    boolean existsByOrderId(Long orderId);

    @Query("SELECT AVG(r.rating) FROM Review r WHERE r.driver.id = :driverId")
    Double calculateAverageRatingByDriverId(@Param("driverId") Long driverId);
}
