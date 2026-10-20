# BÁO CÁO THIẾT KẾ MA TRẬN TEST CASE & TIÊU CHÍ ĐO LƯỜNG

**Đề tài:** Nghiên cứu và ứng dụng kỹ thuật Mocking trong kiểm thử đơn vị
**Dự án thực nghiệm:** Speed Delivery — Hệ thống giao hàng nhanh
**Công nghệ:** Java 21 · Spring Boot 3.4.1 · JUnit 5 · Mockito (BDDMockito) · AssertJ · JaCoCo 0.8.12 · Maven Surefire 3.5.2
**Đối tượng kiểm thử:** Tầng Service (`com.speed.delivery.service.impl`) và tầng bảo mật (`JwtTokenProvider`, `CustomUserDetailsService`)
**Ngày đo:** 29/09/2026 (lần đo gốc) · **Đo lại:** 18/10/2026 (bộ test mở rộng — 189 lượt Unit + 5 lượt demo) · **Môi trường:** Windows 11 · JDK 21.0.10 (Oracle) · Apache Maven 3.9.16 · MySQL80 (đang **Running** — bộ test không kết nối tới)
**Tài liệu liên quan:** [BAO_CAO_THUC_NGHIEM_MOCKING.md](BAO_CAO_THUC_NGHIEM_MOCKING.md) · [MA_TRAN_TEST_CASE_VA_TIEU_CHI_DO_LUONG.md](MA_TRAN_TEST_CASE_VA_TIEU_CHI_DO_LUONG.md)

---

## 1. Mục tiêu, phạm vi và bộ test hiện có

### 1.1. Mục tiêu

Báo cáo trình bày hai nội dung phục vụ Chương 3 (Triển khai thực nghiệm) của khóa luận:

1. **Thiết kế Ma trận Test Case** cho tầng Service theo ba đường dẫn kiểm thử: **Happy path (HP) — Edge case (ED) — Exception path (EX)**, làm cơ sở cho việc xây dựng và đánh giá các kịch bản Unit Test có áp dụng Mocking.
2. **Xác định các tiêu chí đo lường hiệu quả** của bộ test, gồm: **(1) Thời gian chạy – Execution Time**, **(2) Độ bao phủ – Code Coverage**, **(3) Tính độc lập – Test Isolation**, kèm cơ sở lý thuyết, công thức, phương pháp đo, ngưỡng chấp nhận và kết quả thực đo.

### 1.2. Phạm vi

Phạm vi số liệu trong báo cáo là **bộ Unit Test có áp dụng Mocking** đang tồn tại trong dự án:

- **15 lớp Unit Test** (thuộc `service.impl` và `security`), tổng cộng **182 method** (JUnit) chạy thành **189 lượt** (do 3 method dùng `@ParameterizedTest`).
- **2 lớp Demo đối chứng** (`com.speed.delivery.demo`) dùng để so sánh có/không dùng Mocking — 5 lượt chạy. Hai lớp này **không** thuộc bộ Unit Test chính (một lớp cố ý nạp Spring Context + H2), nên được tách riêng khi tính các chỉ số của bộ test Mocking.

Khi chạy `mvn test` (không lọc), Maven thực thi **194 lượt** = 189 (Unit Test Mocking) + 5 (Demo đối chứng).

### 1.3. Bộ test hiện có

| # | Test class | Số method | Số lượt | Dependencies được Mock |
|---|---|:--:|:--:|---|
| 1 | `AuthServiceImplTest` | 26 | 26 | 11 (Repository, JWT, PasswordEncoder, AuthManager, Email, OTP, AuditLog) |
| 2 | `OrderServiceImplTest` | 17 | 17 | 10 (Repository, Payment, Pricing, Notification, Voucher, Distance, AuditLog) |
| 3 | `PaymentServiceImplTest` | 10 | 10 | 2 |
| 4 | `VoucherServiceImplTest` | 18 | 18 | 1 |
| 5 | `PricingServiceImplTest` | 16 | 22 | 0 (thuần logic, `@ParameterizedTest`) |
| 6 | `DistanceServiceImplTest` | 9 | 10 | 0 (thuần toán học, `@ParameterizedTest`) |
| 7 | `CustomerServiceImplTest` | 12 | 12 | 4 |
| 8 | `DriverServiceImplTest` | 18 | 18 | 5 |
| 9 | `AdminServiceImplTest` | 10 | 10 | 5 |
| 10 | `NotificationServiceImplTest` | 7 | 7 | 1 |
| 11 | `ReviewServiceImplTest` | 7 | 7 | 5 |
| 12 | `JwtTokenProviderTest` | 10 | 10 | 0 (sinh/verify token thật với secret test) |
| 13 | `CustomUserDetailsServiceTest` | 5 | 5 | 1 |
| 14 | `WalletServiceImplTest` | 16 | 16 | 3 (WalletRepository, TransactionRepository, DriverRepository) |
| 15 | `SpeedApplicationTest` | 1 | 1 | 0 (smoke test) |
| | **Tổng Unit Test (Mocking)** | **182** | **189** | |
| + | `MockingDemoTest` (đối chứng — có Mock) | 3 | 3 | 11 |
| + | `SpringContextDemoTest` (đối chứng — KHÔNG Mock) | 2 | 2 | — (Spring Context + H2 thật) |

> **Ghi chú kỹ thuật:** PricingServiceImplTest có 16 method nhưng chạy 22 lượt vì có 2 `@ParameterizedTest` (`@CsvSource` mỗi cái 4 dòng). DistanceServiceImplTest có 9 method chạy 10 lượt vì 1 `@ParameterizedTest` 2 dòng.

---

## 2. Cơ sở lý thuyết của thiết kế Test Case

Phần này làm rõ các khái niệm lý thuyết được dùng để **biện luận** cho cách thiết kế ma trận test case và ba tiêu chí đo lường ở các mục sau. Mọi khái niệm đều có nguồn tham chiếu ở Mục 7.

### 2.1. Đối tượng kiểm thử, thành phần phụ thuộc và Test Double

- **SUT (System Under Test) và DOC (Depended-On Component):** Theo Meszaros (2007), *SUT* là hệ thống/đơn vị đang được kiểm thử; *DOC* là thành phần mà SUT phụ thuộc vào. Trong dự án, SUT là từng lớp `*ServiceImpl`; DOC là Repository, `EmailService`, `PaymentService`, `JwtTokenProvider`... Kỹ thuật Mocking chỉ thay thế **DOC**, không thay SUT.
- **Test Double:** Meszaros (2007) đặt ra thuật ngữ *Test Double* — "đối tượng thay thế" đứng vào vị trí DOC trong lúc kiểm thử. Ông phân biệt **5 loại**: Dummy, Fake, Stub, Spy, Mock. Bộ test dự án sử dụng chủ yếu **Stub** (dạy `given(...).willReturn(...)` để SUT nhận dữ liệu mong muốn) và **Mock** (kiểm chứng tương tác bằng `then().should()`), ngoài ra **Spy**/`ArgumentCaptor` để bắt đối tượng truyền vào.
- **Behavior Verification (kiểm chứng hành vi):** Fowler (2007) phân biệt *State Verification* (kiểm tra **kết quả**) và *Behavior Verification* (kiểm tra **tương tác** — SUT có gọi DOC đúng/đủ/sai số lần hay không). Mock object sinh ra để phục vụ Behavior Verification; Stub phục vụ State Verification. Bộ test dùng cả hai: AssertJ để kiểm kết quả, Mockito `verify`/`then().should()` để kiểm tương tác.
- **Cơ chế Dependency Injection hỗ trợ Mocking:** vì mọi dependency của `*ServiceImpl` được inject qua constructor (`@RequiredArgsConstructor`), Mockito có thể thay thế toàn bộ bằng `@Mock` và "bơm" vào SUT qua `@InjectMocks`.

### 2.2. Mẫu tổ chức một test case

- **Four Phase Test:** Meszaros (2007) chuẩn hóa một test case thành 4 pha: *fixture setup → exercise SUT → verify results → teardown*. Mẫu **Arrange–Act–Assert (AAA)** là dạng phổ biến của cùng ý tưởng: dựng dữ liệu/mock (Arrange) → gọi method (Act) → kiểm kết quả (Assert).
- **Given–When–Then:** North (2006) đề xuất cấu trúc BDD; BDDMockito của Mockito (`given(...).willReturn(...)` — `then(...).should(...)`) là ánh xạ trực tiếp của Given–When–Then vào API kiểm thử.
- Trong dự án, mỗi test được viết theo **Arrange → Act → Assert → Verify** bằng **BDDMockito thuần** (`given/willReturn`, `then/should`), có thêm pha **Verify** để kiểm chứng tương tác — tương ứng pha "verify results" của Four Phase Test.

### 2.3. Ba đường dẫn kiểm thử (Happy path – Edge case – Exception path)

Việc phân loại test case theo ba đường dẫn dựa trên các kỹ thuật thiết kế kiểm thử phổ biến:

| Đường dẫn | Ký hiệu | Cơ sở lý thuyết | Định nghĩa áp dụng cho bộ test |
|---|:--:|---|---|
| **Happy path** | HP | **Positive testing** (ISTQB, 2023 — kiểm thử với dữ liệu hợp lệ để xác nhận hành vi mong đợi) | Luồng nghiệp vụ thành công với dữ liệu hợp lệ; mock trả giá trị chuẩn để kiểm tra logic xử lý chính. |
| **Edge case** | ED | **Boundary Value Analysis** (Myers et al., 2011) + **Equivalence Partitioning** (ISTQB, 2023) — tập trung vào giá trị biên của các miền dữ liệu | Đầu vào/trạng thái biên: 0, âm, null, rỗng, đúng ngưỡng, vượt ngưỡng, trùng lặp, hết hạn, không tìm thấy. Hệ thống phải xử lý **an toàn** (giá trị biên, silent no-op, cờ trạng thái) — không ném ngoại lệ ngoài dự kiến. |
| **Exception path** | EX | **Negative testing** (ISTQB, 2023) + **Error guessing** (ISTQB, 2023, kỹ thuật dựa trên kinh nghiệm) | Ngoại lệ được kỳ vọng: DOC lỗi (`willThrow`) hoặc vi phạm quy tắc nghiệp vụ dẫn tới ném exception; yêu cầu **fail-fast** (không phát sinh side-effect). |

