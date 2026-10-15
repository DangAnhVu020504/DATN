package com.speed.delivery.entity;

import com.speed.delivery.enums.DeliveryType;
import com.speed.delivery.enums.OrderStatus;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Entity đại diện cho đơn hàng giao hàng.
 * Đây là entity trung tâm của hệ thống, liên kết Customer, Driver, Voucher.
 */
@Entity
@Table(name = "orders")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "order_code", nullable = false, unique = true, length = 20)
    private String orderCode;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "driver_id")
    private Driver driver;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "voucher_id")
    private Voucher voucher;

    // Pickup info
    @Column(name = "pickup_address", nullable = false, length = 500)
    private String pickupAddress;

    @Column(name = "pickup_contact_name", nullable = false, length = 100)
    private String pickupContactName;

    @Column(name = "pickup_contact_phone", nullable = false, length = 20)
    private String pickupContactPhone;

    @Column(name = "pickup_latitude")
    private Double pickupLatitude;

    @Column(name = "pickup_longitude")
    private Double pickupLongitude;

    // Delivery info
    @Column(name = "delivery_address", nullable = false, length = 500)
    private String deliveryAddress;

    @Column(name = "delivery_contact_name", nullable = false, length = 100)
    private String deliveryContactName;

    @Column(name = "delivery_contact_phone", nullable = false, length = 20)
    private String deliveryContactPhone;

    @Column(name = "delivery_latitude")
    private Double deliveryLatitude;

    @Column(name = "delivery_longitude")
    private Double deliveryLongitude;

    // Package info
    @Column(name = "package_description", length = 500)
    private String packageDescription;

    @Column(name = "package_weight")
    private BigDecimal packageWeight;

    @Column(name = "package_note", length = 500)
    private String packageNote;

    // Pricing
    @Column(name = "distance_km")
    private BigDecimal distanceKm;

    @Column(name = "base_price", nullable = false)
    @Builder.Default
    private BigDecimal basePrice = BigDecimal.ZERO;

    @Column(name = "distance_price", nullable = false)
    @Builder.Default
    private BigDecimal distancePrice = BigDecimal.ZERO;

    @Column(name = "weight_surcharge", nullable = false)
    @Builder.Default
    private BigDecimal weightSurcharge = BigDecimal.ZERO;

    @Column(name = "discount_amount", nullable = false)
    @Builder.Default
    private BigDecimal discountAmount = BigDecimal.ZERO;

    @Column(name = "total_price", nullable = false)
    @Builder.Default
    private BigDecimal totalPrice = BigDecimal.ZERO;

    @Column(name = "driver_earning", nullable = false)
    @Builder.Default
    private BigDecimal driverEarning = BigDecimal.ZERO;

    // Status
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    @Builder.Default
    private OrderStatus status = OrderStatus.PENDING;

    @Enumerated(EnumType.STRING)
    @Column(name = "delivery_type", nullable = false, length = 20)
    @Builder.Default
    private DeliveryType deliveryType = DeliveryType.INSTANT;

    @Column(name = "scheduled_time")
    private LocalDateTime scheduledTime;

    // Timestamps
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "accepted_at")
    private LocalDateTime acceptedAt;

    @Column(name = "picked_up_at")
    private LocalDateTime pickedUpAt;

    @Column(name = "delivered_at")
    private LocalDateTime deliveredAt;

    @Column(name = "cancelled_at")
    private LocalDateTime cancelledAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
