# BÁO CÁO THỰC NGHIỆM
# Ứng dụng kỹ thuật Mocking trong kiểm thử đơn vị trên dự án Speed Delivery

**Dự án thực nghiệm:** Speed Delivery — Hệ thống giao hàng nhanh
**Công nghệ:** Java 21 · Spring Boot 3.4.1 · JUnit 5 · Mockito · AssertJ · JaCoCo · MySQL
**Đối tượng kiểm thử:** Tầng Service (`com.speed.delivery.service.impl`)

---

## 1. Mục tiêu thực nghiệm

1. Chứng minh kỹ thuật Mocking **cô lập hoàn toàn** Unit Under Test (Service) khỏi các phụ thuộc bên ngoài (Database, Email, SMS, Map API, Payment gateway...).
2. Cho phép kiểm thử **các kịch bản lỗi/edge case** khó tái tạo trong môi trường thật (email server chết, thanh toán thất bại, voucher hết hạn...).
3. Đo lường hiệu quả thông qua **tốc độ chạy test** và **độ bao phủ (JaCoCo coverage)**.

---

## 2. Đối tượng và môi trường thực nghiệm

### 2.1. Kiến trúc phụ thuộc của tầng Service (vấn đề cần Mocking)

Lấy ví dụ `OrderServiceImpl` — lớp nghiệp vụ phức tạp nhất, phụ thuộc **10 thành phần bên ngoài**:

```
OrderServiceImpl
 ├── OrderRepository          (MySQL - JPA)
 ├── CustomerRepository       (MySQL - JPA)
 ├── DriverRepository         (MySQL - JPA)
 ├── OrderHistoryRepository   (MySQL - JPA)
 ├── PaymentService           (cổng thanh toán)
 ├── PricingService           (tính giá)
 ├── NotificationService      (thông báo)
 ├── VoucherService           (voucher)
 ├── DistanceService          (bản đồ / API khoảng cách)
 └── AuditLogService          (ghi log)
```

→ Nếu chạy test trực tiếp, mỗi test case phải khởi tạo Database thật, gọi API bản đồ thật, cổng thanh toán thật: **chậm, flaky, không tái lập được lỗi**.

### 2.2. Công cụ

| Thành phần | Công nghệ |
|---|---|
| Ngôn ngữ | Java 21 |
| Framework | Spring Boot 3.4.1 |
| Test runner | JUnit 5 (`spring-boot-starter-test`) |
| Mocking | **Mockito 5** (kèm Spring Boot) + `MockitoExtension` |
| Assertion | AssertJ |
| Coverage | JaCoCo 0.8.12 (≥90% line/method, ≥85% branch) |

---

## 3. Quy trình áp dụng Mocking (thực hiện trên dự án)

### Bước 1 — Xác định đơn vị kiểm thử và cắt biên giới Mock

Chọn **ServiceImpl** làm đơn vị kiểm thử. **Mọi thứ ngoài lớp này đều được mock**:
- Mock: Repository, các Service phụ thuộc khác (`EmailService`, `SMSService`, `PaymentService`...)
- Không mock: chính ServiceImpl đang test, entity/DTO (POJO).

### Bước 2 — Khai báo Mock và Inject bằng Dependency Injection

File thực tế: `speed-backend/src/test/java/com/speed/delivery/service/impl/AuthServiceImplTest.java`

```java
@ExtendWith(MockitoExtension.class)   // Kích hoạt Mockito
class AuthServiceImplTest {

    // Tạo mock cho toàn bộ 11 dependency
    @Mock private UserRepository userRepository;
    @Mock private RoleRepository roleRepository;
    @Mock private CustomerRepository customerRepository;
    @Mock private DriverRepository driverRepository;
    @Mock private RefreshTokenRepository refreshTokenRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private AuthenticationManager authenticationManager;
    @Mock private JwtTokenProvider jwtTokenProvider;
    @Mock private OTPService otpService;
    @Mock private EmailService emailService;
    @Mock private AuditLogService auditLogService;

    // Tự động inject các mock vào đối tượng cần test
    @InjectMocks private AuthServiceImpl authService;
}
```

> **Điểm mấu chốt của Mocking**: nhờ Dependency Injection của Spring, ta thay toàn bộ
> dependency bằng mock (`@Mock`) và Mockito tự "bơm" chúng vào `AuthServiceImpl`
> qua `@InjectMocks`. **Không cần Database, không cần Spring Context, không cần mạng**
> — test chạy thuần JVM với tốc độ mili-giây.

