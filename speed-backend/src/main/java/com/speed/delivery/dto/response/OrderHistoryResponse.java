package com.speed.delivery.dto.response;

import lombok.*;

/**
 * DTO trả về lịch sử thay đổi trạng thái đơn hàng (OrderHistory).
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderHistoryResponse {
    private Long id;
    private String status;
    private String note;
    private Long changedBy;
    private String createdAt;
}