Ngoài ra, **State Transition Testing** (ISTQB, 2023) được áp dụng cho "máy trạng thái" của đơn hàng (`PENDING → CONFIRMED → ASSIGNED → IN_TRANSIT → DELIVERED / CANCELLED`), thể hiện ở các test cập nhật trạng thái đúng luồng (HP) và sai luồng (EX).

### 2.4. Vai trò của Mocking theo từng đường dẫn

Kỹ thuật Mocking không chỉ giúp "chạy nhanh" mà là **điều kiện để thiết kế được** hai đường dẫn ED và EX: với DOT thật (DB, cổng thanh toán, mail server) rất khó — thậm chí không thể — tạo ra cách ly, có kiểm soát các trạng thái như "email đã tồn tại", "payment trả về false", "token hết hạn". Bảng dưới đây mô tả **kỹ thuật Mockito tương ứng với từng đường dẫn** (đối chiếu Meszaros, 2007 về Stub/Mock và tài liệu Mockito):

| Kỹ thuật Mockito | Happy path | Edge case | Exception path |
|---|:--:|:--:|:--:|
| `given(...).willReturn(value)` (Stub) | ✅ Kết quả chuẩn | ✅ Giá trị biên (0, null, rỗng, hết lượt) | — |
| `given(...).willThrow(exception)` (Exception injection) | — | — | ✅ Lỗi từ DOC |
| `willReturn(false / Optional.empty())` | — | ✅ Trạng thái "không tìm thấy" (silent) | ✅ Thất bại nghiệp vụ/thanh toán |
| `then(mock).should(...)` — times/atLeast/never (Mock) | ✅ Verify luồng đủ bước | ✅ Verify no-op | ✅ Verify fail-fast |
| `then(mock).shouldHaveNoInteractions()` | — | — | ✅ DOC phía sau KHÔNG bị gọi |
| `ArgumentCaptor` | ✅ Bắt object truyền vào | ✅ Kiểm tra field biên | — |
| `InOrder` | ✅ Kiểm tra thứ tự nghiệp vụ | — | — |

---

## 3. Ma trận Test Case chi tiết

> **Chú thích:** tất cả test case trong Mục 3.1–3.14 **đã hiện thực và PASS**. Cột "Mock setup chính" mô tả stub cần dạy cho DOC. Số lượt là số lần JUnit thực thi.

### 3.1. Module Xác thực — `AuthServiceImplTest` (26 TC)

**Dependencies Mock (11):** UserRepository · RoleRepository · CustomerRepository · DriverRepository · RefreshTokenRepository · PasswordEncoder · AuthenticationManager · JwtTokenProvider · OTPService · EmailService · AuditLogService

| Mã TC | Path | Kịch bản | Mock setup chính | Kết quả kỳ vọng |
|---|:--:|---|---|---|
| TC01 | HP | Đăng ký thành công | `existsByEmail→false`, `existsByPhone→false`, `findByName→Role`, `save→user`, authenticate ok, JWT generate | `JwtResponse` (access + refresh), gửi welcome email |
| TC02 | EX | Email trùng lặp | `existsByEmail→true` | `DuplicateResourceException` + fail-fast (`roleRepository` không gọi) |
| TC03 | EX | SĐT trùng lặp | `existsByPhone→true` | `DuplicateResourceException` |
| TC04 | EX | Role không tồn tại | `findByName→empty` | `ResourceNotFoundException` |
| TC05 | HP | ArgumentCaptor — User được save | Mock đầy đủ | Bắt `User` đúng email, password đã encode |
| TC06 | HP | Đăng nhập thành công | `authenticate→auth`, `findByEmail→user active` | `JwtResponse` hợp lệ + audit log `LOGIN` |
| TC07 | EX | Sai mật khẩu | `authenticate` ném `BadCredentialsException` | Ngoại lệ lan truyền (map 401) |
| TC08 | EX | Tài khoản bị vô hiệu hóa | `authenticate→ok`, `isActive=false` | `UnauthorizedException`, không sinh token |
| TC09 | EX | User không tồn tại | authenticate ok, `findByEmail→empty` | `ResourceNotFoundException` |
| TC10 | HP | InOrder — thứ tự gọi | Mock đầy đủ | `authenticate → findByEmail → generateAccessToken` |
| TC11 | HP | Refresh token thành công | `findByTokenAndIsRevokedFalse→stored` (còn hạn) | Cặp token mới + token cũ bị revoke (rotation) |
| TC12 | EX | Refresh token không hợp lệ | `findByToken→empty` | `UnauthorizedException` |
| TC13 | EX | Refresh token hết hạn | stored token `expiresAt` < now | Revoke token + `UnauthorizedException` |
| TC14 | HP | Quên mật khẩu — gửi OTP | `findByEmail→user`, `generateOtp→"123456"` | OTP sinh + gửi email + audit log |
| TC15 | EX | Quên mật khẩu — email không tồn tại | `findByEmail→empty` | `ResourceNotFoundException` |
| TC16 | HP | Reset mật khẩu thành công | `verifyOtp→true` | Password mới encode + save, revoke toàn bộ refresh token |
| TC17 | EX | Reset — OTP sai/hết hạn | `verifyOtp→false` | `BadRequestException` |
| TC18 | HP | Đổi mật khẩu thành công | `matches→true` | Password mới encode + save + audit |
| TC19 | EX | Đổi mật khẩu — sai mật khẩu cũ | `matches→false` | `BadRequestException` |
| TC20 | HP | Logout revoke token | `findByToken→stored` | Token bị revoke + audit `LOGOUT` |
| TC21 | ED | Logout token không tồn tại | `findByToken→empty` | Không ném ngoại lệ (silent no-op) |
| TC22 | HP | Get profile thành công | `findByEmail→user` | `UserResponse` đầy đủ (roles, trạng thái) |
| TC23 | ED | Đăng ký role DRIVER — nhánh tạo hồ sơ Driver | `findByName→ROLE_DRIVER`, save driver profile | User + `Driver` được tạo, **không** tạo `Customer` |
| TC24 | HP | Cập nhật hồ sơ — đủ 3 trường (tên, SĐT, avatar) | `findByEmail→user`, `existsByPhone→false` | 3 trường được lưu + audit log cập nhật |
| TC25 | EX | Cập nhật — SĐT trùng người khác | `existsByPhone→true` | `DuplicateResourceException` + fail-fast (không save/audit) |
| TC26 | EX | Cập nhật — user không tồn tại | `findByEmail→empty` | `ResourceNotFoundException`, không save |

### 3.2. Module Quản lý đơn hàng — `OrderServiceImplTest` (17 TC)

**Dependencies Mock (10 — lớp phức tạp nhất):** OrderRepository · CustomerRepository · DriverRepository · OrderHistoryRepository · PaymentService · PricingService · NotificationService · VoucherService · DistanceService · AuditLogService

| Mã TC | Path | Kịch bản | Mock setup chính | Kết quả kỳ vọng |
|---|:--:|---|---|---|
| ORD-01 | HP | Tạo đơn thành công | `findAll→[customer]`, `calculateDistance→5.0`, pricing chain, payment ok, `save→order` | `OrderResponse` `status=PENDING`, mã `SPD...`; gọi đủ pricing → payment → notification → audit |
| ORD-02 | EX | Customer không tồn tại | `customerRepository.findAll→[]` | `ResourceNotFoundException` |
| ORD-03 | HP | Tạo đơn với voucher | `validateVoucher→voucher`, `applyVoucher→5.000₫` | `totalPrice` = giá gốc − discount; đơn lưu kèm voucher |
| ORD-04 | HP | ArgumentCaptor — Order được save | Mock đầy đủ | Bắt `Order` đúng: customer, địa chỉ, `status=PENDING`, phí |
| ORD-05 | HP | Lấy đơn theo ID | `findById→order` | `OrderResponse` khớp dữ liệu |
| ORD-06 | EX | Lấy đơn theo ID — không tìm thấy | `findById→empty` | `ResourceNotFoundException` |
| ORD-07 | HP | Lấy đơn theo mã code | `findByOrderCode→order` | `OrderResponse` khớp dữ liệu |
| ORD-08 | HP | Danh sách đơn của customer (phân trang) | `findByCustomerId...→PageImpl` | `Page<OrderResponse>` đúng số lượng |
| ORD-09 | HP | Gán tài xế thành công | order `PENDING`, `driver available=true` | Đơn chuyển `ASSIGNED`; driver `BUSY`/`isAvailable=false` |
| ORD-10 | EX | Gán tài xế — đơn sai trạng thái | order `DELIVERED` | `BadRequestException` |
| ORD-11 | EX | Gán tài xế — driver không khả dụng | `isAvailable=false` | `BadRequestException`, không gán |
| ORD-12 | HP | Gán tài xế — verify thông báo 2 bên | Mock đầy đủ | `sendOrderNotification` gọi cho **cả** customer và driver |
| ORD-13 | HP | Cập nhật PENDING → CONFIRMED | `findById`, `save` | Trạng thái đổi + ghi `OrderHistory` |
| ORD-14 | HP | Cập nhật IN_TRANSIT → DELIVERED | driver gắn đơn | Driver `totalDeliveries +1`, cộng `driverEarning`, về `ONLINE`/available |
| ORD-15 | EX | Chuyển trạng thái sai luồng (DELIVERED → PENDING) | — | `BadRequestException` (máy trạng thái chặt) |
| ORD-16 | HP | Hủy đơn thành công | `findById`, driver gắn đơn | Đơn `CANCELLED`, driver giải phóng, `refundPayment` gọi, thông báo "hủy" |
| ORD-17 | EX | Hủy đơn đã giao — thất bại | order `DELIVERED` | `BadRequestException` + `refundPayment` **never** |

### 3.3. Module Thanh toán — `PaymentServiceImplTest` (10 TC)

**Dependencies Mock (2):** PaymentRepository · OrderRepository

