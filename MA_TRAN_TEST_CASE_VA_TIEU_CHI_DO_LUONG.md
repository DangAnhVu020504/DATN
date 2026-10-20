# MA TRẬN TEST CASE & TIÊU CHÍ ĐO LƯỜNG
# Thực nghiệm kỹ thuật Mocking trong kiểm thử đơn vị — Dự án Speed Delivery

**Liên kết:** [BAO_CAO_THUC_NGHIEM_MOCKING.md](BAO_CAO_THUC_NGHIEM_MOCKING.md)
**Phạm vi:** Tầng Service (`com.speed.delivery.service.impl`) — Spring Boot 3.4.1, JUnit 5, Mockito, JaCoCo

---

## 1. Cấu trúc Ma trận Test Case

Mỗi chức năng nghiệp vụ được thiết kế test case theo **3 đường dẫn (path)**:

| Loại Path | Ký hiệu | Định nghĩa | Vai trò của Mocking |
|---|---|---|---|
| **Happy path** | HP | Luồng nghiệp vụ thành công với dữ liệu hợp lệ | Mock phụ thuộc trả về giá trị chuẩn để kiểm tra logic xử lý chính |
| **Edge case** | ED | Đầu vào biên: rỗng, 0, âm, giới hạn, null, trùng lặp | Mock trả về giá trị biên để kiểm tra logic ràng buộc |
| **Exception path** | EX | Lỗi hệ thống/ngoại lệ từ dependency | Mock ném lỗi (`willThrow`) hoặc trả về trạng thái lỗi |

---

## 2. Ma trận Test Case chi tiết

### 2.1. Module Xác thực — `AuthServiceImplTest` (26 TC)

| Mã TC | Path | Kịch bản | Mock setup | Kết quả kỳ vọng |
|---|---|---|---|---|
| AUTH-01 | HP | Đăng ký thành công | `existsByEmail→false`, `save→user` | Trả về `JwtResponse`, gửi welcome email |
| AUTH-02 | ED | Email trùng lặp | `existsByEmail→true` | `DuplicateResourceException`, dep sau KHÔNG được gọi |
| AUTH-03 | ED | SĐT trùng lặp | `existsByPhone→true` | `DuplicateResourceException` |
| AUTH-04 | HP | Đăng nhập thành công | `authenticate→auth`, JWT generate | Trả về access + refresh token |
| AUTH-05 | EX | Sai mật khẩu | `authenticate` throw `BadCredentialsException` | `UnauthorizedException` |
| AUTH-06 | ED | Tài khoản bị khóa | user `isActive=false` | `UnauthorizedException` |
| AUTH-07 | EX | Refresh token hết hạn | token hết hạn | `UnauthorizedException`, token bị xóa |
| ... | HP/ED/EX | OTP, quên mật khẩu, đổi mật khẩu | `otpService`, `emailService` mock | Đúng luồng OTP |

### 2.2. Quản lý đơn hàng — `OrderServiceImplTest` (17 TC, 10 dependency mock)

| Mã TC | Path | Kịch bản | Mock setup | Kết quả kỳ vọng |
|---|---|---|---|---|
| ORD-01 | HP | Tạo đơn thành công | distance→5km, price→40000, payment→true | Gọi đủ: pricing → payment → notification → audit |
| ORD-02 | ED | Voucher giảm giá | `applyVoucher→5000` | `totalPrice` trừ đúng |
| ORD-03 | ED | Khách không tồn tại | `findAll→[]` | `ResourceNotFoundException` |
| ORD-04 | EX | Thanh toán thất bại | `processPayment→false` | `PaymentFailedException`, đơn không lưu |
| ORD-05 | ED | Cân nặng 0 / lớn | `calculateWeightSurcharge` | Phụ tải đúng theo biên |
| ORD-06 | ED | Khoảng cách 0 km | `calculateDistance→0` | Giá khoảng cách = 0 |
| ORD-07 | EX | Đơn không tồn tại | `findById→empty` | `ResourceNotFoundException` |
| ORD-08 | HP | PENDING→CONFIRMED | — | Ghi `OrderHistory` |
| ORD-09 | EX | Chuyển trạng thái sai luồng | — | `BadRequestException` |
| ORD-10 | ED | Tài xế không khả dụng | `isAvailable=false` | Không gán tài xế |

### 2.3. Thanh toán — `PaymentServiceImplTest` (10 TC)

