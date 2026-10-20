package com.speed.delivery.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;

/**
 * DTO thông tin tài xế (hồ sơ + thống kê).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DriverResponse {

    private Long id;
    private Long userId;
    private String fullName;
    private String phone;
    private String email;
    private String avatarUrl;
    private String licensePlate;
    private String vehicleType;
    private String status;
    private Boolean isAvailable;
    private BigDecimal rating;
    private Integer totalDeliveries;
    private BigDecimal totalEarnings;
}