| Mã TC | Path | Kịch bản | Mock setup chính | Kết quả kỳ vọng |
|---|:--:|---|---|---|
| PM-TC01 | HP | Thanh toán CASH thành công | `findById→order`, `save→payment` | `status=PENDING`, `paidAt=null`, return `true` |
| PM-TC02 | HP | Thanh toán online (BANK_TRANSFER) | order hợp lệ | `status=COMPLETED`, `paidAt != null`, có `transactionId` |
| PM-TC03 | EX | Order không tồn tại | `findById→empty` | `ResourceNotFoundException` |
| PM-TC04 | EX | Amount = null | order hợp lệ | `PaymentFailedException` |
| PM-TC05 | EX | Amount ≤ 0 (−1000 / 0) | order hợp lệ | `PaymentFailedException` |
| PM-TC06 | HP | ArgumentCaptor — Payment được save | Mock đầy đủ | Payment đúng order, amount, method |
| PM-TC07 | HP | Hoàn tiền thành công | `findByOrderId→payment` | `status=REFUNDED`, return `true` |
| PM-TC08 | ED | Hoàn tiền — không tìm thấy Payment | `findByOrderId→empty` | Return `false` (silent) |
| PM-TC09 | HP | Trạng thái thanh toán — tìm thấy | payment `COMPLETED` | Return `"COMPLETED"` |
| PM-TC10 | ED | Trạng thái thanh toán — không tìm thấy | `findByOrderId→empty` | Return `"NOT_FOUND"` (không ném) |

### 3.4. Module Voucher — `VoucherServiceImplTest` (18 TC)

**Dependencies Mock (1):** VoucherRepository

| Mã TC | Path | Kịch bản | Mock setup chính | Kết quả kỳ vọng |
|---|:--:|---|---|---|
| VOU-01 | HP | Validate voucher hợp lệ | active, trong hạn, còn lượt, đủ min | Trả về voucher |
| VOU-02 | EX | Voucher không tồn tại | `findByCode→empty` | `ResourceNotFoundException` |
| VOU-03 | EX | Voucher bị vô hiệu hóa | `isActive=false` | `BadRequestException` |
| VOU-04 | EX | Voucher hết hạn | `endDate` < now | `VoucherExpiredException` |
| VOU-05 | EX | Voucher chưa có hiệu lực | `startDate` > now | `VoucherExpiredException` |
| VOU-06 | EX | Voucher hết lượt sử dụng | `usedCount >= usageLimit` | `BadRequestException` |
| VOU-07 | EX | Giá trị đơn < mức tối thiểu | `orderValue < minOrderValue` | `BadRequestException` |
| VOU-08 | HP | Áp voucher % bình thường | PERCENTAGE, không vượt max | Discount = value% × orderValue |
| VOU-09 | ED | Áp voucher % — chạm trần maxDiscount | Discount tính ra > maxDiscount | Discount **cap = maxDiscount** |
| VOU-10 | HP | Áp voucher số tiền cố định (FIXED) | `DiscountType.FIXED` | Discount = discountValue |
| VOU-11 | HP | Lấy danh sách voucher đang hoạt động | `findActiveVouchers` | Danh sách voucher active |
| VOU-12 | HP | Tạo voucher thành công | `findByCode→empty`, `save→voucher` | Voucher được lưu |
| VOU-13 | EX | Tạo voucher — mã đã tồn tại | `findByCode→existing` | `BadRequestException` |
| VOU-14 | HP | Lấy voucher theo ID thành công | `findById→voucher` | `VoucherResponse` khớp dữ liệu |
| VOU-15 | EX | Lấy theo ID — không tồn tại | `findById→empty` | `ResourceNotFoundException` |
| VOU-16 | HP | Lấy toàn bộ voucher | `findAll→list` | Danh sách voucher đầy đủ |
| VOU-17 | HP | Toggle — đang hoạt động → vô hiệu hóa | `isActive=true` | `isActive=false` + save |
| VOU-18 | HP | Toggle — đang vô hiệu → kích hoạt lại | `isActive=false` | `isActive=true` + save |

### 3.5. Module Tính giá — `PricingServiceImplTest` (16 method / 22 lượt)

**Dependencies Mock:** **KHÔNG** — lớp thuần logic, test trực tiếp (minh họa trường hợp **không cần Mocking**, tránh over-mocking). Dùng `@ParameterizedTest` + `@CsvSource`.

| Mã TC | Path | Kịch bản | Dữ liệu vào | Kết quả kỳ vọng |
|---|:--:|---|---|---|
| PRI-01 | HP | Base price cố định | — | 15.000₫ |
| PRI-02 | ED | Khoảng cách 0 km | `0.0` | 0₫ |
| PRI-03 | HP | Khoảng cách 1 km | `1.0` | 5.000₫ |
| PRI-04 | HP | Bảng khoảng cách (parameterized, 4 lượt) | 2 / 5 / 10 / 0.5 km | 10k / 25k / 50k / 2.5k |
| PRI-05 | ED | Weight = null | `null` | Phụ phí 0₫ (xử lý an toàn) |
| PRI-06 | ED | Weight ≤ 5 kg | 3 kg | Phụ phí 0₫ |
| PRI-07 | ED | Weight = 5 kg (đúng biên) | 5 kg | Phụ phí 0₫ (chưa vượt ngưỡng) |
| PRI-08 | HP | Weight = 6 kg (vượt 1 kg) | 6 kg | 3.000₫ |
| PRI-09 | HP | Weight = 10 kg (vượt 5 kg) | 10 kg | 15.000₫ |
| PRI-10 | ED⇄HP | Bảng phụ phí (parameterized, 4 lượt) | 5.1 kg / 7 / 15 / 20 | 300₫ / 6k / 30k / 45k (5.1 = biên vừa vượt) |
| PRI-11 | HP | Tổng giá đơn thường | 5 km, 2 kg | 40.000₫ (15k + 25k + 0) |
| PRI-12 | HP | Tổng giá đơn nặng | 10 km, 8 kg | 74.000₫ (15k + 50k + 9k) |
| PRI-13 | ED | Tổng giá biên thấp nhất | 0 km, 0 kg | 15.000₫ (chỉ base price) |
| PRI-14 | HP | Thu nhập tài xế 80% | 40.000₫ | 32.000₫ |
| PRI-15 | ED | Thu nhập với giá 0 | 0₫ | 0₫ |
| PRI-16 | HP | Thu nhập đơn lớn | 100.000₫ | 80.000₫ |

### 3.6. Module Khoảng cách — `DistanceServiceImplTest` (9 method / 10 lượt)

**Dependencies Mock:** **KHÔNG** — thuần toán học (công thức Haversine).

| Mã TC | Path | Kịch bản | Kết quả kỳ vọng |
|---|:--:|---|---|
| DIS-01 | ED | 2 điểm trùng nhau | Khoảng cách = 0 km |
| DIS-02 | HP | Q.1 → Q.3 (TP.HCM) | ~3–4 km |
| DIS-03 | HP | HCM → Hà Nội | ~1.200 km (sai số cho phép) |
| DIS-04 | HP | Parameterized ~111 km/degree (2 lượt) | ≈ 111.19 km mỗi độ vĩ |
| DIS-05 | HP | Ước lượng thời gian 25 km | ~60 phút |
| DIS-06 | HP | Ước lượng thời gian 5 km | ~12 phút |
| DIS-07 | ED | Ước lượng thời gian 0 km | 0 phút |
| DIS-08 | HP | Khoảng cách luôn dương (A≠B) | > 0 |
| DIS-09 | HP | Đối xứng A→B = B→A | 2 chiều bằng nhau |

### 3.7. Module Khách hàng — `CustomerServiceImplTest` (12 TC)

**Dependencies Mock (4):** UserRepository · CustomerRepository · AddressRepository · AuditLogService

| Mã TC | Path | Kịch bản | Mock setup chính | Kết quả kỳ vọng |
|---|:--:|---|---|---|
| CS-TC01 | HP | Lấy profile thành công | `findByEmail→user` | `UserResponse` đầy đủ |
| CS-TC02 | EX | Lấy profile — user không tồn tại | `findByEmail→empty` | `ResourceNotFoundException` |
| CS-TC03 | HP | Cập nhật profile (fullName) | `save→user` | Tên mới được lưu + audit log |
| CS-TC04 | EX | Cập nhật SĐT trùng người khác | `existsByPhone→true` | `DuplicateResourceException` |
| CS-TC05 | HP | Lấy danh sách địa chỉ | `findByCustomerId...→list` | Danh sách `AddressResponse`, default lên đầu |
| CS-TC06 | HP | Thêm địa chỉ mới | `save→address` (ArgumentCaptor) | Address đúng customer, lưu thành công |
| CS-TC07 | HP | Thêm địa chỉ mặc định — reset địa chỉ cũ | list có default cũ | Địa chỉ cũ `isDefault=false`, địa chỉ mới `true` |
| CS-TC08 | HP | Cập nhật địa chỉ thành công | `findById→address đúng chủ` | Field cập nhật + save |
| CS-TC09 | EX | Cập nhật địa chỉ của customer khác | `findById→address chủ khác` | `BadRequestException` + `save` **never** |
| CS-TC10 | HP | Xóa địa chỉ thành công | đúng chủ | `delete` gọi đúng 1 lần |
| CS-TC11 | EX | Xóa địa chỉ của customer khác | chủ khác | `BadRequestException` + `delete` **never** |
| CS-TC12 | HP | Đặt địa chỉ mặc định | `findById`, list cũ | Reset default cũ + set default mới, cả 2 đều save |

### 3.8. Module Tài xế — `DriverServiceImplTest` (18 TC)

**Dependencies Mock (5):** DriverRepository · OrderRepository · OrderService · NotificationService · AuditLogService

