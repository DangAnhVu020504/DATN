package com.speed.delivery;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Speed Delivery Application - Entry point.
 *
 * <p>Hệ thống giao hàng nhanh theo mô hình GrabExpress/Ahamove.
 * Đề tài: "Nghiên cứu và ứng dụng kỹ thuật Mocking trong kiểm thử đơn vị (Unit Testing) phần mềm."</p>
 *
 * @author Speed Team
 * @version 1.0.0
 */
@SpringBootApplication
public class SpeedApplication {

    public static void main(String[] args) {
        SpringApplication.run(SpeedApplication.class, args);
    }
}
