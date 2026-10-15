-- ============================================
-- SPEED DELIVERY - Database Initialization
-- ============================================
-- Hệ thống giao hàng nhanh Speed
-- Version: 1.0.0
-- ============================================

-- Tạo Database
CREATE DATABASE IF NOT EXISTS speed_delivery
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE speed_delivery;

-- ============================================
-- 1. BẢNG ROLES
-- ============================================
CREATE TABLE roles (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(50)  NOT NULL UNIQUE,
    description VARCHAR(255),
    created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 2. BẢNG USERS
-- ============================================
CREATE TABLE users (
    id           BIGINT AUTO_INCREMENT PRIMARY KEY,
    email        VARCHAR(255) NOT NULL UNIQUE,
    password     VARCHAR(255) NOT NULL,
    full_name    VARCHAR(100) NOT NULL,
    phone        VARCHAR(20)  UNIQUE,
    avatar_url   VARCHAR(500),
    is_active    BOOLEAN      NOT NULL DEFAULT TRUE,
    is_verified  BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_users_email (email),
    INDEX idx_users_phone (phone)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 3. BẢNG USER_ROLES (Many-to-Many)
-- ============================================
CREATE TABLE user_roles (
    user_id BIGINT NOT NULL,
    role_id BIGINT NOT NULL,
    PRIMARY KEY (user_id, role_id),
    CONSTRAINT fk_user_roles_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_user_roles_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 4. BẢNG CUSTOMERS
-- ============================================
CREATE TABLE customers (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id         BIGINT       NOT NULL UNIQUE,
    loyalty_points  INT          NOT NULL DEFAULT 0,
    total_orders    INT          NOT NULL DEFAULT 0,
    total_spent     DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_customers_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 5. BẢNG DRIVERS
-- ============================================
CREATE TABLE drivers (
    id                  BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id             BIGINT       NOT NULL UNIQUE,
    license_plate       VARCHAR(20),
    vehicle_type        VARCHAR(50)  DEFAULT 'MOTORBIKE',
    status              VARCHAR(20)  NOT NULL DEFAULT 'OFFLINE',
    is_available        BOOLEAN      NOT NULL DEFAULT FALSE,
    current_latitude    DOUBLE,
    current_longitude   DOUBLE,
    rating              DECIMAL(3,2) NOT NULL DEFAULT 5.00,
    total_deliveries    INT          NOT NULL DEFAULT 0,
    total_earnings      DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    created_at          DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_drivers_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_drivers_status (status),
    INDEX idx_drivers_available (is_available)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 6. BẢNG ADDRESSES
-- ============================================
CREATE TABLE addresses (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    customer_id     BIGINT       NOT NULL,
    label           VARCHAR(50),
    contact_name    VARCHAR(100) NOT NULL,
    contact_phone   VARCHAR(20)  NOT NULL,
    address_line    VARCHAR(500) NOT NULL,
    ward            VARCHAR(100),
    district        VARCHAR(100),
    city            VARCHAR(100),
    latitude        DOUBLE,
    longitude       DOUBLE,
    is_default      BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_addresses_customer FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    INDEX idx_addresses_customer (customer_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 7. BẢNG VOUCHERS
-- ============================================
CREATE TABLE vouchers (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    code            VARCHAR(50)  NOT NULL UNIQUE,
    description     VARCHAR(255),
    discount_type   VARCHAR(20)  NOT NULL DEFAULT 'PERCENTAGE',
    discount_value  DECIMAL(10,2) NOT NULL,
    max_discount    DECIMAL(10,2),
    min_order_value DECIMAL(10,2) DEFAULT 0.00,
    usage_limit     INT          DEFAULT 100,
    used_count      INT          NOT NULL DEFAULT 0,
    start_date      DATETIME     NOT NULL,
    end_date        DATETIME     NOT NULL,
    is_active       BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_vouchers_code (code),
    INDEX idx_vouchers_active (is_active, start_date, end_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 8. BẢNG ORDERS
-- ============================================
CREATE TABLE orders (
    id                  BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_code          VARCHAR(20)   NOT NULL UNIQUE,
    customer_id         BIGINT        NOT NULL,
    driver_id           BIGINT,
    voucher_id          BIGINT,

    -- Pickup info
    pickup_address      VARCHAR(500)  NOT NULL,
    pickup_contact_name VARCHAR(100)  NOT NULL,
    pickup_contact_phone VARCHAR(20)  NOT NULL,
    pickup_latitude     DOUBLE,
    pickup_longitude    DOUBLE,

    -- Delivery info
    delivery_address      VARCHAR(500)  NOT NULL,
    delivery_contact_name VARCHAR(100)  NOT NULL,
    delivery_contact_phone VARCHAR(20) NOT NULL,
    delivery_latitude     DOUBLE,
    delivery_longitude    DOUBLE,

    -- Package info
    package_description VARCHAR(500),
    package_weight      DECIMAL(10,2),
    package_note        VARCHAR(500),

    -- Pricing
    distance_km         DECIMAL(10,2),
    base_price          DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    distance_price      DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    weight_surcharge    DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    discount_amount     DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    total_price         DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    driver_earning      DECIMAL(10,2) NOT NULL DEFAULT 0.00,

    -- Status
    status              VARCHAR(30)   NOT NULL DEFAULT 'PENDING',
    delivery_type       VARCHAR(20)   NOT NULL DEFAULT 'INSTANT',
    scheduled_time      DATETIME,

    -- Timestamps
    created_at          DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    accepted_at         DATETIME,
    picked_up_at        DATETIME,
    delivered_at        DATETIME,
    cancelled_at        DATETIME,
    updated_at          DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_orders_customer FOREIGN KEY (customer_id) REFERENCES customers(id),
    CONSTRAINT fk_orders_driver FOREIGN KEY (driver_id) REFERENCES drivers(id),
    CONSTRAINT fk_orders_voucher FOREIGN KEY (voucher_id) REFERENCES vouchers(id),
    INDEX idx_orders_customer (customer_id),
    INDEX idx_orders_driver (driver_id),
    INDEX idx_orders_status (status),
    INDEX idx_orders_code (order_code),
    INDEX idx_orders_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 9. BẢNG ORDER_HISTORY
-- ============================================
CREATE TABLE order_history (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_id    BIGINT       NOT NULL,
    status      VARCHAR(30)  NOT NULL,
    note        VARCHAR(500),
    changed_by  BIGINT,
    created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_order_history_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    INDEX idx_order_history_order (order_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 10. BẢNG PAYMENTS
-- ============================================
CREATE TABLE payments (
    id                  BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_id            BIGINT        NOT NULL UNIQUE,
    payment_method      VARCHAR(30)   NOT NULL DEFAULT 'CASH',
    payment_status      VARCHAR(30)   NOT NULL DEFAULT 'PENDING',
    amount              DECIMAL(10,2) NOT NULL,
    transaction_id      VARCHAR(100),
    paid_at             DATETIME,
    created_at          DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_payments_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 11. BẢNG REVIEWS
-- ============================================
CREATE TABLE reviews (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_id    BIGINT       NOT NULL UNIQUE,
    customer_id BIGINT       NOT NULL,
    driver_id   BIGINT       NOT NULL,
    rating      INT          NOT NULL,
    comment     VARCHAR(1000),
    created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_reviews_order FOREIGN KEY (order_id) REFERENCES orders(id),
    CONSTRAINT fk_reviews_customer FOREIGN KEY (customer_id) REFERENCES customers(id),
    CONSTRAINT fk_reviews_driver FOREIGN KEY (driver_id) REFERENCES drivers(id),
    CONSTRAINT chk_rating CHECK (rating >= 1 AND rating <= 5),
    INDEX idx_reviews_driver (driver_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 12. BẢNG NOTIFICATIONS
-- ============================================
CREATE TABLE notifications (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id     BIGINT       NOT NULL,
    title       VARCHAR(255) NOT NULL,
    message     VARCHAR(1000) NOT NULL,
    type        VARCHAR(30)  NOT NULL DEFAULT 'SYSTEM',
    is_read     BOOLEAN      NOT NULL DEFAULT FALSE,
    reference_id BIGINT,
    created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_notifications_user (user_id),
    INDEX idx_notifications_read (user_id, is_read)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 13. BẢNG OTP_CODES
-- ============================================
CREATE TABLE otp_codes (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id     BIGINT       NOT NULL,
    code        VARCHAR(10)  NOT NULL,
    purpose     VARCHAR(30)  NOT NULL DEFAULT 'PASSWORD_RESET',
    is_used     BOOLEAN      NOT NULL DEFAULT FALSE,
    expires_at  DATETIME     NOT NULL,
    created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_otp_codes_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_otp_user (user_id, purpose)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 14. BẢNG REFRESH_TOKENS
-- ============================================
CREATE TABLE refresh_tokens (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id     BIGINT       NOT NULL,
    token       VARCHAR(500) NOT NULL UNIQUE,
    expires_at  DATETIME     NOT NULL,
    is_revoked  BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_refresh_tokens_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_refresh_token (token),
    INDEX idx_refresh_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 15. BẢNG WALLETS
-- ============================================
CREATE TABLE wallets (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    driver_id   BIGINT        NOT NULL UNIQUE,
    balance     DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_wallets_driver FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 16. BẢNG TRANSACTIONS
-- ============================================
CREATE TABLE transactions (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    wallet_id       BIGINT        NOT NULL,
    order_id        BIGINT,
    type            VARCHAR(30)   NOT NULL,
    amount          DECIMAL(15,2) NOT NULL,
    balance_after   DECIMAL(15,2) NOT NULL,
    description     VARCHAR(255),
    created_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_transactions_wallet FOREIGN KEY (wallet_id) REFERENCES wallets(id),
    CONSTRAINT fk_transactions_order FOREIGN KEY (order_id) REFERENCES orders(id),
    INDEX idx_transactions_wallet (wallet_id),
    INDEX idx_transactions_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 17. BẢNG LOGS (Audit Log)
-- ============================================
CREATE TABLE logs (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id     BIGINT,
    action      VARCHAR(100)  NOT NULL,
    entity_type VARCHAR(50),
    entity_id   BIGINT,
    details     TEXT,
    ip_address  VARCHAR(50),
    created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_logs_user (user_id),
    INDEX idx_logs_action (action),
    INDEX idx_logs_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- DỮ LIỆU KHỞI TẠO
-- ============================================

-- Roles
INSERT INTO roles (name, description) VALUES
    ('ROLE_ADMIN', 'Quản trị viên hệ thống'),
    ('ROLE_CUSTOMER', 'Khách hàng'),
    ('ROLE_DRIVER', 'Tài xế giao hàng');

-- Admin account (password: Admin@123 - BCrypt encoded)
INSERT INTO users (email, password, full_name, phone, is_active, is_verified) VALUES
    ('admin@speed.vn', '$2a$10$SqXaua9XFkul8yOAlVP9QeJBFczVHmtg/mYsk0YhxloatJHQfvxL6', 'Admin Speed', '0900000000', TRUE, TRUE);

INSERT INTO user_roles (user_id, role_id) VALUES
    (1, 1);

-- Sample Vouchers
INSERT INTO vouchers (code, description, discount_type, discount_value, max_discount, min_order_value, usage_limit, start_date, end_date) VALUES
    ('WELCOME10', 'Giảm 10% cho đơn đầu tiên', 'PERCENTAGE', 10.00, 30000.00, 10000.00, 1000, '2024-01-01 00:00:00', '2025-12-31 23:59:59'),
    ('SPEED20K', 'Giảm 20.000đ cho đơn từ 50.000đ', 'FIXED', 20000.00, NULL, 50000.00, 500, '2024-01-01 00:00:00', '2025-12-31 23:59:59'),
    ('FREESHIP', 'Miễn phí giao hàng', 'FIXED', 50000.00, NULL, 0.00, 200, '2024-06-01 00:00:00', '2025-06-30 23:59:59');