| Mã TC | Path | Kịch bản | Mock setup chính | Kết quả kỳ vọng |
|---|:--:|---|---|---|
| DR-TC01 | HP | Bật trạng thái khả dụng | `findById→driver` (OFFLINE) | `status=ONLINE`, `isAvailable=true` + audit |
| DR-TC02 | HP | Tắt trạng thái khả dụng | driver đang ONLINE | `status=OFFLINE`, `isAvailable=false` |
| DR-TC03 | EX | Toggle — driver không tồn tại | `findById→empty` | `ResourceNotFoundException` |
| DR-TC04 | HP | Nhận đơn thành công | driver available | Delegate sang `orderService.assignDriver` (verify gọi đúng) |
| DR-TC05 | EX | Nhận đơn — tài xế không khả dụng | `isAvailable=false` | `BadRequestException` + không delegate |
| DR-TC06 | HP | Từ chối đơn hàng | driver + order hợp lệ | Audit `REJECT_ORDER` + gửi thông báo cho customer |
| DR-TC07 | HP | Hoàn thành giao hàng | order `IN_TRANSIT` thuộc driver | Delegate `updateOrderStatus(..., "DELIVERED", ...)` |
| DR-TC08 | EX | Hoàn thành — đơn không thuộc driver | order của driver khác | `BadRequestException` |
| DR-TC09 | EX | Hoàn thành — đơn chưa đang giao | order `ASSIGNED` | `BadRequestException` |
| DR-TC10 | HP | Lịch sử giao hàng | `findById` ok | Delegate `orderService.getDriverOrders` |
| DR-TC11 | HP | Lấy thu nhập tài xế | `totalEarnings→800.000₫` | Trả đúng số tiền |
| DR-TC12 | EX | Thu nhập — driver không tồn tại | `findById→empty` | `ResourceNotFoundException` |
| DR-TC13 | HP | Lấy hồ sơ tài xế thành công | `findById→driver` | `DriverResponse` map đủ trường |
| DR-TC14 | EX | Hồ sơ — driver không tồn tại | `findById→empty` | `ResourceNotFoundException` |
| DR-TC15 | EX | Nhận đơn — driver không tồn tại | `findById→empty` | `ResourceNotFoundException` |
| DR-TC16 | EX | Hoàn thành giao hàng — driver không tồn tại | `findById→empty` | `ResourceNotFoundException` |
| DR-TC17 | EX | Lịch sử giao hàng — driver không tồn tại | `findById→empty` | `ResourceNotFoundException` |
| DR-TC18 | EX | Từ chối đơn — đơn không tồn tại | `orderRepository.findById→empty` | `ResourceNotFoundException` |

### 3.9. Module Quản trị — `AdminServiceImplTest` (10 TC)

**Dependencies Mock (5):** UserRepository · CustomerRepository · DriverRepository · OrderRepository · AuditLogService

| Mã TC | Path | Kịch bản | Mock setup chính | Kết quả kỳ vọng |
|---|:--:|---|---|---|
| AD-TC01 | HP | Dashboard — dữ liệu bình thường | count 50/30/10, revenue 5M, countByStatus | `DashboardResponse` đầy đủ 8 chỉ số |
| AD-TC02 | ED | Dashboard — revenue trả `null` | `calculateRevenueAfter→null` | Fallback `BigDecimal.ZERO` (không NPE) |
| AD-TC03 | HP | Danh sách users phân trang | `findAll(pageable)→PageImpl` | `Page<UserResponse>` đúng dữ liệu |
| AD-TC04 | HP | Lấy user theo ID | `findById→user` | `UserResponse` khớp |
| AD-TC05 | EX | User không tìm thấy | `findById→empty` | `ResourceNotFoundException` |
| AD-TC06 | HP | Kích hoạt tài khoản | `save→user` (ArgumentCaptor) | `isActive=true` + audit "activated" |
| AD-TC07 | HP | Vô hiệu hóa tài khoản | `save→user` | `isActive=false` + audit "deactivated" |
| AD-TC08 | EX | Toggle — user không tồn tại | `findById→empty` | `ResourceNotFoundException` + `save`/audit **never** |
| AD-TC09 | HP | Xóa user thành công | `findById→user` | `delete` gọi 1 lần + audit |
| AD-TC10 | EX | Xóa user — không tồn tại | `findById→empty` | `ResourceNotFoundException` + `delete`/audit **never** |

### 3.10. Module Thông báo — `NotificationServiceImplTest` (7 TC)

**Dependencies Mock (1):** NotificationRepository

| Mã TC | Path | Kịch bản | Mock setup chính | Kết quả kỳ vọng |
|---|:--:|---|---|---|
| NF-TC01 | HP | Gửi notification thường | `save→notification` | Notification lưu với `isRead=false` |
| NF-TC02 | HP | Gửi order notification | `save→notification` | `type=ORDER`, `referenceId=orderId` |
| NF-TC03 | HP | ArgumentCaptor — nội dung chính xác | Mock đầy đủ | Title/message/userId khớp dữ liệu vào |
| NF-TC04 | HP | Lấy notifications (phân trang) | `findByUserId...→PageImpl` | Danh sách `NotificationResponse` |
| NF-TC05 | HP | Đánh dấu đã đọc | `findById→notification` | `isRead=true` + save |
| NF-TC06 | ED | Đánh dấu — không tìm thấy | `findById→empty` | Silent no-op (không ném, không save) |
| NF-TC07 | HP | Đếm chưa đọc | `countBy...→5` | Trả `5` |

### 3.11. Module Đánh giá — `ReviewServiceImplTest` (7 TC)

**Dependencies Mock (5):** ReviewRepository · OrderRepository · CustomerRepository · DriverRepository · AuditLogService

| Mã TC | Path | Kịch bản | Mock setup chính | Kết quả kỳ vọng |
|---|:--:|---|---|---|
| RV-TC01 | HP | Đánh giá 5 sao thành công | order `DELIVERED`, đúng chủ, driver gắn, `exists→false` | Review lưu + cập nhật rating TB driver (HALF_UP 2 chữ số) |
| RV-TC02 | EX | Rating ngoài khoảng 1–5 | rating = 0 / 6 | `BadRequestException` |
| RV-TC03 | EX | Đánh giá trùng đơn | `existsByOrderId→true` | `BadRequestException` |
| RV-TC04 | EX | Đơn chưa giao | order `IN_TRANSIT` | `BadRequestException` |
| RV-TC05 | EX | Đơn không thuộc customer | chủ đơn khác | `BadRequestException` |
| RV-TC06 | HP | Lấy review theo orderId | `findByOrderId→review` | `ReviewResponse` khớp |
| RV-TC07 | EX | Review không tìm thấy | `findByOrderId→empty` | `ResourceNotFoundException` |

### 3.12. Module Bảo mật & Smoke

**`JwtTokenProviderTest` (10 TC)** — dependencies Mock: KHÔNG (sinh/verify token thật với secret test)

| Mã TC | Path | Kịch bản | Kết quả kỳ vọng |
|---|:--:|---|---|
| JWT-01 | HP | Tạo access token từ email | Token non-null, verify được |
| JWT-02 | HP | Tạo access token từ `Authentication` | Token non-null |
| JWT-03 | HP | Tạo refresh token | Token non-null |
| JWT-04 | HP | Access ≠ Refresh token | 2 token khác nhau |
| JWT-05 | HP | Token hợp lệ → `validateToken=true` | true |
| JWT-06 | ED | Token sai format | `false` (bắt `MalformedJwtException`) |
| JWT-07 | ED | Token rỗng | `false` (bắt `IllegalArgumentException`) |
| JWT-08 | HP | Extract email từ token | Đúng email |
| JWT-09 | HP | Extract giữ nguyên giá trị gốc | Khớp 100% |
| JWT-10 | HP | `getRefreshTokenExpirationMs` | Trả đúng cấu hình 604.800.000 ms |

**`CustomUserDetailsServiceTest` (5 TC)** — dependencies Mock (1): UserRepository

| Mã TC | Path | Kịch bản | Kết quả kỳ vọng |
|---|:--:|---|---|
| UD-TC01 | HP | Load user thành công | `enabled=true`, authority = `ROLE_ADMIN` |
| UD-TC02 | ED | Tài khoản bị khóa | `disabled=true` (không ném) |
| UD-TC03 | EX | User không tồn tại | `UsernameNotFoundException` |
| UD-TC04 | HP | User nhiều roles | Authorities chứa cả 2 role |
| UD-TC05 | HP | Verify repository chỉ gọi 1 lần | Không side-effect thừa |

**`SpeedApplicationTest` (1 TC)** — Smoke test kiểm tra lớp ứng dụng load được.

### 3.13. Tổng hợp độ phủ 3 đường dẫn (189 lượt chạy thực tế — đo lại 18/10/2026)

| Module (Test class) | HP | ED | EX | Tổng | Ghi chú |
|---|:--:|:--:|:--:|:--:|---|
| AuthServiceImplTest | 11 | 2 | 13 | 26 | EX mạnh nhất (xác thực) |
| OrderServiceImplTest | 11 | 0 | 6 | 17 | Thiếu ED (xem 3.15.A) |
| PaymentServiceImplTest | 5 | 2 | 3 | 10 | |
| VoucherServiceImplTest | 9 | 1 | 8 | 18 | +5 TC quản lý voucher (18/10) |
| PricingServiceImplTest | 15 | 7 | 0 | 22 | Thuần logic — ED phong phú |
| DistanceServiceImplTest | 8 | 2 | 0 | 10 | Thuần toán học |
| CustomerServiceImplTest | 8 | 0 | 4 | 12 | Thiếu ED (xem 3.15.A) |
| DriverServiceImplTest | 8 | 0 | 10 | 18 | Thiếu ED (xem 3.15.A) |
| AdminServiceImplTest | 6 | 1 | 3 | 10 | |
| NotificationServiceImplTest | 6 | 1 | 0 | 7 | |
| ReviewServiceImplTest | 2 | 0 | 5 | 7 | |
| WalletServiceImplTest | 4 | 2 | 10 | 16 | Lớp mới (18/10) — nhiều nhánh lỗi biên |
| JwtTokenProviderTest | 8 | 2 | 0 | 10 | |
| CustomUserDetailsServiceTest | 3 | 1 | 1 | 5 | |
| SpeedApplicationTest | 1 | 0 | 0 | 1 | Smoke |
| **TỔNG (lượt)** | **105** | **21** | **63** | **189** | |
| **Tỷ lệ** | **55,6%** | **11,1%** | **33,3%** | 100% | |

**Nhận xét:** bộ test hiện tại mạnh về **HP (55,6%)** và **EX (33,3%)** — đặc trưng của kỹ thuật Mocking (giả lập lỗi DOC). Đường dẫn **ED (11,1%)** tập trung chủ yếu ở các lớp thuần logic (Pricing, Distance) và các xử lý biên/null (Wallet tự tạo ví, JWT token sai định dạng, logout token không tồn tại); các module nghiệp vụ Order/Customer/Driver **cần bổ sung ED** để cân bằng ma trận — thiết kế tại 3.15.A.

