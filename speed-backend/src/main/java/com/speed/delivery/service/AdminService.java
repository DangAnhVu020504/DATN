package com.speed.delivery.service;

import com.speed.delivery.dto.response.DashboardResponse;

public interface AdminService {
    DashboardResponse getDashboardStats();
    org.springframework.data.domain.Page<com.speed.delivery.dto.response.UserResponse> getAllUsers(org.springframework.data.domain.Pageable pageable);
    com.speed.delivery.dto.response.UserResponse getUserById(Long id);
    void toggleUserActive(Long userId, boolean active);
    void deleteUser(Long userId);
}
