# BÁO CÁO CHỨC NĂNG VÀ DEPENDENCY HỆ THỐNG SPEED DELIVERY

> **Đề tài:** Nghiên cứu và ứng dụng kỹ thuật Mocking trong kiểm thử đơn vị (Unit Testing) phần mềm  
> **Hệ thống minh họa:** Speed Delivery — Ứng dụng giao hàng nhanh  
> **Ngày cập nhật:** 30/08/2026

---

## MỤC LỤC

1. [Tổng quan hệ thống](#1-tổng-quan-hệ-thống)
2. [Kiến trúc phần mềm](#2-kiến-trúc-phần-mềm)
3. [Danh sách chức năng đã hoàn thiện](#3-danh-sách-chức-năng-đã-hoàn-thiện)
4. [Bản đồ Dependency chi tiết](#4-bản-đồ-dependency-chi-tiết)
5. [Phân loại Dependency phục vụ Mocking](#5-phân-loại-dependency-phục-vụ-mocking)
6. [Kết quả kiểm thử](#6-kết-quả-kiểm-thử)

---

## 1. Tổng quan hệ thống

Hệ thống Speed Delivery là ứng dụng giao hàng nhanh được xây dựng trên nền tảng **Spring Boot 3.4.1** và **Java 21**, tuân theo kiến trúc **3-Layer** (Controller – Service – Repository). Hệ thống phục vụ ba nhóm người dùng chính: **Khách hàng**, **Tài xế** và **Quản trị viên**.

### 1.1. Thống kê tổng quan

| Thành phần | Số lượng |
|:---|:---:|
| Service Implementation | 18 |
| Tổng số chức năng (methods) | 76 |
| REST Controller | 9 |
| API Endpoint | 44 |
| Entity (JPA) | 16 |
| Repository | 16 |
| Unit Test File | 15 |
| Unit Test Case | 194 |
| Tỷ lệ test PASSED | 100% |

### 1.2. Công nghệ sử dụng

| Thành phần | Công nghệ |
|:---|:---|
| Backend Framework | Spring Boot 3.4.1 |
| Ngôn ngữ | Java 21 |
| ORM | Spring Data JPA / Hibernate |
| Cơ sở dữ liệu | MySQL |
| Bảo mật | Spring Security + JWT |
| Build Tool | Maven |
| Testing Framework | JUnit 5 + Mockito / BDDMockito |
| API Documentation | Swagger / OpenAPI 3 |
| Frontend | React + TypeScript + Vite |

---

## 2. Kiến trúc phần mềm

### 2.1. Kiến trúc 3-Layer

Hệ thống được thiết kế theo mô hình kiến trúc phân tầng (Layered Architecture), bao gồm ba tầng chính:

```
┌──────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                     │
│         (REST Controllers – Nhận request, trả response)   │
│                                                          │
│  AuthController │ OrderController │ CustomerController    │
│  DriverController │ AdminController │ ReviewController    │
│  NotificationController │ VoucherController               │
│  WalletController                                        │
├──────────────────────────────────────────────────────────┤
│                     BUSINESS LAYER                        │
│       (Service Implementations – Xử lý nghiệp vụ)       │
│                                                          │
│  AuthServiceImpl │ OrderServiceImpl │ CustomerServiceImpl │
│  DriverServiceImpl │ AdminServiceImpl │ ReviewServiceImpl │
│  NotificationServiceImpl │ VoucherServiceImpl             │
│  WalletServiceImpl │ PaymentServiceImpl                   │
│  PricingServiceImpl │ DistanceServiceImpl                 │
│  OTPServiceImpl │ AuditLogServiceImpl                     │
│  EmailServiceImpl │ SMSServiceImpl                        │
│  FileStorageServiceImpl │ MapServiceImpl                  │
├──────────────────────────────────────────────────────────┤
│                    DATA ACCESS LAYER                      │
│            (Spring Data JPA Repositories)                 │
│                                                          │
│  UserRepository │ CustomerRepository │ DriverRepository   │
│  OrderRepository │ PaymentRepository │ AddressRepository  │
│  NotificationRepository │ VoucherRepository               │
│  ReviewRepository │ RefreshTokenRepository                │
│  RoleRepository │ LogRepository │ OtpCodeRepository       │
│  OrderHistoryRepository │ WalletRepository                │
│  TransactionRepository                                    │
├──────────────────────────────────────────────────────────┤
│                      DATABASE                             │
│                       MySQL                               │
└──────────────────────────────────────────────────────────┘
```

### 2.2. Nguyên tắc thiết kế

- **Interface-based Design:** Mỗi Service đều được định nghĩa qua Interface, cho phép dễ dàng thay thế implementation và tạo Mock trong kiểm thử.
- **Constructor Injection:** Tất cả dependency được inject qua constructor (sử dụng `@RequiredArgsConstructor` của Lombok), đảm bảo tính immutable và thuận lợi cho việc Mock.
- **Separation of Concerns:** Controller chỉ nhận request và delegate sang Service; Service chứa toàn bộ logic nghiệp vụ; Repository chỉ thao tác với cơ sở dữ liệu.

---

## 3. Danh sách chức năng đã hoàn thiện

### 3.1. Module Xác thực (AuthService) — 9 chức năng

Module xác thực chịu trách nhiệm quản lý toàn bộ vòng đời tài khoản người dùng, bao gồm đăng ký, đăng nhập, quản lý JWT token và thông tin cá nhân.

| STT | Chức năng | Phương thức | API Endpoint | HTTP Method |
|:---:|:---|:---|:---|:---:|
| 1 | Đăng ký tài khoản | `register()` | `/auth/register` | POST |
| 2 | Đăng nhập | `login()` | `/auth/login` | POST |
| 3 | Làm mới JWT Token | `refreshToken()` | `/auth/refresh` | POST |
| 4 | Quên mật khẩu (gửi OTP) | `forgotPassword()` | `/auth/forgot-password` | POST |
| 5 | Đặt lại mật khẩu bằng OTP | `resetPassword()` | `/auth/reset-password` | POST |
| 6 | Đổi mật khẩu | `changePassword()` | `/auth/change-password` | PUT |
| 7 | Đăng xuất (thu hồi token) | `logout()` | `/auth/logout` | POST |
| 8 | Xem thông tin cá nhân | `getProfile()` | `/auth/profile` | GET |
| 9 | Cập nhật thông tin cá nhân | `updateProfile()` | `/auth/profile` | PUT |

---

### 3.2. Module Đơn hàng (OrderService) — 8 chức năng

Module đơn hàng là trung tâm của hệ thống, quản lý toàn bộ vòng đời đơn hàng từ khi tạo đến khi hoàn thành hoặc hủy. Module này tích hợp với nhiều service khác: tính giá, thanh toán, voucher, thông báo.

| STT | Chức năng | Phương thức | API Endpoint | HTTP Method |
|:---:|:---|:---|:---|:---:|
| 1 | Tạo đơn hàng mới | `createOrder()` | `/orders` | POST |
| 2 | Xem đơn hàng theo ID | `getOrderById()` | `/orders/{id}` | GET |
| 3 | Xem đơn hàng theo mã | `getOrderByCode()` | `/orders/code/{orderCode}` | GET |
| 4 | Danh sách đơn hàng của khách | `getCustomerOrders()` | `/orders/customer/{customerId}` | GET |
| 5 | Danh sách đơn hàng của tài xế | `getDriverOrders()` | Nội bộ (Internal) | — |
| 6 | Gán tài xế cho đơn hàng | `assignDriver()` | Nội bộ (Internal) | — |
| 7 | Cập nhật trạng thái đơn hàng | `updateOrderStatus()` | `/orders/{id}/status` | PUT |
| 8 | Hủy đơn hàng | `cancelOrder()` | `/orders/{id}/cancel` | PUT |

**Luồng trạng thái đơn hàng:**

```
PENDING → CONFIRMED → ASSIGNED → PICKING_UP → IN_TRANSIT → DELIVERED
                                                            ↗
                         (bất kỳ trạng thái) → CANCELLED ──┘
```

---

### 3.3. Module Khách hàng (CustomerService) — 7 chức năng

Module khách hàng quản lý thông tin cá nhân và hệ thống địa chỉ giao/nhận hàng.

| STT | Chức năng | Phương thức | API Endpoint | HTTP Method |
|:---:|:---|:---|:---|:---:|
| 1 | Xem thông tin cá nhân | `getProfile()` | (qua AuthController) | GET |
| 2 | Cập nhật thông tin cá nhân | `updateProfile()` | (qua AuthController) | PUT |
| 3 | Danh sách địa chỉ đã lưu | `getAddresses()` | `/customers/{id}/addresses` | GET |
| 4 | Thêm địa chỉ mới | `addAddress()` | `/customers/{id}/addresses` | POST |
| 5 | Cập nhật địa chỉ | `updateAddress()` | `/customers/{id}/addresses/{addrId}` | PUT |
| 6 | Xóa địa chỉ | `deleteAddress()` | `/customers/{id}/addresses/{addrId}` | DELETE |
| 7 | Đặt địa chỉ mặc định | `setDefaultAddress()` | Nội bộ (Internal) | — |

---

### 3.4. Module Tài xế (DriverService) — 6 chức năng

Module tài xế quản lý trạng thái hoạt động, quy trình nhận/từ chối/hoàn thành đơn hàng.

| STT | Chức năng | Phương thức | API Endpoint | HTTP Method |
|:---:|:---|:---|:---|:---:|
| 1 | Bật/Tắt nhận đơn | `toggleAvailability()` | `/drivers/{id}/availability` | PUT |
| 2 | Nhận đơn hàng | `acceptOrder()` | `/drivers/{id}/orders/{orderId}/accept` | POST |
| 3 | Từ chối đơn hàng | `rejectOrder()` | `/drivers/{id}/orders/{orderId}/reject` | POST |
| 4 | Hoàn thành giao hàng | `completeDelivery()` | `/drivers/{id}/orders/{orderId}/complete` | PUT |
| 5 | Xem lịch sử giao hàng | `getDeliveryHistory()` | `/drivers/{id}/orders` | GET |
| 6 | Xem thu nhập | `getEarnings()` | `/drivers/{id}/earnings` | GET |

---

### 3.5. Module Quản trị (AdminService) — 5 chức năng

Module quản trị cung cấp dashboard thống kê tổng quan và quản lý người dùng hệ thống.

| STT | Chức năng | Phương thức | API Endpoint | HTTP Method |
|:---:|:---|:---|:---|:---:|
| 1 | Xem dashboard thống kê | `getDashboardStats()` | `/admin/dashboard` | GET |
| 2 | Danh sách người dùng (phân trang) | `getAllUsers()` | `/admin/users` | GET |
| 3 | Xem chi tiết người dùng | `getUserById()` | `/admin/users/{id}` | GET |
| 4 | Kích hoạt / Vô hiệu hóa tài khoản | `toggleUserActive()` | `/admin/users/{id}/toggle-active` | PUT |
| 5 | Xóa tài khoản | `deleteUser()` | `/admin/users/{id}` | DELETE |

---

### 3.6. Module Thông báo (NotificationService) — 5 chức năng

Module thông báo gửi và quản lý thông báo đến người dùng. Các thông báo được lưu vào cơ sở dữ liệu và phân loại theo NotificationType (SYSTEM, ORDER, PROMOTION, PAYMENT, CHAT).

| STT | Chức năng | Phương thức | API Endpoint | HTTP Method |
|:---:|:---|:---|:---|:---:|
| 1 | Gửi thông báo chung | `sendNotification()` | `/notifications` | POST |
| 2 | Gửi thông báo đơn hàng | `sendOrderNotification()` | `/notifications/order` | POST |
| 3 | Danh sách thông báo của người dùng | `getUserNotifications()` | `/notifications/user/{userId}` | GET |
| 4 | Đánh dấu thông báo đã đọc | `markAsRead()` | `/notifications/{id}/read` | PUT |
| 5 | Đếm thông báo chưa đọc | `getUnreadCount()` | `/notifications/user/{userId}/unread-count` | GET |

---

### 3.7. Module Voucher (VoucherService) — 5 chức năng

Module voucher quản lý mã giảm giá với hai loại: giảm theo phần trăm (PERCENTAGE) và giảm cố định (FIXED_AMOUNT). Voucher được kiểm tra giá trị đơn tối thiểu, hạn sử dụng, lượt sử dụng.

| STT | Chức năng | Phương thức | API Endpoint | HTTP Method |
|:---:|:---|:---|:---|:---:|
| 1 | Xác thực mã voucher | `validateVoucher()` | `/vouchers/validate` | POST |
| 2 | Áp dụng voucher lên đơn hàng | `applyVoucher()` | Nội bộ (Internal) | — |
| 3 | Danh sách voucher đang hoạt động | `getActiveVouchers()` | `/vouchers/active` | GET |
| 4 | Tạo voucher mới (Admin) | `createVoucher()` | `/vouchers` | POST |
| 5 | Xem chi tiết voucher | `getVoucherById()` | `/vouchers/{id}` | GET |

---

### 3.8. Module Tính giá (PricingService) — 5 chức năng

Module tính giá là Pure Logic Service — không phụ thuộc vào bất kỳ dependency bên ngoài nào. Công thức tính giá:

- **Giá cơ bản:** 15.000 VNĐ
- **Phí khoảng cách:** 5.000 VNĐ/km
- **Phụ thu trọng lượng:** 3.000 VNĐ/kg (áp dụng cho phần vượt quá 5kg)
- **Thu nhập tài xế:** 80% tổng giá

| STT | Chức năng | Phương thức |
|:---:|:---|:---|
| 1 | Tính tổng giá giao hàng | `calculateDeliveryPrice()` |
| 2 | Tính giá cơ bản | `calculateBasePrice()` |
| 3 | Tính phí theo khoảng cách | `calculateDistancePrice()` |
| 4 | Tính phụ thu trọng lượng | `calculateWeightSurcharge()` |
| 5 | Tính thu nhập tài xế | `calculateDriverEarnings()` |

---

### 3.9. Module Ví tài xế (WalletService) — 4 chức năng

Module ví quản lý tài chính của tài xế: số dư, thu nhập từ đơn hàng, rút tiền, lịch sử giao dịch.

| STT | Chức năng | Phương thức | API Endpoint | HTTP Method |
|:---:|:---|:---|:---|:---:|
| 1 | Xem thông tin ví | `getWallet()` | `/wallets/driver/{driverId}` | GET |
| 2 | Cộng thu nhập từ đơn hàng | `addEarning()` | Nội bộ (Internal) | — |
| 3 | Lịch sử giao dịch (phân trang) | `getTransactions()` | `/wallets/driver/{driverId}/transactions` | GET |
| 4 | Rút tiền | `withdraw()` | `/wallets/driver/{driverId}/withdraw` | POST |

---

### 3.10. Module Ghi log (AuditLogService) — 4 chức năng

Module ghi log hệ thống lưu lại mọi hành động quan trọng: đăng ký, tạo đơn, cập nhật trạng thái, xóa người dùng.

| STT | Chức năng | Phương thức | API Endpoint | HTTP Method |
|:---:|:---|:---|:---|:---:|
| 1 | Ghi log chi tiết (có userId, entity) | `log(userId, action, ...)` | Nội bộ (Internal) | — |
| 2 | Ghi log đơn giản | `log(action, details)` | Nội bộ (Internal) | — |
| 3 | Xem toàn bộ audit logs (Admin) | `getAllLogs()` | `/admin/logs` | GET |
| 4 | Xem audit logs theo user (Admin) | `getUserLogs()` | `/admin/logs/user/{userId}` | GET |

---

### 3.11. Module Thanh toán (PaymentService) — 3 chức năng

Module thanh toán xử lý giao dịch tài chính, hỗ trợ hai phương thức: tiền mặt (CASH) và chuyển khoản (BANK_TRANSFER). Hiện tại là Mock Service — ghi log thay vì kết nối cổng thanh toán thực.

| STT | Chức năng | Phương thức |
|:---:|:---|:---|
| 1 | Xử lý thanh toán | `processPayment()` |
| 2 | Hoàn tiền | `refundPayment()` |
| 3 | Kiểm tra trạng thái thanh toán | `getPaymentStatus()` |

---

### 3.12. Module Đánh giá (ReviewService) — 3 chức năng

Module đánh giá cho phép khách hàng đánh giá tài xế sau khi giao hàng hoàn thành (1–5 sao kèm bình luận). Điểm đánh giá trung bình của tài xế được cập nhật tự động.

| STT | Chức năng | Phương thức | API Endpoint | HTTP Method |
|:---:|:---|:---|:---|:---:|
| 1 | Đánh giá đơn hàng | `createReview()` | `/reviews` | POST |
| 2 | Xem đánh giá của đơn hàng | `getOrderReview()` | `/reviews/order/{orderId}` | GET |
| 3 | Danh sách đánh giá tài xế | `getDriverReviews()` | `/reviews/driver/{driverId}` | GET |

---

### 3.13. Module Khoảng cách (DistanceService) — 2 chức năng

Module tính khoảng cách sử dụng công thức Haversine để tính khoảng cách giữa hai điểm GPS. Đây là Pure Logic Service — không có dependency.

| STT | Chức năng | Phương thức |
|:---:|:---|:---|
| 1 | Tính khoảng cách GPS (Haversine) | `calculateDistance()` |
| 2 | Ước tính thời gian giao hàng (tốc độ trung bình 25 km/h) | `estimateTimeMinutes()` |

---

### 3.14. Module OTP (OTPService) — 2 chức năng

Module OTP sinh mã xác thực 6 chữ số, lưu vào cơ sở dữ liệu, thời hạn 5 phút.

| STT | Chức năng | Phương thức |
|:---:|:---|:---|
| 1 | Sinh mã OTP 6 chữ số | `generateOtp()` |
| 2 | Xác thực mã OTP | `verifyOtp()` |

---

### 3.15. Các Service hạ tầng (Infrastructure Mock Services)

Các service hạ tầng được thiết kế dưới dạng Mock — chỉ ghi log thay vì kết nối đến dịch vụ thực (SMTP, SMS gateway, cloud storage, map API). Thiết kế này phù hợp với mục tiêu nghiên cứu kỹ thuật Mocking: trong kiểm thử, chính các service thật cũng cần được Mock tương tự.

| Service | Số chức năng | Mô tả |
|:---|:---:|:---|
| **EmailServiceImpl** | 3 | `sendEmail()`, `sendOtpEmail()`, `sendWelcomeEmail()` — Ghi log thay vì gửi email |
| **SMSServiceImpl** | 1 | `sendSms()` — Ghi log thay vì gửi SMS |
| **FileStorageServiceImpl** | 2 | `uploadFile()`, `deleteFile()` — Trả về URL giả |
| **MapServiceImpl** | 2 | `geocodeAddress()`, `reverseGeocode()` — Trả tọa độ cố định |

---

### 3.16. Tầng Bảo mật (Security Layer)

| Component | Số chức năng | Mô tả |
|:---|:---:|:---|
| **JwtTokenProvider** | 5 | Tạo, xác thực, parse JWT access token và refresh token |
| **CustomUserDetailsService** | 1 | Load thông tin user từ DB cho Spring Security |
| **JwtAuthenticationFilter** | 1 | Filter xác thực JWT trong mỗi HTTP request |
| **SecurityConfig** | — | Cấu hình Spring Security, CORS, endpoint authorization |

---

## 4. Bản đồ Dependency chi tiết

### 4.1. Tổng quan quan hệ phụ thuộc

Sơ đồ dưới đây thể hiện mối quan hệ inject (tiêm phụ thuộc) giữa các Service trong hệ thống. Mũi tên A → B nghĩa là Service A inject và sử dụng Service B.

```
                    ┌─────────────┐
            ┌──────▶│  OTPService │
            │       └─────────────┘
            │       ┌──────────────┐
            ├──────▶│ EmailService │
            │       └──────────────┘
 ┌──────────┴──┐    ┌─────────────────┐
 │ AuthService │───▶│ AuditLogService │◀──┬──────────────────┐
 └─────────────┘    └─────────────────┘   │                  │
                            ▲             │                  │
                            │       ┌─────┴────────┐  ┌─────┴────────┐
                            │       │ AdminService │  │ReviewService │
                            │       └──────────────┘  └──────────────┘
                            │
                            │       ┌────────────────┐
                            ├───────│CustomerService │
                            │       └────────────────┘
                            │
 ┌──────────────┐    ┌──────┴──────┐
 │DriverService │───▶│OrderService │
 └──────┬───────┘    └──────┬──────┘
        │                   │
        │                   ├──────▶ PaymentService
        │                   ├──────▶ PricingService
        │                   ├──────▶ DistanceService
        │                   ├──────▶ VoucherService
        │                   └──────▶ NotificationService
        │                                   ▲
        └───────────────────────────────────┘
```

### 4.2. Chi tiết Dependency từng Service

#### 4.2.1. AuthServiceImpl — 11 Dependencies

AuthService có số lượng dependency lớn nhất trong hệ thống, bao gồm cả Repository, Service lẫn các component Spring Security.

| STT | Dependency | Phân loại | Vai trò trong AuthService |
|:---:|:---|:---|:---|
| 1 | `UserRepository` | Repository | Tìm kiếm, lưu trữ thông tin người dùng |
| 2 | `RoleRepository` | Repository | Tìm vai trò (ROLE_CUSTOMER, ROLE_DRIVER) |
| 3 | `CustomerRepository` | Repository | Tạo profile khách hàng khi đăng ký |
| 4 | `DriverRepository` | Repository | Tạo profile tài xế khi đăng ký |
| 5 | `RefreshTokenRepository` | Repository | Lưu, tìm, xóa refresh token |
| 6 | `PasswordEncoder` | Spring Security | Mã hóa và so sánh mật khẩu (BCrypt) |
| 7 | `AuthenticationManager` | Spring Security | Xác thực username/password |
| 8 | `JwtTokenProvider` | Security Component | Tạo và xác thực JWT token |
| 9 | `OTPService` | Service | Sinh OTP khi quên mật khẩu |
| 10 | `EmailService` | Service | Gửi email OTP và welcome |
| 11 | `AuditLogService` | Service | Ghi log đăng ký, đăng nhập, đổi mật khẩu |

---

#### 4.2.2. OrderServiceImpl — 10 Dependencies

OrderService là module có mức độ phức tạp cao thứ hai, tích hợp với gần như toàn bộ các service nghiệp vụ khác.

| STT | Dependency | Phân loại | Vai trò trong OrderService |
|:---:|:---|:---|:---|
| 1 | `OrderRepository` | Repository | CRUD đơn hàng |
| 2 | `CustomerRepository` | Repository | Tìm thông tin khách hàng khi tạo đơn |
| 3 | `DriverRepository` | Repository | Cập nhật trạng thái và thống kê tài xế |
| 4 | `OrderHistoryRepository` | Repository | Lưu lịch sử thay đổi trạng thái |
| 5 | `PaymentService` | **Service** | Xử lý thanh toán khi tạo đơn, hoàn tiền khi hủy |
| 6 | `PricingService` | **Service** | Tính giá giao hàng (base + distance + weight) |
| 7 | `DistanceService` | **Service** | Tính khoảng cách giữa điểm gửi và nhận |
| 8 | `VoucherService` | **Service** | Xác thực và áp dụng mã giảm giá |
| 9 | `NotificationService` | **Service** | Gửi thông báo trạng thái đơn hàng |
| 10 | `AuditLogService` | **Service** | Ghi log tạo đơn, cập nhật trạng thái, hủy đơn |

---

#### 4.2.3. DriverServiceImpl — 5 Dependencies

| STT | Dependency | Phân loại | Vai trò trong DriverService |
|:---:|:---|:---|:---|
| 1 | `DriverRepository` | Repository | CRUD thông tin tài xế |
| 2 | `OrderRepository` | Repository | Tra cứu đơn hàng cần nhận |
| 3 | `OrderService` | **Service** | Delegate gán tài xế và cập nhật trạng thái đơn |
| 4 | `NotificationService` | **Service** | Gửi thông báo khi từ chối đơn |
| 5 | `AuditLogService` | **Service** | Ghi log nhận đơn, từ chối, hoàn thành |

---

#### 4.2.4. AdminServiceImpl — 5 Dependencies

| STT | Dependency | Phân loại | Vai trò trong AdminService |
|:---:|:---|:---|:---|
| 1 | `UserRepository` | Repository | Quản lý tài khoản người dùng |
| 2 | `CustomerRepository` | Repository | Đếm tổng số khách hàng (dashboard) |
| 3 | `DriverRepository` | Repository | Đếm tổng số tài xế (dashboard) |
| 4 | `OrderRepository` | Repository | Thống kê đơn hàng và doanh thu |
| 5 | `AuditLogService` | **Service** | Ghi log kích hoạt/vô hiệu hóa/xóa user |

---

#### 4.2.5. ReviewServiceImpl — 5 Dependencies

| STT | Dependency | Phân loại | Vai trò trong ReviewService |
|:---:|:---|:---|:---|
| 1 | `ReviewRepository` | Repository | CRUD đánh giá |
| 2 | `OrderRepository` | Repository | Kiểm tra đơn hàng tồn tại và đã hoàn thành |
| 3 | `CustomerRepository` | Repository | Kiểm tra khách hàng tồn tại |
| 4 | `DriverRepository` | Repository | Cập nhật điểm đánh giá trung bình tài xế |
| 5 | `AuditLogService` | **Service** | Ghi log tạo đánh giá |

---

#### 4.2.6. CustomerServiceImpl — 4 Dependencies

| STT | Dependency | Phân loại | Vai trò trong CustomerService |
|:---:|:---|:---|:---|
| 1 | `UserRepository` | Repository | Đọc/ghi thông tin user |
| 2 | `CustomerRepository` | Repository | Tìm customer profile |
| 3 | `AddressRepository` | Repository | CRUD địa chỉ giao hàng |
| 4 | `AuditLogService` | **Service** | Ghi log thêm/sửa/xóa địa chỉ |

---

#### 4.2.7. WalletServiceImpl — 3 Dependencies

| STT | Dependency | Phân loại | Vai trò trong WalletService |
|:---:|:---|:---|:---|
| 1 | `WalletRepository` | Repository | CRUD ví tài xế |
| 2 | `TransactionRepository` | Repository | CRUD giao dịch ví |
| 3 | `DriverRepository` | Repository | Tìm thông tin tài xế |

---

#### 4.2.8. PaymentServiceImpl — 2 Dependencies

| STT | Dependency | Phân loại | Vai trò trong PaymentService |
|:---:|:---|:---|:---|
| 1 | `PaymentRepository` | Repository | CRUD thanh toán |
| 2 | `OrderRepository` | Repository | Tìm đơn hàng liên quan |

---

#### 4.2.9. Các Service có 1 Dependency

| Service | Dependency | Phân loại | Vai trò |
|:---|:---|:---|:---|
| **NotificationServiceImpl** | `NotificationRepository` | Repository | CRUD thông báo |
| **VoucherServiceImpl** | `VoucherRepository` | Repository | CRUD voucher |
| **AuditLogServiceImpl** | `LogRepository` | Repository | CRUD audit log |
| **OTPServiceImpl** | `OtpCodeRepository` | Repository | CRUD mã OTP |
| **CustomUserDetailsService** | `UserRepository` | Repository | Tìm user theo email |

---

#### 4.2.10. Các Service không có Dependency (Pure Logic)

| Service | Mô tả |
|:---|:---|
| **PricingServiceImpl** | Tính giá giao hàng bằng công thức toán học thuần túy |
| **DistanceServiceImpl** | Tính khoảng cách GPS bằng công thức Haversine |
| **JwtTokenProvider** | Tạo/parse JWT dựa trên thư viện JJWT và cấu hình tĩnh |
| **EmailServiceImpl** | Mock — chỉ ghi log |
| **SMSServiceImpl** | Mock — chỉ ghi log |
| **FileStorageServiceImpl** | Mock — trả URL giả |
| **MapServiceImpl** | Mock — trả tọa độ cố định |

---

## 5. Phân loại Dependency phục vụ Mocking

Trong kiểm thử đơn vị với kỹ thuật Mocking, mỗi dependency của Service Under Test cần được thay thế bằng một Mock Object. Bảng dưới đây phân loại các dependency theo cấp độ phức tạp khi Mock.

### 5.1. Bảng tổng hợp Dependencies cần Mock

| STT | Service (Class Under Test) | Tổng Deps | Dependencies cần `@Mock` |
|:---:|:---|:---:|:---|
| 1 | AuthServiceImpl | **11** | `UserRepository`, `RoleRepository`, `CustomerRepository`, `DriverRepository`, `RefreshTokenRepository`, `PasswordEncoder`, `AuthenticationManager`, `JwtTokenProvider`, `OTPService`, `EmailService`, `AuditLogService` |
| 2 | OrderServiceImpl | **10** | `OrderRepository`, `CustomerRepository`, `DriverRepository`, `OrderHistoryRepository`, `PaymentService`, `PricingService`, `NotificationService`, `VoucherService`, `DistanceService`, `AuditLogService` |
| 3 | DriverServiceImpl | **5** | `DriverRepository`, `OrderRepository`, `OrderService`, `NotificationService`, `AuditLogService` |
| 4 | AdminServiceImpl | **5** | `UserRepository`, `CustomerRepository`, `DriverRepository`, `OrderRepository`, `AuditLogService` |
| 5 | ReviewServiceImpl | **5** | `ReviewRepository`, `OrderRepository`, `CustomerRepository`, `DriverRepository`, `AuditLogService` |
| 6 | CustomerServiceImpl | **4** | `UserRepository`, `CustomerRepository`, `AddressRepository`, `AuditLogService` |
| 7 | WalletServiceImpl | **3** | `WalletRepository`, `TransactionRepository`, `DriverRepository` |
| 8 | PaymentServiceImpl | **2** | `PaymentRepository`, `OrderRepository` |
| 9 | NotificationServiceImpl | **1** | `NotificationRepository` |
| 10 | VoucherServiceImpl | **1** | `VoucherRepository` |
| 11 | AuditLogServiceImpl | **1** | `LogRepository` |
| 12 | OTPServiceImpl | **1** | `OtpCodeRepository` |
| 13 | CustomUserDetailsService | **1** | `UserRepository` |
| 14 | PricingServiceImpl | **0** | Không cần Mock (Pure Logic) |
| 15 | DistanceServiceImpl | **0** | Không cần Mock (Pure Logic) |
| 16 | JwtTokenProvider | **0** | Không cần Mock (Pure Logic) |

### 5.2. Phân loại theo cấp độ Mocking

**Cấp độ Nâng cao (10–11 Dependencies):** Bao gồm AuthServiceImpl và OrderServiceImpl. Các service này yêu cầu Mock số lượng lớn dependency thuộc nhiều loại khác nhau (Repository, Service, Spring Security component). Khi viết test cần sử dụng các kỹ thuật nâng cao như `ArgumentCaptor`, `InOrder`, `willDoNothing()`, `willThrow()`.

**Cấp độ Trung bình (4–5 Dependencies):** Bao gồm DriverServiceImpl, AdminServiceImpl, ReviewServiceImpl, CustomerServiceImpl. Các service này có mối quan hệ Service-to-Service (ví dụ: DriverService → OrderService), đòi hỏi Mock cả Repository lẫn Service khác.

**Cấp độ Cơ bản (1–3 Dependencies):** Bao gồm WalletServiceImpl, PaymentServiceImpl, NotificationServiceImpl, VoucherServiceImpl, AuditLogServiceImpl, OTPServiceImpl, CustomUserDetailsService. Các service này chủ yếu chỉ phụ thuộc vào Repository, dễ Mock nhất.

**Không cần Mock (0 Dependencies):** Bao gồm PricingServiceImpl, DistanceServiceImpl, JwtTokenProvider. Các service này là Pure Logic — test trực tiếp bằng cách gọi method và assert kết quả, không cần tạo bất kỳ Mock Object nào.

---

## 6. Kết quả kiểm thử

### 6.1. Tổng hợp Unit Test

| STT | Test Class | Module được test | Số Test Case | Số Deps được Mock | Kết quả |
|:---:|:---|:---|:---:|:---:|:---:|
| 1 | AuthServiceImplTest | AuthServiceImpl | 22 | 11 | PASSED |
| 2 | OrderServiceImplTest | OrderServiceImpl | 17 | 10 | PASSED |
| 3 | PricingServiceImplTest | PricingServiceImpl | 22 | 0 | PASSED |
| 4 | VoucherServiceImplTest | VoucherServiceImpl | 15 | 1 | PASSED |
| 5 | CustomerServiceImplTest | CustomerServiceImpl | 12 | 4 | PASSED |
| 6 | DriverServiceImplTest | DriverServiceImpl | 12 | 5 | PASSED |
| 7 | JwtTokenProviderTest | JwtTokenProvider | 11 | 0 | PASSED |
| 8 | PaymentServiceImplTest | PaymentServiceImpl | 10 | 2 | PASSED |
| 9 | AdminServiceImplTest | AdminServiceImpl | 10 | 5 | PASSED |
| 10 | DistanceServiceImplTest | DistanceServiceImpl | 10 | 0 | PASSED |
| 11 | NotificationServiceImplTest | NotificationServiceImpl | 7 | 1 | PASSED |
| 12 | ReviewServiceImplTest | ReviewServiceImpl | 7 | 5 | PASSED |
| 13 | CustomUserDetailsServiceTest | CustomUserDetailsService | 5 | 1 | PASSED |
| | **TỔNG CỘNG** | **13 module** | **160** | | **160/160** |

### 6.2. Kết quả chạy test

```
Tests run: 160, Failures: 0, Errors: 0, Skipped: 0
BUILD SUCCESS
```

---

*Báo cáo được tạo dựa trên phân tích mã nguồn hệ thống Speed Delivery.*
