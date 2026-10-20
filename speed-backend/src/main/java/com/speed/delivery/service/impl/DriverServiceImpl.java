package com.speed.delivery.service.impl;

import com.speed.delivery.dto.response.DriverResponse;
import com.speed.delivery.dto.response.OrderResponse;
import com.speed.delivery.entity.Driver;
import com.speed.delivery.entity.Order;
import com.speed.delivery.enums.DriverStatus;
import com.speed.delivery.enums.OrderStatus;
import com.speed.delivery.exception.BadRequestException;
import com.speed.delivery.exception.ResourceNotFoundException;
import com.speed.delivery.repository.DriverRepository;
import com.speed.delivery.repository.OrderRepository;
import com.speed.delivery.service.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

/**
 * DriverService implementation.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class DriverServiceImpl implements DriverService {

    private final DriverRepository driverRepository;
    private final OrderRepository orderRepository;
    private final OrderService orderService;
    private final NotificationService notificationService;
    private final AuditLogService auditLogService;

    @Override
    @Transactional
    public void toggleAvailability(Long driverId, boolean available) {
        Driver driver = driverRepository.findById(driverId)
                .orElseThrow(() -> new ResourceNotFoundException("Driver", "id", driverId));

        driver.setIsAvailable(available);
        driver.setStatus(available ? DriverStatus.ONLINE : DriverStatus.OFFLINE);
        driverRepository.save(driver);

        auditLogService.log(driver.getUser().getId(), "TOGGLE_AVAILABILITY", "Driver", driverId,
                "Availability: " + available);
        log.info("Driver {} availability set to {}", driverId, available);
    }

    @Override
    @Transactional
    public OrderResponse acceptOrder(Long driverId, Long orderId) {
        Driver driver = driverRepository.findById(driverId)
                .orElseThrow(() -> new ResourceNotFoundException("Driver", "id", driverId));

        if (!driver.getIsAvailable()) {
            throw new BadRequestException("Tài xế hiện không khả dụng");
        }

        return orderService.assignDriver(orderId, driverId);
    }

    @Override
    @Transactional
    public void rejectOrder(Long driverId, Long orderId) {
        Driver driver = driverRepository.findById(driverId)
                .orElseThrow(() -> new ResourceNotFoundException("Driver", "id", driverId));

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", orderId));

        auditLogService.log(driver.getUser().getId(), "REJECT_ORDER", "Order", orderId,
                "Driver rejected order");

        notificationService.sendOrderNotification(
                order.getCustomer().getUser().getId(), orderId,
                "Tài xế từ chối", "Đang tìm tài xế khác cho đơn hàng " + order.getOrderCode());

        log.info("Driver {} rejected order {}", driverId, orderId);
    }

    @Override
    @Transactional
    public OrderResponse completeDelivery(Long driverId, Long orderId) {
        Driver driver = driverRepository.findById(driverId)
                .orElseThrow(() -> new ResourceNotFoundException("Driver", "id", driverId));

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", orderId));

        if (order.getDriver() == null || !order.getDriver().getId().equals(driverId)) {
            throw new BadRequestException("Đơn hàng không thuộc về tài xế này");
        }

        if (order.getStatus() != OrderStatus.IN_TRANSIT) {
            throw new BadRequestException("Đơn hàng chưa đang giao để hoàn thành");
        }

        return orderService.updateOrderStatus(orderId, "DELIVERED", driver.getUser().getId());
    }

    @Override
    @Transactional(readOnly = true)
    public Page<OrderResponse> getDeliveryHistory(Long driverId, Pageable pageable) {
        driverRepository.findById(driverId)
                .orElseThrow(() -> new ResourceNotFoundException("Driver", "id", driverId));
        return orderService.getDriverOrders(driverId, pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public List<OrderResponse> getAvailableOrders(Long driverId) {
        // Xác thực driver tồn tại rồi delegate sang OrderService lấy đơn PENDING/CONFIRMED
        driverRepository.findById(driverId)
                .orElseThrow(() -> new ResourceNotFoundException("Driver", "id", driverId));
        return orderService.getAvailableOrders();
    }

    @Override
    @Transactional(readOnly = true)
    public BigDecimal getEarnings(Long driverId) {
        Driver driver = driverRepository.findById(driverId)
                .orElseThrow(() -> new ResourceNotFoundException("Driver", "id", driverId));
        return driver.getTotalEarnings();
    }

    @Override
    @Transactional(readOnly = true)
    public DriverResponse getDriverProfile(Long driverId) {
        Driver driver = driverRepository.findById(driverId)
                .orElseThrow(() -> new ResourceNotFoundException("Driver", "id", driverId));

        return DriverResponse.builder()
                .id(driver.getId())
                .userId(driver.getUser().getId())
                .fullName(driver.getUser().getFullName())
                .phone(driver.getUser().getPhone())
                .email(driver.getUser().getEmail())
                .avatarUrl(driver.getUser().getAvatarUrl())
                .licensePlate(driver.getLicensePlate())
                .vehicleType(driver.getVehicleType())
                .status(driver.getStatus().name())
                .isAvailable(driver.getIsAvailable())
                .rating(driver.getRating())
                .totalDeliveries(driver.getTotalDeliveries())
                .totalEarnings(driver.getTotalEarnings())
                .build();
    }
}
