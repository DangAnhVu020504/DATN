package com.speed.delivery.service.impl;

import com.speed.delivery.dto.request.CreateOrderRequest;
import com.speed.delivery.dto.response.OrderResponse;
import com.speed.delivery.entity.*;
import com.speed.delivery.enums.*;
import com.speed.delivery.exception.*;
import com.speed.delivery.repository.*;
import com.speed.delivery.service.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * OrderService implementation - Trung tâm nghiệp vụ hệ thống.
 *
 * <p>Phụ thuộc nhiều service khác → lý tưởng cho Mocking:</p>
 * <ul>
 *   <li>OrderRepository, CustomerRepository, DriverRepository</li>
 *   <li>PaymentService, PricingService, NotificationService</li>
 *   <li>VoucherService, DistanceService, AuditLogService</li>
 *   <li>OrderHistoryRepository</li>
 * </ul>
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class OrderServiceImpl implements OrderService {

    private final OrderRepository orderRepository;
    private final CustomerRepository customerRepository;
    private final DriverRepository driverRepository;
    private final OrderHistoryRepository orderHistoryRepository;
    private final PaymentService paymentService;
    private final PricingService pricingService;
    private final NotificationService notificationService;
    private final VoucherService voucherService;
    private final DistanceService distanceService;
    private final AuditLogService auditLogService;

    @Override
    @Transactional
    public OrderResponse createOrder(String customerEmail, CreateOrderRequest request) {
        log.info("Creating order for customer: {}", customerEmail);

        // Tìm customer
        Customer customer = customerRepository.findAll().stream()
                .filter(c -> c.getUser().getEmail().equals(customerEmail))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Customer", "email", customerEmail));

        // Tính khoảng cách
        double distance = 0;
        if (request.getPickupLatitude() != null && request.getDeliveryLatitude() != null) {
            distance = distanceService.calculateDistance(
                    request.getPickupLatitude(), request.getPickupLongitude(),
                    request.getDeliveryLatitude(), request.getDeliveryLongitude());
        }

        // Tính giá
        BigDecimal weight = request.getPackageWeight() != null ? request.getPackageWeight() : BigDecimal.ZERO;
        BigDecimal totalPrice = pricingService.calculateDeliveryPrice(distance, weight);
        BigDecimal basePrice = pricingService.calculateBasePrice();
        BigDecimal distancePrice = pricingService.calculateDistancePrice(distance);
        BigDecimal weightSurcharge = pricingService.calculateWeightSurcharge(weight);
        BigDecimal discountAmount = BigDecimal.ZERO;

        // Áp dụng voucher
        Voucher voucher = null;
        if (request.getVoucherCode() != null && !request.getVoucherCode().isEmpty()) {
            voucher = voucherService.validateVoucher(request.getVoucherCode(), totalPrice);
            discountAmount = voucherService.applyVoucher(voucher, totalPrice);
            totalPrice = totalPrice.subtract(discountAmount);
            if (totalPrice.compareTo(BigDecimal.ZERO) < 0) {
                totalPrice = BigDecimal.ZERO;
            }
        }

        BigDecimal driverEarning = pricingService.calculateDriverEarnings(totalPrice);

        // Tạo đơn hàng
        Order order = Order.builder()
                .orderCode(generateOrderCode())
                .customer(customer)
                .voucher(voucher)
                .pickupAddress(request.getPickupAddress())
                .pickupContactName(request.getPickupContactName())
                .pickupContactPhone(request.getPickupContactPhone())
                .pickupLatitude(request.getPickupLatitude())
                .pickupLongitude(request.getPickupLongitude())
                .deliveryAddress(request.getDeliveryAddress())
                .deliveryContactName(request.getDeliveryContactName())
                .deliveryContactPhone(request.getDeliveryContactPhone())
                .deliveryLatitude(request.getDeliveryLatitude())
                .deliveryLongitude(request.getDeliveryLongitude())
                .packageDescription(request.getPackageDescription())
                .packageWeight(weight)
                .packageNote(request.getPackageNote())
                .distanceKm(BigDecimal.valueOf(distance))
                .basePrice(basePrice)
                .distancePrice(distancePrice)
                .weightSurcharge(weightSurcharge)
                .discountAmount(discountAmount)
                .totalPrice(totalPrice)
                .driverEarning(driverEarning)
                .status(OrderStatus.PENDING)
                .deliveryType(DeliveryType.valueOf(request.getDeliveryType().toUpperCase()))
                .scheduledTime(request.getScheduledTime())
                .build();

        order = orderRepository.save(order);

        // Ghi lịch sử
        saveOrderHistory(order, OrderStatus.PENDING, "Đơn hàng được tạo", customer.getUser().getId());

        // Xử lý thanh toán
        PaymentMethod paymentMethod = request.getPaymentMethod() != null
                ? PaymentMethod.valueOf(request.getPaymentMethod().toUpperCase())
                : PaymentMethod.CASH;
        paymentService.processPayment(order.getId(), totalPrice, paymentMethod);

        // Gửi thông báo
        notificationService.sendOrderNotification(
                customer.getUser().getId(), order.getId(),
                "Đặt hàng thành công", "Đơn hàng " + order.getOrderCode() + " đã được tạo");

        // Cập nhật thống kê customer
        customer.setTotalOrders(customer.getTotalOrders() + 1);
        customer.setTotalSpent(customer.getTotalSpent().add(totalPrice));
        customerRepository.save(customer);

        // Audit log
        auditLogService.log(customer.getUser().getId(), "CREATE_ORDER", "Order", order.getId(),
                "Order created: " + order.getOrderCode());

        log.info("Order created: {}", order.getOrderCode());
        return mapToResponse(order);
    }

    @Override
    @Transactional(readOnly = true)
    public OrderResponse getOrderById(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", orderId));
        return mapToResponse(order);
    }

    @Override
    @Transactional(readOnly = true)
    public OrderResponse getOrderByCode(String orderCode) {
        Order order = orderRepository.findByOrderCode(orderCode)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "orderCode", orderCode));
        return mapToResponse(order);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<OrderResponse> getCustomerOrders(Long customerId, Pageable pageable) {
        return orderRepository.findByCustomerIdOrderByCreatedAtDesc(customerId, pageable)
                .map(this::mapToResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<OrderResponse> getDriverOrders(Long driverId, Pageable pageable) {
        return orderRepository.findByDriverIdOrderByCreatedAtDesc(driverId, pageable)
                .map(this::mapToResponse);
    }

    @Override
    @Transactional
    public OrderResponse assignDriver(Long orderId, Long driverId) {
        log.info("Assigning driver {} to order {}", driverId, orderId);

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", orderId));

        if (order.getStatus() != OrderStatus.PENDING && order.getStatus() != OrderStatus.CONFIRMED) {
            throw new BadRequestException("Không thể gán tài xế cho đơn hàng ở trạng thái: " + order.getStatus());
        }

        Driver driver = driverRepository.findById(driverId)
                .orElseThrow(() -> new ResourceNotFoundException("Driver", "id", driverId));

        if (!driver.getIsAvailable()) {
            throw new BadRequestException("Tài xế hiện không khả dụng");
        }

        order.setDriver(driver);
        order.setStatus(OrderStatus.ASSIGNED);
        order.setAcceptedAt(LocalDateTime.now());
        order = orderRepository.save(order);

        // Cập nhật trạng thái driver
        driver.setStatus(DriverStatus.BUSY);
        driver.setIsAvailable(false);
        driverRepository.save(driver);

        saveOrderHistory(order, OrderStatus.ASSIGNED, "Tài xế đã được gán", null);

        // Thông báo
        notificationService.sendOrderNotification(
                order.getCustomer().getUser().getId(), order.getId(),
                "Tài xế đã nhận đơn", "Tài xế " + driver.getUser().getFullName() + " đang đến lấy hàng");

        notificationService.sendOrderNotification(
                driver.getUser().getId(), order.getId(),
                "Đơn hàng mới", "Bạn đã nhận đơn hàng " + order.getOrderCode());

        auditLogService.log(driver.getUser().getId(), "ASSIGN_DRIVER", "Order", order.getId(),
                "Driver assigned to order");

        return mapToResponse(order);
    }

    @Override
    @Transactional
    public OrderResponse updateOrderStatus(Long orderId, String status, Long changedBy) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", orderId));

        OrderStatus newStatus = OrderStatus.valueOf(status.toUpperCase());
        validateStatusTransition(order.getStatus(), newStatus);

        order.setStatus(newStatus);

        if (newStatus == OrderStatus.PICKING_UP) {
            order.setPickedUpAt(LocalDateTime.now());
        } else if (newStatus == OrderStatus.DELIVERED) {
            order.setDeliveredAt(LocalDateTime.now());
            // Cập nhật driver stats
            if (order.getDriver() != null) {
                Driver driver = order.getDriver();
                driver.setTotalDeliveries(driver.getTotalDeliveries() + 1);
                driver.setTotalEarnings(driver.getTotalEarnings().add(order.getDriverEarning()));
                driver.setStatus(DriverStatus.ONLINE);
                driver.setIsAvailable(true);
                driverRepository.save(driver);
            }
        }

        order = orderRepository.save(order);
        saveOrderHistory(order, newStatus, "Trạng thái cập nhật: " + newStatus, changedBy);

        auditLogService.log(changedBy, "UPDATE_ORDER_STATUS", "Order", orderId,
                "Status changed to: " + newStatus);

        return mapToResponse(order);
    }

    @Override
    @Transactional
    public OrderResponse cancelOrder(Long orderId, String reason, Long cancelledBy) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", orderId));

        if (order.getStatus() == OrderStatus.DELIVERED || order.getStatus() == OrderStatus.CANCELLED) {
            throw new BadRequestException("Không thể hủy đơn hàng ở trạng thái: " + order.getStatus());
        }

        order.setStatus(OrderStatus.CANCELLED);
        order.setCancelledAt(LocalDateTime.now());
        order = orderRepository.save(order);

        // Free up driver
        if (order.getDriver() != null) {
            Driver driver = order.getDriver();
            driver.setStatus(DriverStatus.ONLINE);
            driver.setIsAvailable(true);
            driverRepository.save(driver);
        }

        // Refund
        paymentService.refundPayment(orderId);

        saveOrderHistory(order, OrderStatus.CANCELLED, reason, cancelledBy);

        notificationService.sendOrderNotification(
                order.getCustomer().getUser().getId(), order.getId(),
                "Đơn hàng đã bị hủy", "Đơn hàng " + order.getOrderCode() + " đã bị hủy. Lý do: " + reason);

        auditLogService.log(cancelledBy, "CANCEL_ORDER", "Order", orderId, "Reason: " + reason);

        return mapToResponse(order);
    }

    // ===== Private Helpers =====

    private String generateOrderCode() {
        return "SPD" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }

    private void saveOrderHistory(Order order, OrderStatus status, String note, Long changedBy) {
        OrderHistory history = OrderHistory.builder()
                .order(order)
                .status(status)
                .note(note)
                .changedBy(changedBy)
                .build();
        orderHistoryRepository.save(history);
    }

    private void validateStatusTransition(OrderStatus current, OrderStatus next) {
        boolean valid = switch (current) {
            case PENDING -> next == OrderStatus.CONFIRMED || next == OrderStatus.CANCELLED;
            case CONFIRMED -> next == OrderStatus.ASSIGNED || next == OrderStatus.CANCELLED;
            case ASSIGNED -> next == OrderStatus.PICKING_UP || next == OrderStatus.CANCELLED;
            case PICKING_UP -> next == OrderStatus.IN_TRANSIT;
            case IN_TRANSIT -> next == OrderStatus.DELIVERED;
            case DELIVERED, CANCELLED -> false;
        };
        if (!valid) {
            throw new BadRequestException(
                    String.format("Không thể chuyển trạng thái từ %s sang %s", current, next));
        }
    }

    private OrderResponse mapToResponse(Order order) {
        OrderResponse.OrderResponseBuilder builder = OrderResponse.builder()
                .id(order.getId())
                .orderCode(order.getOrderCode())
                .customerId(order.getCustomer().getId())
                .customerName(order.getCustomer().getUser().getFullName())
                .pickupAddress(order.getPickupAddress())
                .pickupContactName(order.getPickupContactName())
                .pickupContactPhone(order.getPickupContactPhone())
                .deliveryAddress(order.getDeliveryAddress())
                .deliveryContactName(order.getDeliveryContactName())
                .deliveryContactPhone(order.getDeliveryContactPhone())
                .packageDescription(order.getPackageDescription())
                .packageWeight(order.getPackageWeight())
                .packageNote(order.getPackageNote())
                .distanceKm(order.getDistanceKm())
                .basePrice(order.getBasePrice())
                .distancePrice(order.getDistancePrice())
                .weightSurcharge(order.getWeightSurcharge())
                .discountAmount(order.getDiscountAmount())
                .totalPrice(order.getTotalPrice())
                .status(order.getStatus().name())
                .deliveryType(order.getDeliveryType().name())
                .scheduledTime(order.getScheduledTime())
                .createdAt(order.getCreatedAt())
                .acceptedAt(order.getAcceptedAt())
                .deliveredAt(order.getDeliveredAt());

        if (order.getDriver() != null) {
            builder.driverId(order.getDriver().getId())
                    .driverName(order.getDriver().getUser().getFullName())
                    .driverPhone(order.getDriver().getUser().getPhone());
        }

        return builder.build();
    }
}
