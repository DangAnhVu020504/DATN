package com.speed.delivery.service.impl;

import com.speed.delivery.dto.response.DashboardResponse;
import com.speed.delivery.dto.response.UserResponse;
import com.speed.delivery.entity.Role;
import com.speed.delivery.entity.User;
import com.speed.delivery.enums.OrderStatus;
import com.speed.delivery.exception.ResourceNotFoundException;
import com.speed.delivery.repository.*;
import com.speed.delivery.service.AdminService;
import com.speed.delivery.service.AuditLogService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.stream.Collectors;

/**
 * AdminService implementation.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AdminServiceImpl implements AdminService {

    private final UserRepository userRepository;
    private final CustomerRepository customerRepository;
    private final DriverRepository driverRepository;
    private final OrderRepository orderRepository;
    private final AuditLogService auditLogService;

    @Override
    @Transactional(readOnly = true)
    public DashboardResponse getDashboardStats() {
        LocalDateTime startOfMonth = LocalDateTime.now().withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0);

        long totalOrders = orderRepository.count();
        long totalCustomers = customerRepository.count();
        long totalDrivers = driverRepository.count();
        BigDecimal totalRevenue = orderRepository.calculateRevenueAfter(startOfMonth);

        long pendingOrders = orderRepository.countByStatus(OrderStatus.PENDING);
        long deliveringOrders = orderRepository.countByStatus(OrderStatus.IN_TRANSIT)
                + orderRepository.countByStatus(OrderStatus.PICKING_UP)
                + orderRepository.countByStatus(OrderStatus.ASSIGNED);
        long completedOrders = orderRepository.countByStatus(OrderStatus.DELIVERED);
        long cancelledOrders = orderRepository.countByStatus(OrderStatus.CANCELLED);

        return DashboardResponse.builder()
                .totalOrders(totalOrders)
                .totalCustomers(totalCustomers)
                .totalDrivers(totalDrivers)
                .totalRevenue(totalRevenue != null ? totalRevenue : BigDecimal.ZERO)
                .pendingOrders(pendingOrders)
                .deliveringOrders(deliveringOrders)
                .completedOrders(completedOrders)
                .cancelledOrders(cancelledOrders)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public Page<UserResponse> getAllUsers(Pageable pageable) {
        return userRepository.findAll(pageable).map(this::mapUserResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public UserResponse getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));
        return mapUserResponse(user);
    }

    @Override
    @Transactional
    public void toggleUserActive(Long userId, boolean active) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        user.setIsActive(active);
        userRepository.save(user);
        auditLogService.log(null, "TOGGLE_USER_ACTIVE", "User", userId,
                "User " + (active ? "activated" : "deactivated"));
    }

    @Override
    @Transactional
    public void deleteUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        userRepository.delete(user);
        auditLogService.log(null, "DELETE_USER", "User", userId, "User deleted: " + user.getEmail());
    }

    private UserResponse mapUserResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .phone(user.getPhone())
                .avatarUrl(user.getAvatarUrl())
                .isActive(user.getIsActive())
                .isVerified(user.getIsVerified())
                .roles(user.getRoles().stream().map(Role::getName).collect(Collectors.toList()))
                .createdAt(user.getCreatedAt() != null ? user.getCreatedAt().toString() : null)
                .build();
    }
}
