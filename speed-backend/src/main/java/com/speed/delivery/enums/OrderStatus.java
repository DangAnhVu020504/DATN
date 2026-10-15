package com.speed.delivery.enums;

/**
 * Trạng thái đơn hàng theo luồng xử lý.
 */
public enum OrderStatus {
    PENDING,
    CONFIRMED,
    ASSIGNED,
    PICKING_UP,
    IN_TRANSIT,
    DELIVERED,
    CANCELLED
}
