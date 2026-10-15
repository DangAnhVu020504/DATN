package com.speed.delivery.controller;

import com.speed.delivery.dto.response.ApiResponse;
import com.speed.delivery.dto.response.DashboardResponse;
import com.speed.delivery.dto.response.LogResponse;
import com.speed.delivery.dto.response.UserResponse;
import com.speed.delivery.service.AdminService;
import com.speed.delivery.service.AuditLogService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/admin")
@RequiredArgsConstructor
@Tag(name = "Admin", description = "API quản trị")
public class AdminController {

    private final AdminService adminService;
    private final AuditLogService auditLogService;

    @GetMapping("/dashboard")
    @Operation(summary = "Thống kê dashboard")
    public ResponseEntity<ApiResponse<DashboardResponse>> getDashboard() {
        return ResponseEntity.ok(ApiResponse.success(adminService.getDashboardStats()));
    }

    @GetMapping("/users")
    @Operation(summary = "Danh sách người dùng")
    public ResponseEntity<ApiResponse<Page<UserResponse>>> getUsers(Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(adminService.getAllUsers(pageable)));
    }

    @GetMapping("/users/{id}")
    @Operation(summary = "Chi tiết người dùng")
    public ResponseEntity<ApiResponse<UserResponse>> getUserById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(adminService.getUserById(id)));
    }

    @PutMapping("/users/{id}/toggle-active")
    @Operation(summary = "Kích hoạt/vô hiệu hóa người dùng")
    public ResponseEntity<ApiResponse<Void>> toggleActive(
            @PathVariable Long id, @RequestParam boolean active) {
        adminService.toggleUserActive(id, active);
        return ResponseEntity.ok(ApiResponse.success(active ? "Đã kích hoạt" : "Đã vô hiệu hóa"));
    }

    @DeleteMapping("/users/{id}")
    @Operation(summary = "Xóa người dùng")
    public ResponseEntity<ApiResponse<Void>> deleteUser(@PathVariable Long id) {
        adminService.deleteUser(id);
        return ResponseEntity.ok(ApiResponse.success("Đã xóa người dùng"));
    }

    @GetMapping("/logs")
    @Operation(summary = "Danh sách audit logs")
    public ResponseEntity<ApiResponse<Page<LogResponse>>> getLogs(Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(auditLogService.getAllLogs(pageable)));
    }

    @GetMapping("/logs/user/{userId}")
    @Operation(summary = "Audit logs theo user")
    public ResponseEntity<ApiResponse<Page<LogResponse>>> getUserLogs(
            @PathVariable Long userId, Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(auditLogService.getUserLogs(userId, pageable)));
    }
}