### 3.14. Module Ví tài xế — `WalletServiceImplTest` (16 TC — bổ sung 18/10/2026)

**Dependencies Mock (3):** WalletRepository · TransactionRepository · DriverRepository

| Mã TC | Path | Kịch bản | Mock setup chính | Kết quả kỳ vọng |
|---|:--:|---|---|---|
| WL-TC01 | HP | Lấy ví thành công — ví đã tồn tại | `findById(driver)→driver`, `findByDriverId→wallet` | `WalletResponse` map đúng chủ/số dư; **không** tạo ví mới |
| WL-TC02 | ED | Chưa có ví → tự tạo ví số dư 0 (nhánh `orElseGet`) | `findByDriverId→empty`, `save→wallet mới` | Ví mới `balance=0` được save (ArgumentCaptor kiểm tra nội dung) |
| WL-TC03 | EX | Driver không tồn tại | `findById→empty` | `ResourceNotFoundException` + `walletRepository` **không bị chạm** |
| WL-TC04 | HP | Cộng thu nhập thành công | ví tồn tại, `save→wallet` | Số dư 500.000 + 32.000 = 532.000; Transaction `EARNING` đúng order/description |
| WL-TC05 | EX | Amount = null | — | `BadRequestException` + cả 3 repository **never** |
| WL-TC06 | EX | Amount = 0 | — | `BadRequestException` |
| WL-TC07 | EX | Amount âm (−1.000) | — | `BadRequestException` |
| WL-TC08 | EX | Cộng thu nhập — driver không tồn tại | `findById→empty` | `ResourceNotFoundException`; không lưu giao dịch |
| WL-TC09 | ED | Cộng thu nhập — ví chưa tồn tại → tự tạo rồi cộng | `findByDriverId→empty` | `save()` gọi 2 lần (tạo ví + cập nhật) + 1 transaction |
| WL-TC10 | HP | Lịch sử giao dịch (phân trang) | `findByWalletId...→PageImpl` | `Page<TransactionResponse>`; orderId null khi giao dịch không gắn đơn |
| WL-TC11 | EX | Lịch sử — chưa có ví | `findByDriverId→empty` | `ResourceNotFoundException` |
| WL-TC12 | HP | Rút tiền thành công | ví đủ số dư | Số dư 500.000 − 100.000 = 400.000 + Transaction `WITHDRAWAL` |
| WL-TC13 | EX | Rút tiền — amount null | — | `BadRequestException` |
| WL-TC14 | EX | Rút tiền — amount ≤ 0 | −50.000 | `BadRequestException` |
| WL-TC15 | EX | Rút tiền — chưa có ví | `findByDriverId→empty` | `ResourceNotFoundException` |
| WL-TC16 | EX | Số dư không đủ | balance 500.000, rút 600.000 | `BadRequestException`; số dư giữ nguyên, không save |

> Module này trước đây chỉ nằm trong **thiết kế bổ sung** (WAL-TC01..09 — xem 3.15.B). Ngày 18/10/2026 được hiện thực đầy đủ thành **16 TC** (vượt 9 TC dự kiến), độ phủ đạt **line 71/71 = 100%**, **branch 12/12 = 100%**.

### 3.15. Thiết kế bổ sung

Phần dưới đây là **thiết kế sẵn sàng triển khai** — đối chiếu trực tiếp với mã nguồn thật của các lớp tương ứng, không phải kịch bản giả định.

**A. Test case ED/EX bổ sung cho module hiện có:**

| Mã TC | Module | Path | Kịch bản | Mock setup | Kỳ vọng |
|---|---|---|---|---|---|
| ORD-ED-01 | Order | ED | Tạo đơn không truyền tọa độ (distance = 0) | request lat/lng = null | Bỏ qua `distanceService` (0 tương tác), phí khoảng cách = 0 |
| ORD-ED-02 | Order | ED | Voucher giảm vượt tổng tiền | `applyVoucher→lớn hơn total` | `totalPrice` bị kẹp về 0 (nhánh clamp) |
| ORD-ED-03 | Order | ED | `paymentMethod` null | request null | Mặc định CASH, xử lý thanh toán bình thường |
| AUTH-ED-01 | Auth | ED | `refreshToken` trong body là null | request null | Xử lý an toàn, không NPE |
| CS-ED-01 | Customer | ED | Cập nhật SĐT giữ nguyên giá trị cũ | `existsByPhone→true` + trùng chính user | Cho phép (không báo trùng chính mình) |
| DR-ED-01 | Driver | ED | Toggle driver đang BUSY | driver status = BUSY | Chuyển theo tham số, không lỗi |
| PM-ED-01 | Payment | ED | Amount = 0.01 (biên nhỏ nhất hợp lệ) | order hợp lệ | Thanh toán thành công (chốt ngưỡng > 0) |
| NF-EX-01 | Notification | EX | `save` ném `DataAccessException` | `willThrow` | Ngoại lệ lan truyền (kiểm tra fail-fast) |
| JWT-EX-01 | JWT | EX | Token sai chữ ký (secret khác) | Token ký bằng secret khác | `validateToken=false` (`SignatureException` bị bắt) |
| JWT-ED-01 | JWT | ED | Token hết hạn | Token expiration âm | `validateToken=false` (`ExpiredJwtException` bị bắt) |

**B. Các module chưa có test — thiết kế ma trận mới** (đối chiếu mã nguồn `AuditLogServiceImpl`, `OTPServiceImpl`; `WalletServiceImpl` **đã hiện thực đầy đủ ngày 18/10/2026** — ma trận triển khai thực tế gồm 16 TC tại 3.14):

> **WalletServiceImpl — đã hiện thực:** thiết kế ban đầu 9 TC (WAL-TC01..09) đã được triển khai và mở rộng thành **16 TC** (WL-TC01..16 — ma trận tại 3.14); độ phủ đạt **line 71/71 = 100%**, **branch 12/12 = 100%**.

| Mã TC | Module | Path | Kịch bản | Mock setup | Kỳ vọng |
|---|---|---|---|---|---|
| AUD-TC01 | AuditLog | HP | Ghi log đầy đủ 5 tham số | `save→log` (ArgumentCaptor) | Log lưu đúng action/entity/details |
| AUD-TC02 | AuditLog | HP | Ghi log rút gọn (2 tham số) | `save→log` | Log lưu đúng, userId null |
| AUD-TC03 | AuditLog | HP | Lấy toàn bộ log phân trang | `findAllBy...→PageImpl` | `Page<LogResponse>` |
| AUD-TC04 | AuditLog | HP | Lấy log theo user | `findByUserId...→PageImpl` | Chỉ log của user đó |
| OTP-TC01 | OTP | HP | Sinh OTP | `save→otpCode` | Chuỗi 6 chữ số, hết hạn +5 phút, `isUsed=false` |
| OTP-TC02 | OTP | HP | Verify OTP đúng & còn hạn | `findTop...→otpCode` | `true` + đánh dấu `isUsed=true` |
| OTP-TC03 | OTP | ED | Verify OTP sai mã | otpCode khác | `false`, không đánh dấu used |
| OTP-TC04 | OTP | ED | Verify OTP hết hạn | `expiresAt` < now | `false` |
| OTP-TC05 | OTP | ED | Verify khi không có OTP nào | `findTop...→empty` | `false` |

> **Ghi chú hiện thực:** theo đúng template hiện có (`@ExtendWith(MockitoExtension.class)`, `@Mock`/`@InjectMocks`, BDDMockito, pattern AAA), đặt tên file `AuditLogServiceImplTest`, `OTPServiceImplTest`. Riêng `WalletServiceImplTest` **đã hoàn thành** ngày 18/10/2026 (16 TC).

---

## 4. Tiêu chí đo lường

Ba tiêu chí dưới đây được trình bày theo một cấu trúc thống nhất:
**Cơ sở lý thuyết → Định nghĩa → Công thức & công cụ đo → Ngưỡng chấp nhận → Kết quả thực đo → Đánh giá.**

---

### 4.1. Tiêu chí 1 — Thời gian chạy (Execution Time)

#### 4.1.1. Cơ sở lý thuyết

- **Nguyên tắc F (Fast) trong F.I.R.S.T:** Ottinger & Langr (2011) nêu tiêu chuẩn đầu tiên của một unit test tốt là **Fast** — test chạy nhanh để lập trình viên chạy thường xuyên; test chậm sẽ bị bỏ qua.
- **Osherove & Khorikov (2024):** unit test không được chạm vào tài nguyên ngoài (DB, mạng, filesystem) vì như vậy sẽ chậm và phụ thuộc môi trường; kỹ thuật Mocking/Mocking thay các I/O này để test chạy trong thời gian mili-giây.
- **Kaczanowski (2013):** nhấn mạnh lợi ích tốc độ của việc test Service với mock thay vì dựng DB.
- **Fowler (2006) — Continuous Integration:** một trong các thực hành cốt lõi là **"Keep the Build Fast"** — thời gian chạy test quyết định độ trễ phản hồi (feedback loop) của toàn bộ quy trình CI/CD.

Cơ sở lý thuyết không ấn định một con số tuyệt đối; các **ngưỡng chấp nhận** dưới đây do đồ án đề ra dựa trên các nguyên tắc trên, phù hợp điều kiện chạy trên mỗi lần commit.

#### 4.1.2. Công thức và công cụ đo

| Chỉ số | Công thức |
|---|---|
| `ET_class` | Giá trị **"Time elapsed"** của từng test class trong báo cáo Maven Surefire |
| `ET_total` | `Σ ET_class` (tổng thời gian tầng test) |
| `ET_avg` | `ET_total / số lượt test` (thời gian trung bình mỗi lượt) |
| `T_pipeline` | Tổng thời gian lệnh Maven (`mvn test` hoặc `mvn clean verify`; gồm khởi động Maven, kiểm tra biên dịch, Surefire, sinh báo cáo JaCoCo) |

**Công cụ:** Maven Surefire 3.5.2 — báo cáo `target/surefire-reports/*.txt` (dòng `Time elapsed`); log Maven (dòng `Total time`).

**Quy trình:** chạy `mvn test` (hoặc `mvn clean verify` cho vòng đầy đủ) → thu `ET_class` mọi class → cộng tổng và tính trung bình.

#### 4.1.3. Ngưỡng chấp nhận đề ra