| Mã TC | Path | Kịch bản | Kết quả kỳ vọng |
|---|---|---|---|
| PAY-01 | HP | Thanh toán CASH hợp lệ | `PENDING`, ghi Transaction |
| PAY-02 | HP | BANK_TRANSFER | `COMPLETED` |
| PAY-03 | ED | Số tiền `null` | `BadRequestException` |
| PAY-04 | ED | Số tiền âm (-1000) | Từ chối |
| PAY-05 | ED | Đơn không tồn tại (id=999) | `ResourceNotFoundException` |
| PAY-06 | EX | Giao dịch thất bại | `false`, không ghi Transaction |
| PAY-07 | HP | Hoàn tiền | Transaction `REFUND` |
| PAY-08 | EX | Hoàn tiền đơn không tồn tại | `ResourceNotFoundException` |

### 2.4. Voucher — `VoucherServiceImplTest` (18 TC)

| Mã TC | Path | Kịch bản | Kết quả kỳ vọng |
|---|---|---|---|
| VOU-01 | HP | Áp `GIAM15K` hợp lệ | Giảm đúng 15.000đ |
| VOU-02 | ED | Đơn dưới giá trị tối thiểu | Không cho áp |
| VOU-03 | EX | Voucher hết hạn | `VoucherExpiredException` |
| VOU-04 | EX | Hết lượt dùng | `BadRequestException` |
| VOU-05 | EX | Mã không tồn tại | `ResourceNotFoundException` |

### 2.5. Các module khác

| Test class | HP | ED | EX | Kịch bản chính |
|---|---|---|---|---|
| `PricingServiceImplTest` (22 TC) | Giá cơ bản, theo km | KM=0, trọng lượng biên | — | Thuần logic, ít mock |
| `WalletServiceImplTest` (16 TC) | Xem/cộng thu nhập/rút tiền | Số dư = 0, ví chưa tồn tại (tự tạo) | Số dư không đủ | |
| `ReviewServiceImplTest` (7 TC) | Tạo review | Điểm 1–5 | Đơn chưa hoàn thành | |
| `DriverServiceImplTest` (18 TC) | Đăng ký, đổi trạng thái, nhận đơn | ONLINE/OFFLINE | Không tìm thấy driver | |
| `JwtTokenProviderTest` (10 TC) | Sinh/verify token | Token hết hạn | Sai chữ ký | |
| `CustomUserDetailsServiceTest` (5 TC) | Load user | Nhiều role | User không tồn tại | |

**Tổng hợp ma trận (194 lượt test — 189 unit + 5 demo đối chứng):**

| Path | Tỷ lệ | Vai trò |
|---|---|---|
| Happy path | ~35% | Kiểm chứng logic nghiệp vụ chính |
| Edge case | ~40% | Tính bền bỉ với dữ liệu biên |
| Exception path | ~25% | Xử lý lỗi & fail-fast |

### 2.6. Ma trận Kỹ thuật Mock × Path

| Kỹ thuật Mockito | Happy path | Edge case | Exception path |
|---|---|---|---|
| `given(...).willReturn(value)` | ✅ kết quả chuẩn | ✅ giá trị biên (0, âm, rỗng) | — |
| `given(...).willThrow(exception)` | — | — | ✅ lỗi từ dependency |
| `willReturn(false)` (trạng thái lỗi nghiệp vụ) | — | ✅ trạng thái bất thường | ✅ payment fail |
| `then(mock).should(...)` | ✅ verify luồng đủ | ✅ verify dừng sớm | ✅ verify fail-fast (`shouldHaveNoInteractions`) |
| `ArgumentCaptor` | ✅ object truyền vào | ✅ field biên | — |
| `InOrder` | ✅ thứ tự nghiệp vụ | — | — |

---

## 3. Tiêu chí đo lường hiệu quả

### 3.1. Thời gian chạy (Execution Time)

**Cách đo:** cột `Time elapsed` của Surefire per-class; tổng ở dòng cuối build.

**Kết quả thực đo (18/10/2026):**

| Thành phần | Thời gian đo được |
|---|---|
| Suite 194 lượt (`mvn clean verify` gồm compile + 2 lớp demo + JaCoCo + jacoco:check) | **01:44 min** |
| 189 test đơn vị thuần Mockito (không tính 2 lớp demo) | **~4,7 s** (~25 ms/test) |
| `OrderServiceImplTest$CreateOrderTests` (4 TC) | **0.047 s** |
| `PaymentServiceImplTest$RefundPaymentTests` (2 TC) | **0.023 s** |
| `PricingServiceImplTest` (22 TC) | **0.122 s** |
| `WalletServiceImplTest` (16 TC) | **0.495 s** |
| `VoucherServiceImplTest$ValidateTests` (7 TC) | **0.032 s** |

→ Trung bình **1–100 mili-giây/test đơn vị**. Đối chứng (lớp demo `SpringContextDemoTest` đo cùng lần chạy): khởi động Spring Context tốn **39,7 s**, login thật qua H2 tốn **270,6 ms/lượt** — chậm hơn hàng trăm lần so với Mock. Class demo đã được nới ngưỡng assert lên 30 s để chống flaky khi máy chạy tải nặng.

