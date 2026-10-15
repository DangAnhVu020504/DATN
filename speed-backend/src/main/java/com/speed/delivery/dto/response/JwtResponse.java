package com.speed.delivery.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

/**
 * DTO phản hồi JWT sau đăng nhập thành công.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class JwtResponse {

    private String accessToken;
    private String refreshToken;
    private String tokenType;
    private Long userId;
    private Long customerId;
    private Long driverId;
    private String email;
    private String fullName;
    private List<String> roles;
}