| Mã | Tiêu chí | Ngưỡng |
|---|---|---|
| ET-1 | Tổng thời gian tầng test toàn suite (189 lượt) | ≤ 30 giây |
| ET-2 | Trung bình mỗi lượt test | ≤ 200 ms |
| ET-3 | Thời gian mỗi test class (gồm chi phí khởi tạo lần đầu) | ≤ 5 giây |
| ET-4 | Tái lập được: chạy lặp lại đều PASS với cùng kết quả | 100% |

#### 4.1.4. Kết quả thực đo (đo lại 18/10/2026 — bộ 189 lượt + 5 demo)

**Bảng `ET_class` — lần chạy chính thức 189 lượt Unit Test (trong `mvn clean verify` ngày 18/10/2026):**

| Test class | Lượt | ET_class | ET trung bình/lượt |
|---|:--:|--:|--:|
| CustomUserDetailsServiceTest | 5 | 0,092 s | 0,018 s |
| JwtTokenProviderTest | 10 | 0,266 s | 0,027 s |
| AdminServiceImplTest | 10 | 0,333 s | 0,033 s |
| AuthServiceImplTest | 26 | 0,362 s | 0,014 s |
| CustomerServiceImplTest | 12 | 0,292 s | 0,024 s |
| DistanceServiceImplTest | 10 | 0,263 s | 0,026 s |
| DriverServiceImplTest | 18 | 0,423 s | 0,024 s |
| NotificationServiceImplTest | 7 | 0,245 s | 0,035 s |
| OrderServiceImplTest | 17 | 0,901 s | 0,053 s |
| PaymentServiceImplTest | 10 | 0,251 s | 0,025 s |
| PricingServiceImplTest | 22 | 0,136 s | 0,006 s |
| ReviewServiceImplTest | 7 | 0,265 s | 0,038 s |
| VoucherServiceImplTest | 18 | 0,356 s | 0,020 s |
| WalletServiceImplTest | 16 | 0,515 s | 0,032 s |
| SpeedApplicationTest | 1 | 0,021 s | 0,021 s |
| **TỔNG** | **189** | **ET_total = 4,721 s** | **≈ 0,025 s (25 ms)** |

**Các phép đo bổ sung (18/10/2026):**

| Phép đo | Kết quả | Ý nghĩa |
|---|---|---|
| `T_pipeline` — `mvn clean verify` đầy đủ (194 lượt + `jacoco:check` + đóng gói JAR) | **01:44 min (~104 s)** | Toàn bộ vòng CI: clean → compile → test → quality gate → package |
| Tổng thời gian tầng test bộ Unit (Σ ET_class, 189 lượt) | ≈ **4,7 s** | Lớp lâu nhất: OrderServiceImplTest 0,901 s |
| Chạy lẻ 1 class `-Dtest=AuthServiceImplTest` (26 TC) | **26/26 PASS** — 17,099 s toàn lệnh | Bằng chứng độc lập (mục 4.3) |
| Chạy lẻ 1 method `AuthServiceImplTest$RegisterTests#register_Success` | **1/1 PASS** — 14,302 s toàn lệnh | Test đơn lẻ không phụ thuộc test khác |
| Chạy thứ tự ngẫu nhiên (189 lượt) | **189/189 PASS** — 20,554 s toàn lệnh | Độc lập thứ tự (mục 4.3) |

**Bằng chứng đối chứng có/không Mocking** (từ 2 lớp demo trong cùng `mvn clean verify`):

| Phép đo | Mock (`MockingDemoTest`) | Không Mock (`SpringContextDemoTest`, Spring Context + H2 thật) |
|---|---|---|
| 1 lần login | **693,06 μs** (10.000 login = 6,930 s) | **270,60 ms** (10 login = 2,706 s) |
| Chi phí khởi tạo môi trường | 0 (không Spring Context) | **39.654 ms (~39,7 s)** (khởi động Spring Context) |
| Thời gian cả lớp test | 15,54 s | 41,65 s |

→ Một login có Mock nhanh hơn login chạy qua Spring + H2 khoảng **390 lần** (dao động 223×–420× giữa các lần đo do tải máy); chỉ riêng **thời gian khởi động Spring Context (~39,7 s) đã gấp ~8,4 lần tổng thời gian của toàn bộ 189 lượt test Mock (4,7 s)**.

**Lưu ý về độ biến thiên:** `ET_total` phụ thuộc tải máy và trạng thái "nóng/lạnh" của JVM — lần 29/09 ghi nhận 18,1 s khi máy chạy nặng (158 lượt), các lần chạy nóng chỉ ~2,5 s; lần 18/10 trong `mvn clean verify` (2 lớp demo chạy trước, máy bận) là 4,7 s. Tương tự, đối chứng login Mock dao động 204 μs–693 μs giữa các lần đo. Cả hai mức đều **rất nhỏ** so với test tích hợp; vì vậy khi trình bày cần ghi rõ số liệu thuộc lần chạy nào.

#### 4.1.5. Đánh giá

✅ **ĐẠT toàn bộ ET-1 → ET-4:**
- ET-1: `ET_total` = 4,721 s ≤ 30 s ✔ (toàn pipeline `mvn clean verify` ~104 s — bao gồm cả dựng lại dự án, kiểm tra quality gate và đóng gói JAR)
- ET-2: `ET_avg` = 25 ms ≤ 200 ms ✔
- ET-3: class lâu nhất 0,901 s ≤ 5 s ✔
- ET-4: các lần chạy trong buổi đo 18/10 (`mvn clean verify` 194/194; chạy lẻ class 26/26; chạy lẻ method 1/1; thứ tự ngẫu nhiên 189/189) đều **PASS, 0 lỗi** ✔

**Ý nghĩa:** nhờ Mocking thay thế toàn bộ I/O (Database, Email, SMS, Map, Payment), mỗi test chỉ tốn cỡ ~25 ms — trong khi một lần khởi động Spring Context + DB thật cho test tích hợp đã tốn ~39,7 s (gấp ~8,4 lần cả bộ 189 lượt). Bộ test đủ nhanh để chạy ở mọi lần commit (CI).

---

### 4.2. Tiêu chí 2 — Độ bao phủ mã nguồn (Code Coverage)

#### 4.2.1. Cơ sở lý thuyết

- **Myers et al. (2011):** đặt nền móng cho các tiêu chí **độ bao phủ mã nguồn** — *statement coverage* (mọi câu lệnh được thực thi ít nhất một lần) và *branch coverage* (mọi nhánh rẽ của cấu trúc điều khiển được đi qua cả hai hướng). Branch coverage mạnh hơn statement coverage vì nó buộc thiết kế test cho các nhánh điều kiện.
- **Khorikov (2020):** cảnh báo độ bao phủ cao **không** đồng nghĩa test tốt; coi coverage là **"chỉ báo tiêu cực"** (chỉ số thấp chứng tỏ còn phần code chưa được kiểm chứng), không phải chỉ báo tích cực về chất lượng test.
- **JaCoCo (tài liệu chính thức):** định nghĩa các *counter* đo trên bytecode, không đo chất lượng assertion.

#### 4.2.2. Định nghĩa các chỉ số và công cụ

| Chỉ số JaCoCo | Ý nghĩa | Nguyên tắc tính |
|---|---|---|
| **Instruction coverage** | % chỉ dẫn bytecode JVM đã thực thi | `chỉ dẫn phủ / tổng chỉ dẫn × 100%` |
| **Line coverage** | % dòng mã nguồn được thực thi | Dòng được coi là phủ nếu có **ít nhất một** instruction trên dòng đó đã chạy |
| **Branch coverage** | % nhánh điều khiển (`if/else`, `switch`, `&&`, `\|\|`, ternary) đã đi qua | `nhánh phủ / tổng nhánh × 100%` |
| **Method coverage** | % method được gọi | Method được coi là phủ nếu có ít nhất một instruction trong nó đã chạy |

**Công cụ:** JaCoCo 0.8.12 (khai báo trong `pom.xml`, chạy ở phase `test`).
**Phương pháp đo:** `mvn test` / `mvn clean verify` → sinh `target/site/jacoco/index.html` (giao diện) và `target/site/jacoco/jacoco.csv` (số liệu thô); `jacoco:check` xác minh ngưỡng tự động ở phase `verify`.

> ⚠️ **Lưu ý phương pháp:** JaCoCo agent **append** dữ liệu vào `target/jacoco.exec` giữa các lần chạy. Do đó, để đo coverage *chỉ của bộ Unit Test*, phải **xóa `target/jacoco.exec`** rồi chạy đúng tập unit test (nếu không, coverage sẽ bị "trộn" thêm phần của các lớp demo).

#### 4.2.3. Ngưỡng chấp nhận đề ra

| Mã | Tiêu chí | Ngưỡng | Nguồn ngưỡng |
|---|---|---|---|
| CC-1 | Line coverage của **từng lớp Service có test** | ≥ 90% | `pom.xml` (JaCoCo `LINE ≥ 0.90` cho 12 lớp trọng tâm, cấp CLASS) |
| CC-2 | Branch coverage của **từng lớp Service có test** (lớp có nhánh) | ≥ 85% | Đề xuất của đồ án (đo tham khảo) |
| CC-3 | Line coverage **tổng hợp 12 lớp Service đã test** | ≥ 95% | Đề xuất của đồ án |
| CC-4 | Line coverage **toàn dự án** (gồm Controller/Entity/Config — ngoài phạm vi unit test) | ≥ 60% | Đề xuất của đồ án |
| CC-5 | Không còn lớp Service nghiệp vụ nào ở mức **0%** | 0 lớp | Đề xuất của đồ án |

#### 4.2.4. Kết quả thực đo (18/10/2026 — `jacoco.csv` từ `mvn clean verify`; bộ 189 lượt + 5 lượt demo đối chứng)

**Tổng quan:**

| Phạm vi | Line | Branch | Instruction | Method |
|---|---|---|---|---|
| **Toàn dự án** (66 classes) | 976/1.298 = **75,2%** | 147/222 = **66,2%** | 4.374/5.821 = **75,1%** | 180/309 = **58,3%** |
| **Package `service.impl`** (18 classes) | 816/893 = **91,4%** | 145/204 = **71,1%** | — | — |
| **12 lớp Service đã có test** | **796/814 = 97,8%** | **145/200 = 72,5%** | — | — |