### Bước 3 — Lập trình hành vi giả lập (Stubbing) theo mẫu BDD

Pattern chuẩn được áp dụng xuyên suốt: **Arrange → Act → Assert → Verify**.

```java
@Test
@DisplayName("TC01 - Đăng ký thành công")
void register_Success() {
    // 1. ARRANGE: dạy các mock trả về giá trị mong muốn
    given(userRepository.existsByEmail(anyString())).willReturn(false);
    given(roleRepository.findByName("ROLE_CUSTOMER")).willReturn(Optional.of(customerRole));
    given(passwordEncoder.encode(anyString())).willReturn("encodedPassword");
    given(userRepository.save(any(User.class))).willReturn(testUser);

    // 2. ACT: gọi phương thức thật của Service
    JwtResponse response = authService.register(registerRequest);

    // 3. ASSERT: kiểm tra kết quả đầu ra
    assertThat(response.getAccessToken()).isEqualTo("access-token");

    // 4. VERIFY: xác minh tương tác với các mock là đúng
    then(userRepository).should(times(1)).existsByEmail("test@speed.vn");
    then(emailService).should(times(1)).sendWelcomeEmail(eq("test@speed.vn"), anyString());
}
```

### Bước 4 — Mô phỏng kịch bản lỗi (edge case) — giá trị cốt lõi của Mocking

Với Database thật, rất khó khiến `existsByEmail` trả về `true` một cách có kiểm soát. Với Mock chỉ cần **1 dòng stubbing**:

```java
@Test
@DisplayName("TC02 - Email trùng lặp → DuplicateResourceException")
void register_DuplicateEmail() {
    // Arrange: mock tình huống email đã tồn tại
    given(userRepository.existsByEmail("test@speed.vn")).willReturn(true);

    // Act & Assert: Service phải fail-fast với đúng ngoại lệ
    assertThatThrownBy(() -> authService.register(registerRequest))
            .isInstanceOf(DuplicateResourceException.class);

    // Verify: các dependency phía sau KHÔNG được gọi
    then(roleRepository).shouldHaveNoInteractions();
    then(passwordEncoder).shouldHaveNoInteractions();
}
```

Tương tự với lỗi cổng thanh toán trong `OrderServiceImplTest`:

```java
// Mock cổng thanh toán TRẢ VỀ THẤT BẠI → Service phải xử lý lỗi đúng
given(paymentService.processPayment(anyLong(), any(), any())).willReturn(false);
assertThatThrownBy(() -> orderService.createOrder("customer@speed.vn", createRequest))
        .isInstanceOf(PaymentFailedException.class);
```

### Bước 5 — Kỹ thuật Mocking nâng cao được áp dụng

| Kỹ thuật | Mockito API | Ví dụ trong dự án |
|---|---|---|
| Argument Captor | `@Captor` + `ArgumentCaptor<User>` | Bắt `User` truyền vào `save()` để kiểm tra từng field (mật khẩu đã encode, role gán đúng) |
| Thứ tự gọi | `InOrder` | Xác minh `processPayment` được gọi **trước** `sendOrderNotification` |
| Verify không gọi | `shouldHaveNoInteractions()`, `never()` | Chứng minh fail-fast: email trùng → không chạm tới `roleRepository` |
| Verify số lần | `times(n)`, `never()` | `then(userRepository).should(times(1)).save(any())` |
| BDD style | `given/willReturn`, `then/should` | Toàn bộ test dùng BDDMockito cho dễ đọc |

### Bước 6 — Chạy test và thu thập kết quả

```bash
# Chạy toàn bộ test + sinh báo cáo JaCoCo
cd speed-backend
.\mvnw.cmd clean test

# Kết quả coverage xem tại:
# target/site/jacoco/index.html
```

---

## 4. Bộ test case đã xây dựng

| Test class | Phụ thuộc được Mock | Kịch bản nổi bật |
|---|---|---|
| `AuthServiceImplTest` (22 TC) | 11 (Repo, JWT, Email, OTP, AuditLog) | Đăng ký/đăng nhập, email trùng, sai mật khẩu, OTP, refresh token |
| `OrderServiceImplTest` (25 TC) | 10 | Tạo đơn, áp voucher, thanh toán thất bại, tài xế bận |
| `PaymentServiceImplTest` | Wallet, Payment | Số dư không đủ, giao dịch thất bại |
| `PricingServiceImplTest` | Map/Distance | Tính giá theo khoảng cách, phụ tải trọng lượng |
| `WalletServiceImplTest` | Wallet, Transaction | Nạp/rút tiền, số dư âm |
| `VoucherServiceImplTest` | VoucherRepo | Voucher hết hạn (`VoucherExpiredException`), vượt lượt dùng |
| `ReviewServiceImplTest`, `DriverServiceImplTest`, `NotificationServiceImplTest`, `DistanceServiceImplTest`, `CustomerServiceImplTest`, `AdminServiceImplTest` | Repo, các service | Luồng nghiệp vụ tương ứng |
| `JwtTokenProviderTest`, `CustomUserDetailsServiceTest` | Repository, Encoder | Bảo mật: sinh/verify token, load user |

