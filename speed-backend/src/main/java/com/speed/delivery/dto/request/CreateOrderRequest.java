package com.speed.delivery.dto.request;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * DTO tạo đơn hàng mới.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateOrderRequest {

    @NotBlank(message = "Địa chỉ lấy hàng không được để trống")
    private String pickupAddress;

    @NotBlank(message = "Tên người gửi không được để trống")
    private String pickupContactName;

    @NotBlank(message = "SĐT người gửi không được để trống")
    private String pickupContactPhone;

    private Double pickupLatitude;
    private Double pickupLongitude;

    @NotBlank(message = "Địa chỉ giao hàng không được để trống")
    private String deliveryAddress;

    @NotBlank(message = "Tên người nhận không được để trống")
    private String deliveryContactName;

    @NotBlank(message = "SĐT người nhận không được để trống")
    private String deliveryContactPhone;

    private Double deliveryLatitude;
    private Double deliveryLongitude;

    private String packageDescription;

    @DecimalMin(value = "0.0", message = "Khối lượng không hợp lệ")
    private BigDecimal packageWeight;

    private String packageNote;

    @NotBlank(message = "Loại giao hàng không được để trống")
    private String deliveryType;

    private LocalDateTime scheduledTime;

    private String paymentMethod;
    private String voucherCode;
}
