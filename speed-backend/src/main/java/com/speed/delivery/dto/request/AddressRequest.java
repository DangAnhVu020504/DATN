package com.speed.delivery.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AddressRequest {

    private String label;

    @NotBlank(message = "Tên liên hệ không được để trống")
    private String contactName;

    @NotBlank(message = "SĐT liên hệ không được để trống")
    private String contactPhone;

    @NotBlank(message = "Địa chỉ không được để trống")
    private String addressLine;

    private String ward;
    private String district;
    private String city;
    private Double latitude;
    private Double longitude;
    private Boolean isDefault;
}