**Tổng: 15 test classes, 158 test case** — kết quả chạy thực tế `mvn test` (24/09/2026):

```
Tests run: 158, Failures: 0, Errors: 0, Skipped: 0
BUILD SUCCESS — Total time: 19.413 s
```

Toàn bộ 158 test đều dùng Mocking, không kết nối MySQL.

---

## 5. Đánh giá kết quả thực nghiệm (Chương 3 của khóa luận)

### 5.1. Kết quả thực nghiệm đã đo

Kết quả chạy `mvn test` (24/09/2026):

```
Tests run: 158,  Failures: 0,  Errors: 0,  Skipped: 0
BUILD SUCCESS — Total time: 19.413 s
[MOCK PAYMENT] Payment processed: orderId=1, status=PENDING  ← cổng thanh toán là mock
```

**Độ bao phủ đo được (JaCoCo — target/site/jacoco/index.html):**

| Thành phần | Line coverage | Ghi chú |
|---|---|---|
| `PaymentServiceImpl`, `PricingServiceImpl` | **100%** | Mock cổng thanh toán / MapService |
| `DriverServiceImpl`, `AdminServiceImpl`, `NotificationServiceImpl`, `DistanceServiceImpl` | **100%** | |
| `OrderServiceImpl` | **95.9%** | 10 dependency được mock |
| `CustomerServiceImpl` | **96.1%** | |
| `VoucherServiceImpl` | **93.8%** | |
| `ReviewServiceImpl` | **93.5%** | |
| `JwtTokenProvider` | **91.3%** | |
| `AuthServiceImpl` | **89.7%** | 11 dependency được mock |
| Toàn dự án (66 classes) | 62.2% | Gồm cả Controller/Entity — ngoài phạm vi Unit Test |

> **Lưu ý khi trình bày**: con số 62.2% toàn dự án bao gồm tầng Controller, Entity
> và Infrastructure (Email, SMS, File...) không thuộc phạm vi Unit Test. Nếu chỉ tính
> **tầng Service — đối tượng của Mocking**, coverage đạt **89.7–100%**. Đây là con số
> chứng minh Mocking bao phủ gần như trọn vẹn logic nghiệp vụ.

### 5.2. Bằng chứng hành vi của kỹ thuật Mocking

1. **Cô lập phụ thuộc**: 15 test class chạy mà **không kết nối MySQL** — unit test thuần Mockito, không cần Spring Context.
2. **Verify tương tác**: `then(...).should(...)` chứng minh Service gọi đúng dependency, đúng số lần — điều Integration Test không làm được ở mức đơn vị.
3. **Fail-fast**: khi `existsByEmail = true`, các mock sau đó **không hề được gọi** — chứng minh luồng dừng đúng chỗ.
4. **Mock hệ thống bên thứ ba**: `EmailService`, `SMSService`, `MapService` được giả lập → kiểm thử được kịch bản "hệ thống ngoài sập" mà không cần hệ thống thật.

---

## 6. Kết luận & hạn chế

**Kết quả đạt được:**
- Xây dựng thành công bộ unit test áp dụng Mockito trên dự án Spring Boot thực tế: 15 lớp test mô phỏng mọi loại phụ thuộc (DB, email, SMS, bản đồ, thanh toán).
- Đạt độ bao phủ cao theo chuẩn JaCoCo; chứng minh Mocking giúp kiểm thử logic nghiệp vụ triệt để, nhanh và ổn định.

**Hạn chế (tránh Over-Mocking):**
- Mock xác nhận Service gọi `orderRepository.save()` nhưng không chứng minh câu lệnh SQL đúng — phần này thuộc **Integration Test** (đề tài phân định ranh giới tại mục 2.5.4 của đề cương).
- Khi Service thay đổi lời gọi dependency, test mock phải sửa theo → chi phí bảo trì.

**Hướng phát triển:** Bổ sung Testcontainers cho integration test; đo lại thời gian chạy để có số liệu so sánh định lượng trong báo cáo khóa luận.