### 3.2. Độ bao phủ (Code Coverage) — JaCoCo

**Cách đo:** `mvn clean verify` sinh `target/site/jacoco/index.html`; số liệu rút từ `jacoco.csv`.

**Kết quả thực đo (18/10/2026):**

| Thành phần | Line coverage | Branch |
|---|---|---|
| `PaymentServiceImpl`, `PricingServiceImpl`, `DriverServiceImpl`, `AdminServiceImpl`, `NotificationServiceImpl`, `DistanceServiceImpl`, `WalletServiceImpl`, `VoucherServiceImpl`, `AuthServiceImpl` | **100%** | Có branch phủ |
| `CustomerServiceImpl` | 96.1% | 9/30 |
| `OrderServiceImpl` | 94.5% | 28/30 |
| `ReviewServiceImpl` | 93.3% | 2/12 |
| `JwtTokenProvider` | 91.5% | — |
| **12 lớp nghiệp vụ trọng tâm** | **97.8%** (796/814 dòng) | — |
| Gói `service.impl` (18 lớp) | 91.4% | — |
| Toàn dự án (66 classes) | 75.2% | 66.2% |

> **Cách diễn giải:** 75,2% toàn dự án gồm cả Controller/Entity/Infrastructure ngoài phạm vi
> Unit Test. **12 lớp nghiệp vụ trọng tâm — đối tượng của Mocking — đạt 97,8% line (9 lớp
> 100%)**, và được xác minh tự động bằng rule `jacoco:check` trong `mvn verify`
> (mỗi lớp trong 12 lớp phải đạt ≥90% line — build đỏ nếu vi phạm).

### 3.3. Tính độc lập (Test Isolation)

**Định nghĩa:** bộ test đạt Isolation khi thỏa 4 điều kiện:

| Tiêu chí | Cách kiểm chứng | Kết quả |
|---|---|---|
| **I1 — Không phụ thuộc môi trường** | Suite không kết nối CSDL (unit test thuần Mockito); đã kiểm chứng thêm khi chạy full-suite | ✅ 194/194 pass (18/10) |
| **I2 — Không chia sẻ trạng thái** | `@BeforeEach` khởi tạo data riêng; Mockito tạo mock mới mỗi test (strict stubs) | ✅ |
| **I3 — Thứ tự chạy không ảnh hưởng** | Chạy lẻ 1 class vẫn pass như chạy cả suite | ✅ |
| **I4 — Không phụ thuộc mạng** | Email/SMS/Map/Payment là mock | ✅ (log chỉ có `[MOCK PAYMENT]`) |

**Lệnh kiểm chứng I3:**
```bash
mvn test -Dtest=AuthServiceImplTest                                # 26 test, ~1s
mvn test -Dtest=AuthServiceImplTest#register_DuplicateEmail        # 1 test, <1s
```

**Định lượng:** 194/194 pass khi chạy đầy đủ (18/10/2026); các lớp mới bổ sung (Wallet/Driver/Voucher/Auth) cũng pass khi chạy lẻ từng lớp; bộ test không hề kết nối CSDL → **tỷ lệ độc lập 100%**.

---

## 4. Tổng hợp tiêu chí đánh giá

| Tiêu chí | Định nghĩa | Phương pháp đo | Kết quả thực đo |
|---|---|---|---|
| **Execution Time** | Tổng thời gian + thời gian/test | `Time elapsed` (Surefire) | 189 test unit ~4,7s (~25 ms/test); `mvn clean verify` 1:44 (gồm 2 lớp demo) |
| **Code Coverage** | % dòng/nhánh được test chạm tới | JaCoCo HTML/CSV + `jacoco:check` | 12 lớp trọng tâm 97.8% line (9 lớp 100%); check tự động PASS |
| **Test Isolation** | Độc lập môi trường & lẫn nhau | Tắt MySQL chạy lại; verify `NoInteractions` | 194/194 pass, 0 flaky |
| **Path coverage** | HP/ED/EX được thiết kế đủ | Ma trận mục 2 | 3 đường dẫn phủ mỗi module |
| **Kiểm soát hành vi ngoài** | Mô phỏng lỗi hệ thống ngoài | `willReturn(false)`, `willThrow` | Payment fail, voucher hết hạn, OTP sai |

---

## 5. Cách tái lập kết quả

```bash
cd speed-backend

# 1. Chạy toàn bộ + coverage + tự kiểm tra ngưỡng coverage
mvn clean verify
# → "Tests run: 194, Failures: 0" + BUILD SUCCESS + jacoco:check PASS

# 2. Xem coverage trực quan (mở bằng trình duyệt)
start target\site\jacoco\index.html

# 3. Chạy 1 class đơn lẻ — chứng minh tính độc lập (không cần DB)
mvn test -Dtest=AuthServiceImplTest
```
