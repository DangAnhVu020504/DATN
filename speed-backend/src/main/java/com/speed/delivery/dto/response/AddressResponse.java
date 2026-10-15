package com.speed.delivery.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AddressResponse {
    private Long id;
    private String label;
    private String contactName;
    private String contactPhone;
    private String addressLine;
    private String ward;
    private String district;
    private String city;
    private Double latitude;
    private Double longitude;
    private Boolean isDefault;
}
