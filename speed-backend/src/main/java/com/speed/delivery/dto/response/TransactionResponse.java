package com.speed.delivery.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * DTO response cho Transaction (giao dịch ví tài xế).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TransactionResponse {
    private Long id;
    private String type;
    private BigDecimal amount;
    private BigDecimal balanceAfter;
    private String description;
    private Long orderId;
    private LocalDateTime createdAt;
}
