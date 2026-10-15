package com.speed.delivery.repository;

import com.speed.delivery.entity.OtpCode;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface OtpCodeRepository extends JpaRepository<OtpCode, Long> {
    Optional<OtpCode> findTopByUserIdAndPurposeAndIsUsedFalseOrderByCreatedAtDesc(Long userId, String purpose);
}
