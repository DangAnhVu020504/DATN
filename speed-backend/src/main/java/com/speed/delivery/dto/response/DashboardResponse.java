package com.speed.delivery.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;

/**
 * DTO dữ liệu dashboard cho admin.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardResponse {

    private long totalOrders;
    private long totalCustomers;
    private long totalDrivers;
    private BigDecimal totalRevenue;
    private long pendingOrders;
    private long deliveringOrders;
    private long completedOrders;
    private long cancelledOrders;
}
