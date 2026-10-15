package com.speed.delivery.repository;

import com.speed.delivery.entity.Log;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface LogRepository extends JpaRepository<Log, Long> {
    Page<Log> findAllByOrderByCreatedAtDesc(Pageable pageable);
    Page<Log> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);
}