**Chi tiết theo lớp Service (có test):**

| Class | Line | % Line | Branch | % Branch |
|---|:--:|--:|:--:|--:|
| WalletServiceImpl | 71/71 | **100%** | 12/12 | **100%** |
| PaymentServiceImpl | 28/28 | **100%** | 8/8 | **100%** |
| PricingServiceImpl | 19/19 | **100%** | 4/4 | **100%** |
| DistanceServiceImpl | 12/12 | **100%** | — | — |
| DriverServiceImpl | 56/56 | **100%** | 9/10 | 90,0% |
| AdminServiceImpl | 49/49 | **100%** | 5/6 | 83,3% |
| NotificationServiceImpl | 41/41 | **100%** | — | — |
| VoucherServiceImpl | 37/37 | **100%** | 19/20 | 95,0% |
| AuthServiceImpl | 155/155 | **100%** | 25/32 | 78,1% |
| CustomUserDetailsService | 10/10 | **100%** | 2/2 | 100% |
| CustomerServiceImpl | 98/102 | 96,1% | 21/30 | 70,0% |
| OrderServiceImpl | 188/199 | 94,5% | 30/64 | 46,9% |
| ReviewServiceImpl | 42/45 | 93,3% | 12/14 | 85,7% |
| JwtTokenProvider | 43/47 | 91,5% | — | — |

**Các lớp chưa có test (độ phủ thấp — cần bổ sung, ma trận tại 3.15.B):**

| Class | Line | Branch |
|---|:--:|:--:|
| AuditLogServiceImpl | 11/31 = **35,5%** | — |
| OTPServiceImpl | 1/23 = **4,3%** | 0/4 = 0% |
| EmailServiceImpl / SMSServiceImpl / MapServiceImpl / FileStorageServiceImpl (service giả lập) | 2/8 · 2/4 · 2/6 · 2/7 (25%–50%) | — (vài dòng bị chạm bởi lớp demo) |

**Ngoài phạm vi unit test:** toàn bộ Controller (9 lớp — 0%), các entity (POJO — hầu hết 0%), `GlobalExceptionHandler` (2/38), `JwtAuthenticationFilter` (1/18), `SpeedApplication` (1/3) — thuộc phạm vi Web/Integration Test (ranh giới với Integration Testing đã nêu ở đề cương mục 2.5.4). Riêng `SecurityConfig`/`SwaggerConfig` được chạm 100% **do lớp demo nạp Spring Context** — không phải nhờ unit test.

#### 4.2.5. Đánh giá

| Mã | Ngưỡng | Thực đo | Kết luận |
|---|---|---|---|
| CC-1 | ≥ 90% line/lớp Service có test | **12/12 lớp ≥ 93,3%** (9 lớp đạt 100%); `jacoco:check` xác minh tự động trong `mvn verify` | ✅ **ĐẠT 12/12** — cổng chất lượng đã bật |
| CC-2 | ≥ 85% branch/lớp | Đạt: Wallet, Payment, Pricing, Voucher, Review, Driver (90%), CustomUD. Chưa đạt: **Order 46,9%, Customer 70,0%, Auth 78,1%, Admin 83,3%** | ❌ **CHƯA ĐẠT** — cần bổ sung TC đi vào nhánh chưa test (3.15.A) |
| CC-3 | ≥ 95% line tổng hợp 12 lớp Service | **97,8%** | ✅ ĐẠT |
| CC-4 | ≥ 60% line toàn dự án | **75,2%** (instruction 75,1%) | ✅ ĐẠT |
| CC-5 | Không còn lớp Service nghiệp vụ nào ở mức 0% | Không còn lớp 0%; còn thấp: **AuditLog 35,5%, OTP 4,3%** | ⚠️ **ĐẠT một phần** — không còn 0% nhưng 2 lớp chưa đạt 90% |

> **Lưu ý về quality gate trong `pom.xml`:** luật `jacoco:check` gắn với phase `verify` (**không** chạy khi chỉ `mvn test`): ràng buộc **LINE ≥ 90% ở cấp CLASS cho 12 lớp Service trọng tâm** (không ràng buộc BUNDLE toàn dự án). Với bộ 189 lượt hiện tại, `mvn clean verify` **PASS** hoàn toàn: 194/194 test + `jacoco:check` PASS + BUILD SUCCESS.

**Cách diễn giải để trình bày:** số 75,2% toàn dự án vẫn bị kéo xuống bởi các lớp **nằm ngoài phạm vi unit test có Mocking** (Controller 0%, Entity POJO ~0%). Tầng Service — **đối tượng của kỹ thuật Mocking** — đạt **97,8% line** cho 12 lớp đã test (cả package `service.impl` gồm các lớp hạ tầng: 816/893 = 91,4%). Khoảng trống còn lại tập trung đúng vào 2 lớp chưa viết test (AuditLog/OTP) và các nhánh điều khiển của Order/Auth/Customer/Admin.

---

### 4.3. Tiêu chí 3 — Tính độc lập của test (Test Isolation)

#### 4.3.1. Cơ sở lý thuyết

- **Nguyên tắc I (Isolated) trong F.I.R.S.T:** Ottinger & Langr (2011) — mỗi test phải chạy độc lập, không phụ thuộc trạng thái do test khác để lại.
- **Meszaros (2007) — Erratic Test:** liệt kê các nguyên nhân khiến test "thất thường": **Interacting Tests** (test này ảnh hưởng test kia qua trạng thái chia sẻ) và **Platform Dependency** (phụ thuộc tài nguyên/môi trường ngoài). Test Isolation là điều kiện để tránh hai nhóm nguyên nhân này.
- **Osherove & Khorikov (2024):** unit test phải chạy được **không cần** Database, mạng hay dịch vụ bên thứ ba; mọi phụ thuộc ngoài được thay bằng Test Double.
- **Fowler (2011) — "Eradicating Non-Determinism in Tests":** test "flaky" (khi pass khi fail) phá hỏng lòng tin vào bộ test; cần loại bỏ mọi nguồn bất định (mạng, thời gian, thứ tự chạy).

**Định nghĩa áp dụng:** bộ test đạt **Isolation** khi mỗi test case cho **cùng kết quả** bất kể: (a) môi trường ngoài có bật/tắt, (b) các test khác có chạy trước hay không, (c) thứ tự chạy. Đây chính là mục tiêu cốt lõi mà kỹ thuật Mocking sinh ra để bảo vệ (đề cương mục I — tính "cô lập" của Unit Test).

#### 4.3.2. Sáu chỉ báo phụ (I1–I6) và cách kiểm chứng

| Chỉ báo | Tiêu chí | Cách kiểm chứng |
|---|---|---|
| **I1 — Không nạp Spring Context** | Test chỉ dùng `@ExtendWith(MockitoExtension.class)`, không dùng `@SpringBootTest`/`@DataJpaTest`/`@WebMvcTest` | Quét toàn bộ `src/test` (ngoài `demo`) tìm annotation Spring |
| **I2 — Không kết nối Database** | Không có kết nối JDBC/Hikari nào được mở khi chạy test | Grep `HikariPool`/`jdbc:mysql` trong log chạy test (kể cả khi MySQL **đang chạy**) |
| **I3 — Không phụ thuộc dịch vụ ngoài** | Email/SMS/Map/Payment/OTP đều bị thay bằng mock — không gọi mạng thật | Mọi dependency là `@Mock`; kiểm log không có lời gọi mạng |
| **I4 — Không chia sẻ trạng thái** | Dữ liệu dựng mới trong `@BeforeEach`; Mockito strict-stubs tự phát hiện stub thừa | Chạy đầy đủ — không có `UnnecessaryStubbingException` |
| **I5 — Độc lập thứ tự chạy** | Chạy lẻ 1 method, lẻ 1 class, chạy thứ tự ngẫu nhiên đều PASS như chạy cả suite | 3 lệnh chạy so sánh |
| **I6 — Xác định (deterministic)** | Chạy lại nhiều lần cho cùng kết quả, không flaky | Chạy full suite nhiều lần trong buổi đo |

#### 4.3.3. Kết quả thực đo (đo lại 18/10/2026 — bộ 189 lượt)

| Chỉ báo | Phép kiểm chứng thực tế | Kết quả |
|---|---|---|
| I1 | Quét `src/test/**/*.java` (ngoài `demo`): `@SpringBootTest|@DataJpaTest|@WebMvcTest|@AutoConfigureMockMvc` | ✅ **0 kết quả** — không lớp unit test nào nạp Spring Context. (12 file dùng `MockitoExtension` gồm 11 lớp unit và lớp demo `MockingDemoTest`; 4 lớp không cần mock là smoke test, hai lớp thuần logic tính giá/tính khoảng cách và lớp sinh token thật) |
| I2 | Grep `HikariPool|jdbc:mysql` trong log `mvn clean verify` (MySQL80 đang **Running**) | ✅ **0 kết quả** — test không mở kết nối DB nào |
| I3 | `EmailService`/`SMSService`/`MapService`/`PaymentService`/`OTPService` đều bị `@Mock`; log chỉ có nội dung giả lập (`[MOCK PAYMENT]`) | ✅ Không phụ thuộc mạng/dịch vụ thứ ba |
| I4 | Kiểm tra cấu trúc: `@BeforeEach` dựng dữ liệu riêng từng class; `MockitoExtension` dùng strict stubs | ✅ Không lỗi `UnnecessaryStubbing`, không lỗi trạng thái |
| I5a | `mvn '-Dtest=AuthServiceImplTest' '-Djacoco.skip=true' test` (lẻ 1 class — 26 TC) | ✅ **26/26 PASS** (17,099 s) |
| I5b | `mvn '-Dtest=AuthServiceImplTest$RegisterTests#register_Success' '-Djacoco.skip=true' test` (lẻ 1 method) | ✅ **1/1 PASS** (14,302 s) |
| I5c | Chạy toàn suite với **thứ tự method ngẫu nhiên** (`-Djunit.jupiter.testmethod.order.default=...MethodOrderer$Random`) | ✅ **189/189 PASS** (20,554 s) |
| I6 | Nhiều lần chạy full suite trong 2 buổi đo (29/09: nhiều lần với bộ 158; 18/10: `mvn clean verify` 194/194 + ngẫu nhiên 189/189 + lẻ class/method) | ✅ Mọi lần **PASS, 0 flaky** |

**Lệnh kiểm chứng I5 (có thể tái lập):**

```powershell
cd speed-backend

# I5a: chạy lẻ 1 test class
mvn '-Dtest=AuthServiceImplTest' '-Djacoco.skip=true' test

# I5b: chạy lẻ 1 test method (@Nested → dùng $)
mvn '-Dtest=AuthServiceImplTest$RegisterTests#register_Success' '-Djacoco.skip=true' test

# I5c: chạy thứ tự ngẫu nhiên — chứng minh không phụ thuộc thứ tự
mvn '-Dtest=SpeedApplicationTest,AuthServiceImplTest,...' '-Djunit.jupiter.testmethod.order.default=org.junit.jupiter.api.MethodOrderer$Random' '-Djacoco.skip=true' test
```

#### 4.3.4. Đánh giá

✅ **ĐẠT toàn bộ I1 → I6** — 194/194 (verify), 189/189 (thứ tự ngẫu nhiên), 26/26 (lẻ class), 1/1 (lẻ method) đều PASS, **không cần** MySQL/mạng/Spring Context cho bộ unit. **Tỷ lệ độc lập = 100%, số flaky = 0.**

---

## 5. Tổng hợp kết quả 3 tiêu chí đo lường

| # | Tiêu chí | Chỉ báo con | Ngưỡng | Thực đo (18/10/2026) | Kết luận |
|---|---|---|---|---|---|:--:|
| 1 | **Execution Time** | ET-1 Tổng thời gian tầng test | ≤ 30 s | **4,721 s** (pipeline `mvn clean verify` ~104 s) | ✅ |
| | | ET-2 Trung bình/lượt test | ≤ 200 ms | **25 ms** | ✅ |
| | | ET-3 Mỗi test class | ≤ 5 s | Cao nhất 0,901 s | ✅ |
| | | ET-4 Tái lập ổn định | 100% PASS | 194/194 · 189/189 · 26/26 · 1/1 | ✅ |
| 2 | **Code Coverage** | CC-1 Line/lớp Service có test | ≥ 90% | 12/12 lớp (9 lớp 100%); `jacoco:check` PASS | ✅ |
| | | CC-2 Branch/lớp | ≥ 85% | 4 lớp chưa đạt (Order 46,9%, Auth 78,1%, Customer 70%, Admin 83,3%) | ❌ |
| | | CC-3 Line tổng hợp 12 lớp Service | ≥ 95% | **97,8%** | ✅ |
| | | CC-4 Line toàn dự án | ≥ 60% | **75,2%** | ✅ |
| | | CC-5 Không còn lớp nghiệp vụ 0% | 0 lớp | Không còn lớp 0%; AuditLog 35,5%, OTP 4,3% còn thấp | ⚠️ |
| 3 | **Test Isolation** | I1 Không Spring Context | 0 annotation | 0 | ✅ |
| | | I2 Không kết nối DB | 0 lời gọi | 0 (MySQL đang chạy vẫn không chạm) | ✅ |
| | | I3 Không phụ thuộc mạng/dịch vụ ngoài | 100% mock | 100% | ✅ |
| | | I4 Không chia sẻ trạng thái | 0 lỗi trạng thái | 0 lỗi | ✅ |
| | | I5 Độc lập thứ tự | Lẻ method + lẻ class + ngẫu nhiên PASS | 1/1 · 26/26 · 189/189 | ✅ |
| | | I6 Không flaky | 0 flaky | 0 flaky / nhiều lần chạy 2 buổi đo | ✅ |

**Kết luận chung:**

- **Execution Time: ĐẠT 4/4** — bộ test rất nhanh (~25 ms/lượt) nhờ Mocking loại bỏ I/O thật; phù hợp chạy liên tục trong CI. Bằng chứng đối chứng: login có Mock nhanh hơn login qua Spring+H2 ~390 lần (dao động 223×–420×).
- **Test Isolation: ĐẠT 6/6** — kết quả then chốt chứng minh "Mocking cô lập được thành phần phụ thuộc": không DB, không mạng, không Spring Context, không flaky.
- **Code Coverage: ĐẠT 4/5 về tinh thần** — CC-1/CC-3/CC-4 đạt hẳn; CC-5 chỉ còn 2 lớp dưới ngưỡng (không còn lớp 0%). Còn **CC-2 (branch ≥ 85%) CHƯA ĐẠT** — cần bổ sung TC đi vào các nhánh chưa test của `OrderServiceImpl` (46,9%), `AuthServiceImpl` (78,1%), `CustomerServiceImpl` (70,0%), `AdminServiceImpl` (83,3%) — thiết kế sẵn tại 3.15.A.

---

## 6. Cách tái lập toàn bộ số liệu

> ⚠️ **Lưu ý PowerShell:** với `mvn.cmd` trên Windows, cần **trích dẫn cả token** `-D...` (ví dụ `'-Djacoco.skip=true'`), nếu không PowerShell/batch sẽ tách sai tham số.
> ⚠️ **Lưu ý coverage:** xóa `target/jacoco.exec` trước khi đo để tránh JaCoCo cộng dồn số liệu giữa các lần chạy.

```powershell
cd speed-backend

# 0. (Khi cần số liệu coverage thuần) xóa dữ liệu đo cũ
Remove-Item target\jacoco.exec -ErrorAction SilentlyContinue

# 1. Chạy 189 lượt Unit Test + sinh báo cáo JaCoCo
mvn '-Dtest=SpeedApplicationTest,AuthServiceImplTest,OrderServiceImplTest,PaymentServiceImplTest,VoucherServiceImplTest,PricingServiceImplTest,DistanceServiceImplTest,CustomerServiceImplTest,DriverServiceImplTest,AdminServiceImplTest,NotificationServiceImplTest,ReviewServiceImplTest,WalletServiceImplTest,JwtTokenProviderTest,CustomUserDetailsServiceTest' test
# → "Tests run: 189, Failures: 0" + BUILD SUCCESS

# 2. Chạy đầy đủ (gồm 2 lớp demo đối chứng) — 194 lượt; xem số liệu Mock vs Spring
mvn test

# 3. Bảng thời gian chạy per-class → mở target/surefire-reports/*.txt (dòng "Time elapsed")

# 4. Báo cáo độ bao phủ
start target\site\jacoco\index.html      # giao diện
#    số liệu thô: target/site/jacoco/jacoco.csv

# 5. Chứng minh tính độc lập (I1/I2/I5) — xem mục 4.3
mvn '-Dtest=AuthServiceImplTest' '-Djacoco.skip=true' test
mvn '-Dtest=AuthServiceImplTest$RegisterTests#register_Success' '-Djacoco.skip=true' test
mvn '-Dtest=SpeedApplicationTest,AuthServiceImplTest,OrderServiceImplTest,PaymentServiceImplTest,VoucherServiceImplTest,PricingServiceImplTest,DistanceServiceImplTest,CustomerServiceImplTest,DriverServiceImplTest,AdminServiceImplTest,NotificationServiceImplTest,ReviewServiceImplTest,WalletServiceImplTest,JwtTokenProviderTest,CustomUserDetailsServiceTest' '-Djunit.jupiter.testmethod.order.default=org.junit.jupiter.api.MethodOrderer$Random' '-Djacoco.skip=true' test

# 6. Vòng CI đầy đủ: 194 lượt + jacoco:check (quality gate 12 lớp) + đóng gói JAR
mvn clean verify
# → "Tests run: 194" + jacoco:check PASS + BUILD SUCCESS (~01:44 min)
```

**Môi trường đo:** Windows 11 · JDK 21.0.10 (Oracle) · Apache Maven 3.9.16 · JaCoCo 0.8.12 · Surefire 3.5.2 · MySQL80 (Running — **không** được dùng bởi bộ test) · Ngày: 29/09/2026 (gốc) — đo lại 18/10/2026.

---

## 7. Tài liệu tham khảo

Các nguồn [1]–[3] trùng với danh mục tham khảo của đề cương khóa luận.

1. R. Osherove and V. Khorikov, *The Art of Unit Testing: Third Edition*, 3rd ed. Shelter Island, NY, USA: Manning Publications, 2024.
2. V. Khorikov, *Unit Testing: Principles, Practices, and Patterns*. Shelter Island, NY, USA: Manning Publications, 2020.
3. T. Kaczanowski, *Practical Unit Testing with JUnit and Mockito*. Kraków, Poland: kaczanowscy.pl, 2013.
4. G. Meszaros, *xUnit Test Patterns: Refactoring Test Code*. Boston, MA, USA: Addison-Wesley, 2007.
5. G. J. Myers, C. Sandler, and T. Badgett, *The Art of Software Testing*, 3rd ed. Hoboken, NJ, USA: Wiley, 2011.
6. M. Fowler, "Mocks Aren't Stubs," martinfowler.com, Jan. 2007. [Online]. Available: https://martinfowler.com/articles/mocksArentStubs.html
7. M. Fowler, "Continuous Integration," martinfowler.com, May 2006. [Online]. Available: https://martinfowler.com/articles/continuousIntegration.html
8. M. Fowler, "Eradicating Non-Determinism in Tests," martinfowler.com, Apr. 2011. [Online]. Available: https://martinfowler.com/articles/nonDeterminism.html
9. D. North, "Introducing BDD," dannorth.net, Feb. 2006. [Online]. Available: https://dannorth.net/introducing-bdd/
10. ISTQB, *Certified Tester Foundation Level (CTFL) Syllabus*, Version 4.0. International Software Testing Qualifications Board, 2023.
11. T. Ottinger and J. Langr, *Agile in a Flash: Speed Learning Agile Software Development*. Dallas, TX, USA: The Pragmatic Bookshelf, 2011.
12. Mockito, "org.mockito.BDDMockito" — Javadoc chính thức. [Online]. Available: https://javadoc.io/doc/org.mockito/mockito-core/latest/org/mockito/BDDMockito.html
13. EclEmma, "JaCoCo — Documentation (Counters)." [Online]. Available: https://www.jacoco.org/jacoco/trunk/doc/counters.html
14. JUnit Team, "JUnit 5 User Guide" — @Nested, @ParameterizedTest, @CsvSource, MethodOrderer. [Online]. Available: https://junit.org/junit5/docs/current/user-guide/