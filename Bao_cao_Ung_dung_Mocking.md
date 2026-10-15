# Báo cáo: Ứng dụng kỹ thuật Mocking trong kiểm thử đơn vị cho hệ thống Speed Delivery

---

## 1. Giới thiệu

### 1.1. Vấn đề đặt ra

Hệ thống **Speed Delivery** là ứng dụng giao hàng nhanh được xây dựng trên nền tảng Spring Boot, gồm nhiều module nghiệp vụ phụ thuộc lẫn nhau: xác thực người dùng, quản lý đơn hàng, thanh toán, quản lý tài xế, thông báo, v.v. Mỗi module Service phụ thuộc vào nhiều thành phần bên ngoài như:

- **Cơ sở dữ liệu MySQL** (thông qua Repository)
- **Dịch vụ email/SMS** (thông qua EmailService, SMSService)
- **Hệ thống bảo mật** (thông qua AuthenticationManager, JwtTokenProvider)
- **Các Service khác** (Service-to-Service dependency)

Khi viết kiểm thử đơn vị (Unit Test), nếu phải khởi động đầy đủ các thành phần trên sẽ gặp nhiều khó khăn:

| Vấn đề | Hậu quả |
|---|---|
| Phải cài đặt và cấu hình MySQL | Mất thời gian, phụ thuộc môi trường |
| Phải cấu hình SMTP server | Không phải máy nào cũng có |
| Phải khởi động toàn bộ Spring Context | Chậm (15-30 giây mỗi lần chạy) |
| Dữ liệu test bị thay đổi sau mỗi lần chạy | Kết quả không ổn định |
| Khó giả lập trường hợp biên | Ví dụ: token hết hạn, voucher hết lượt |

**Kỹ thuật Mocking** giải quyết tất cả các vấn đề trên bằng cách **giả lập (mock)** các thành phần phụ thuộc, cho phép kiểm thử logic nghiệp vụ **độc lập, nhanh chóng và ổn định**.

### 1.2. Mục tiêu

1. Áp dụng kỹ thuật Mocking để viết Unit Test cho **tất cả module nghiệp vụ** của hệ thống Speed Delivery.
2. Đạt **độ bao phủ mã nguồn (code coverage) trên 80%** cho tầng Service.
3. Chứng minh hiệu quả của Mocking so với các phương pháp kiểm thử truyền thống.

### 1.3. Phạm vi

- **Đối tượng kiểm thử**: Tầng Service (`com.speed.delivery.service.impl`) — nơi chứa toàn bộ logic nghiệp vụ.
- **Không thuộc phạm vi**: Tầng Controller (kiểm thử tích hợp), tầng Entity (chỉ là data class), tầng Config (cấu hình Spring).

---

## 2. Cơ sở lý thuyết

### 2.1. Kiểm thử đơn vị (Unit Testing)

Kiểm thử đơn vị là kỹ thuật kiểm thử phần mềm trong đó các **đơn vị nhỏ nhất** (thường là một phương thức hoặc một lớp) được kiểm thử **độc lập** với phần còn lại của hệ thống. Mục đích là đảm bảo mỗi đơn vị hoạt động đúng theo đặc tả.

**Đặc điểm của Unit Test tốt:**
- **Nhanh**: Thực thi trong mili-giây, không phụ thuộc I/O
- **Cô lập**: Không phụ thuộc DB, network, file system
- **Lặp lại**: Kết quả giống nhau mỗi lần chạy
- **Tự xác minh**: Tự động đánh giá pass/fail

### 2.2. Kỹ thuật Mocking

**Mocking** là kỹ thuật tạo ra các **đối tượng giả lập (mock objects)** thay thế cho các phụ thuộc thật của đơn vị cần kiểm thử. Mock object mô phỏng hành vi của đối tượng thật nhưng không thực sự kết nối đến tài nguyên bên ngoài.

**Quy trình Mocking:**

```
┌─────────────────────────────────────────────────────────┐
│  KHÔNG CÓ MOCKING                                       │
│                                                         │
│  Test → Service → Repository → MySQL (cần DB thật)      │
│              ↘ EmailService → SMTP Server (cần server)  │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  CÓ MOCKING                                             │
│                                                         │
│  Test → Service → Mock Repository (giả lập, không DB)   │
│              ↘ Mock EmailService (giả lập, không SMTP)  │
└─────────────────────────────────────────────────────────┘
```

### 2.3. Framework Mockito và BDDMockito

**Mockito** là framework mocking phổ biến nhất cho Java. Trong dự án này sử dụng **BDDMockito** — biến thể theo phong cách BDD (Behavior-Driven Development) giúp code test đọc như ngôn ngữ tự nhiên:

| Thao tác | Cú pháp Mockito cổ điển | Cú pháp BDDMockito (dùng trong dự án) |
|---|---|---|
| Thiết lập hành vi | `when(mock.method()).thenReturn(value)` | `given(mock.method()).willReturn(value)` |
| Xác minh gọi hàm | `verify(mock).method()` | `then(mock).should().method()` |
| Xác minh không gọi | `verify(mock, never()).method()` | `then(mock).should(never()).method()` |
| Xác minh không tương tác | `verifyNoInteractions(mock)` | `then(mock).shouldHaveNoInteractions()` |

### 2.4. Pattern Arrange → Act → Assert → Verify

Mỗi test case trong dự án tuân thủ pattern 4 bước:

```java
@Test
void testExample() {
    // Arrange: Thiết lập dữ liệu và hành vi mock
    given(repository.findById(1L)).willReturn(Optional.of(entity));

    // Act: Thực thi phương thức cần test
    Result result = service.doSomething(1L);

    // Assert: Kiểm tra kết quả đầu ra
    assertThat(result).isNotNull();

    // Verify: Xác minh các dependency được gọi đúng
    then(repository).should(times(1)).findById(1L);
}
```

### 2.5. JaCoCo (Java Code Coverage)

**JaCoCo** là công cụ đo độ bao phủ mã nguồn. Cơ chế hoạt động:

1. **Cài Agent**: Chèn mã theo dõi vào bytecode (như gắn "camera" vào từng dòng code)
2. **Thu thập**: Khi test chạy, ghi lại dòng nào được thực thi vào file `jacoco.exec`
3. **Báo cáo**: Tạo báo cáo HTML hiển thị dòng xanh (đã test) / dòng đỏ (chưa test)

---

## 3. Phân tích hệ thống Speed Delivery

### 3.1. Kiến trúc hệ thống

Hệ thống Speed Delivery được xây dựng theo kiến trúc **3 lớp (3-Layer Architecture)**:

```
┌──────────────┐
│  Controller  │  ← Nhận request từ client (REST API)
├──────────────┤
│   Service    │  ← Xử lý logic nghiệp vụ ★ ĐỐI TƯỢNG KIỂM THỬ
├──────────────┤
│  Repository  │  ← Truy xuất cơ sở dữ liệu (JPA/Hibernate)
└──────────────┘
```

Kỹ thuật Mocking được áp dụng tại **tầng Service** — nơi chứa toàn bộ logic nghiệp vụ cốt lõi.

### 3.2. Các module nghiệp vụ và dependencies

| # | Module (Class Under Test) | Chức năng | Số Dependencies |
|---|---|---|:---:|
| 1 | `AuthServiceImpl` | Xác thực, đăng ký, đổi mật khẩu | 11 |
| 2 | `OrderServiceImpl` | Quản lý đơn hàng | 10 |
| 3 | `PaymentServiceImpl` | Thanh toán, hoàn tiền | 2 |
| 4 | `CustomerServiceImpl` | Quản lý khách hàng, địa chỉ | 4 |
| 5 | `DriverServiceImpl` | Quản lý tài xế, giao hàng | 5 |
| 6 | `AdminServiceImpl` | Dashboard, quản lý users | 5 |
| 7 | `NotificationServiceImpl` | Gửi thông báo | 1 |
| 8 | `VoucherServiceImpl` | Mã giảm giá | 1 |
| 9 | `ReviewServiceImpl` | Đánh giá đơn hàng | 5 |
| 10 | `PricingServiceImpl` | Tính giá giao hàng | 0 (pure logic) |
| 11 | `DistanceServiceImpl` | Tính khoảng cách GPS | 0 (pure logic) |

### 3.3. Chiến lược Mock

Dựa trên phân tích dependencies, chiến lược mocking được chia thành **3 cấp độ**:

| Cấp độ | Đặc điểm | Module tiêu biểu | Kỹ thuật |
|---|---|---|---|
| **Cơ bản** | 1-2 dependencies, logic đơn giản | PaymentServiceImpl, NotificationServiceImpl | `@Mock` + `given/willReturn` |
| **Trung bình** | 4-5 dependencies, có Service-to-Service | DriverServiceImpl, CustomerServiceImpl | `@Mock` Service + `InOrder` |
| **Nâng cao** | 10+ dependencies, logic phức tạp | AuthServiceImpl, OrderServiceImpl | `ArgumentCaptor` + `InOrder` + helper methods |

---

## 4. Triển khai thực tế

### 4.1. Môi trường phát triển

| Thành phần | Phiên bản | Vai trò |
|---|---|---|
| Java | JDK 21 | Ngôn ngữ phát triển |
| Spring Boot | 3.4.1 | Framework backend |
| JUnit 5 | Jupiter | Framework kiểm thử |
| Mockito | 5.x (BDDMockito) | Framework Mocking |
| AssertJ | 3.x | Thư viện Assertion |
| JaCoCo | 0.8.12 | Đo code coverage |
| Maven | 3.x | Build tool |

### 4.2. Cấu trúc thư mục test

```
speed-backend/src/test/java/com/speed/delivery/
├── SpeedApplicationTest.java
├── security/
│   ├── CustomUserDetailsServiceTest.java    (5 TCs)
│   └── JwtTokenProviderTest.java            (11 TCs)
└── service/impl/
    ├── AuthServiceImplTest.java             (22 TCs)
    ├── OrderServiceImplTest.java            (17 TCs)
    ├── PaymentServiceImplTest.java          (10 TCs)
    ├── CustomerServiceImplTest.java         (12 TCs)
    ├── DriverServiceImplTest.java           (12 TCs)
    ├── AdminServiceImplTest.java            (10 TCs)
    ├── NotificationServiceImplTest.java     (7 TCs)
    ├── VoucherServiceImplTest.java          (15 TCs)
    ├── ReviewServiceImplTest.java           (7 TCs)
    ├── PricingServiceImplTest.java          (22 TCs)
    └── DistanceServiceImplTest.java         (10 TCs)
                                    Tổng: 158 Test Cases
```

### 4.3. Cấu hình JaCoCo trong pom.xml

```xml
<plugin>
    <groupId>org.jacoco</groupId>
    <artifactId>jacoco-maven-plugin</artifactId>
    <version>0.8.12</version>
    <executions>
        <execution>
            <id>prepare-agent</id>
            <goals><goal>prepare-agent</goal></goals>
        </execution>
        <execution>
            <id>report</id>
            <phase>test</phase>
            <goals><goal>report</goal></goals>
        </execution>
    </executions>
</plugin>
```

### 4.4. Minh họa code kiểm thử – 3 cấp độ

#### 4.4.1. Cấp độ cơ bản – PaymentServiceImplTest

Mock **2 Repository** để test logic thanh toán. Minh họa kỹ thuật `ArgumentCaptor` để bắt đối tượng Payment truyền vào `save()`:

```java
@ExtendWith(MockitoExtension.class)
class PaymentServiceImplTest {

    @Mock private PaymentRepository paymentRepository; // Giả lập DB
    @Mock private OrderRepository orderRepository;     // Giả lập DB
    @InjectMocks private PaymentServiceImpl paymentService; // Đối tượng test

    @Test
    @DisplayName("PM-TC01: Thanh toán tiền mặt thành công")
    void processPayment_Cash_Success() {
        // Arrange: Lập trình hành vi cho mock
        given(orderRepository.findById(1L)).willReturn(Optional.of(testOrder));
        given(paymentRepository.save(any(Payment.class))).willReturn(testPayment);

        // Act: Gọi hàm cần test
        boolean result = paymentService.processPayment(1L, BigDecimal.valueOf(40000), PaymentMethod.CASH);

        // Assert: Kiểm tra kết quả
        assertThat(result).isTrue();

        // Verify: Đảm bảo DB được gọi đúng 1 lần
        then(paymentRepository).should(times(1)).save(any(Payment.class));
    }

    @Test
    @DisplayName("PM-TC03: Order không tồn tại → exception, DB KHÔNG bị gọi save")
    void processPayment_OrderNotFound() {
        // Arrange: Mock trả về empty
        given(orderRepository.findById(999L)).willReturn(Optional.empty());

        // Act & Assert: Phải throw exception
        assertThatThrownBy(() -> paymentService.processPayment(999L, BigDecimal.valueOf(40000), PaymentMethod.CASH))
                .isInstanceOf(ResourceNotFoundException.class);

        // Verify: PaymentRepository hoàn toàn KHÔNG bị tương tác (fail-fast)
        then(paymentRepository).shouldHaveNoInteractions();
    }

    @Test
    @DisplayName("PM-TC06: ArgumentCaptor - bắt Payment entity kiểm tra chi tiết")
    void processPayment_CapturePaymentSaved() {
        // Arrange: Chuẩn bị ArgumentCaptor
        ArgumentCaptor<Payment> captor = ArgumentCaptor.forClass(Payment.class);
        given(orderRepository.findById(1L)).willReturn(Optional.of(testOrder));
        given(paymentRepository.save(any(Payment.class))).willReturn(testPayment);

        // Act
        paymentService.processPayment(1L, BigDecimal.valueOf(50000), PaymentMethod.CASH);

        // Verify + Assert: Bắt đối tượng và kiểm tra từng trường
        then(paymentRepository).should().save(captor.capture());
        Payment captured = captor.getValue();
        assertThat(captured.getPaymentMethod()).isEqualTo(PaymentMethod.CASH);
        assertThat(captured.getPaymentStatus()).isEqualTo(PaymentStatus.PENDING);
        assertThat(captured.getTransactionId()).startsWith("TXN-");
    }
}
```

#### 4.4.2. Cấp độ trung bình – DriverServiceImplTest

Mock **5 dependencies** bao gồm cả **Service-to-Service** (DriverService mock OrderService). Minh họa kỹ thuật `InOrder` kiểm tra thứ tự gọi:

```java
@ExtendWith(MockitoExtension.class)
class DriverServiceImplTest {

    @Mock private DriverRepository driverRepository;
    @Mock private OrderRepository orderRepository;
    @Mock private OrderService orderService;           // Mock Service khác
    @Mock private NotificationService notificationService;
    @Mock private AuditLogService auditLogService;
    @InjectMocks private DriverServiceImpl driverService;

    @Test
    @DisplayName("DR-TC04: Nhận đơn - delegate sang OrderService")
    void acceptOrder_Success() {
        // Arrange
        given(driverRepository.findById(1L)).willReturn(Optional.of(testDriver));
        given(orderService.assignDriver(1L, 1L)).willReturn(expectedResponse);

        // Act
        OrderResponse result = driverService.acceptOrder(1L, 1L);

        // Assert
        assertThat(result.getStatus()).isEqualTo("ASSIGNED");

        // Verify: OrderService.assignDriver được gọi (Service-to-Service)
        then(orderService).should(times(1)).assignDriver(1L, 1L);
    }

    @Test
    @DisplayName("DR-TC05: Tài xế không khả dụng → OrderService KHÔNG được gọi")
    void acceptOrder_DriverUnavailable() {
        // Arrange
        testDriver.setIsAvailable(false);
        given(driverRepository.findById(1L)).willReturn(Optional.of(testDriver));

        // Act & Assert
        assertThatThrownBy(() -> driverService.acceptOrder(1L, 1L))
                .isInstanceOf(BadRequestException.class);

        // Verify: Khi validate lỗi → OrderService hoàn toàn không bị gọi
        then(orderService).shouldHaveNoInteractions();
    }

    @Test
    @DisplayName("DR-TC07: Hoàn thành giao hàng - InOrder verify thứ tự")
    void completeDelivery_Success() {
        // Arrange
        given(driverRepository.findById(1L)).willReturn(Optional.of(testDriver));
        given(orderRepository.findById(1L)).willReturn(Optional.of(testOrder));
        given(orderService.updateOrderStatus(1L, "DELIVERED", 2L)).willReturn(response);

        // Act
        driverService.completeDelivery(1L, 1L);

        // Verify: Kiểm tra THỨ TỰ gọi dependencies
        InOrder inOrder = inOrder(driverRepository, orderRepository, orderService);
        then(driverRepository).should(inOrder).findById(1L);     // Bước 1
        then(orderRepository).should(inOrder).findById(1L);      // Bước 2
        then(orderService).should(inOrder).updateOrderStatus(...); // Bước 3
    }
}
```

#### 4.4.3. Cấp độ nâng cao – AdminServiceImplTest

Mock **5 dependencies** + **nhiều count() queries** cùng lúc cho Dashboard tổng hợp:

```java
@ExtendWith(MockitoExtension.class)
class AdminServiceImplTest {

    @Mock private UserRepository userRepository;
    @Mock private CustomerRepository customerRepository;
    @Mock private DriverRepository driverRepository;
    @Mock private OrderRepository orderRepository;
    @Mock private AuditLogService auditLogService;
    @InjectMocks private AdminServiceImpl adminService;

    @Test
    @DisplayName("AD-TC01: Dashboard - mock nhiều count queries cùng lúc")
    void getDashboardStats_Success() {
        // Arrange: Mock TẤT CẢ count queries
        given(orderRepository.count()).willReturn(50L);
        given(customerRepository.count()).willReturn(30L);
        given(driverRepository.count()).willReturn(10L);
        given(orderRepository.calculateRevenueAfter(any())).willReturn(BigDecimal.valueOf(5000000));
        given(orderRepository.countByStatus(OrderStatus.PENDING)).willReturn(5L);
        given(orderRepository.countByStatus(OrderStatus.IN_TRANSIT)).willReturn(3L);
        given(orderRepository.countByStatus(OrderStatus.DELIVERED)).willReturn(35L);
        given(orderRepository.countByStatus(OrderStatus.CANCELLED)).willReturn(4L);

        // Act
        DashboardResponse response = adminService.getDashboardStats();

        // Assert
        assertThat(response.getTotalOrders()).isEqualTo(50);
        assertThat(response.getTotalCustomers()).isEqualTo(30);
        assertThat(response.getTotalRevenue()).isEqualTo(BigDecimal.valueOf(5000000));

        // Verify: Tất cả repository đều được gọi
        then(orderRepository).should(times(1)).count();
        then(customerRepository).should(times(1)).count();
        then(driverRepository).should(times(1)).count();
    }

    @Test
    @DisplayName("AD-TC02: Revenue null → xử lý trả về 0 (không NPE)")
    void getDashboardStats_NullRevenue() {
        // Arrange: Revenue trả về null
        given(orderRepository.calculateRevenueAfter(any())).willReturn(null);
        // ... các mock khác trả về 0

        // Act
        DashboardResponse response = adminService.getDashboardStats();

        // Assert: Revenue = 0, không phải null (chương trình không crash)
        assertThat(response.getTotalRevenue()).isEqualTo(BigDecimal.ZERO);
    }
}
```

---

## 5. Kết quả thực nghiệm

### 5.1. Kết quả chạy test

```
[INFO] Tests run: 158, Failures: 0, Errors: 0, Skipped: 0
[INFO] BUILD SUCCESS
[INFO] Total time: 10.236 s
```

**Tất cả 158 test cases đều PASSED, không có failures hay errors.**

### 5.2. Bảng tổng hợp kết quả theo module

| # | Module Test | Số TCs | Dependencies Mock | Kết quả | Thời gian |
|---|---|:---:|:---:|:---:|:---:|
| 1 | AuthServiceImplTest | 22 | 11 | ✅ PASSED | ~0.5s |
| 2 | OrderServiceImplTest | 17 | 10 | ✅ PASSED | ~0.4s |
| 3 | PricingServiceImplTest | 22 | 0 | ✅ PASSED | ~0.04s |
| 4 | VoucherServiceImplTest | 15 | 1 | ✅ PASSED | ~0.1s |
| 5 | CustomerServiceImplTest | 12 | 4 | ✅ PASSED | ~0.1s |
| 6 | DriverServiceImplTest | 12 | 5 | ✅ PASSED | ~0.1s |
| 7 | JwtTokenProviderTest | 11 | 0 | ✅ PASSED | ~0.5s |
| 8 | PaymentServiceImplTest | 10 | 2 | ✅ PASSED | ~0.1s |
| 9 | AdminServiceImplTest | 10 | 5 | ✅ PASSED | ~0.3s |
| 10 | DistanceServiceImplTest | 10 | 0 | ✅ PASSED | ~0.1s |
| 11 | NotificationServiceImplTest | 7 | 1 | ✅ PASSED | ~0.1s |
| 12 | ReviewServiceImplTest | 7 | 5 | ✅ PASSED | ~0.1s |
| 13 | CustomUserDetailsServiceTest | 5 | 1 | ✅ PASSED | ~1.2s |
| | **TỔNG CỘNG** | **158** | | **158/158 ✅** | **~10s** |

### 5.3. Kết quả JaCoCo Code Coverage

| Package | Line Coverage | Branch Coverage | Nhận xét |
|---|:---:|:---:|---|
| `service.impl` (tổng) | **83%** | **66%** | Đạt mục tiêu >80% |
| — PaymentServiceImpl | **100%** | **100%** | Hoàn hảo |
| — NotificationServiceImpl | **100%** | — | Hoàn hảo |
| — PricingServiceImpl | **100%** | **100%** | Hoàn hảo |
| — DistanceServiceImpl | **100%** | — | Hoàn hảo |
| — VoucherServiceImpl | **100%** | **94%** | Gần hoàn hảo |
| — AdminServiceImpl | **99%** | **83%** | Rất tốt |
| — OrderServiceImpl | **90%** | **51%** | Tốt |
| — CustomerServiceImpl | **86%** | **70%** | Tốt |
| — ReviewServiceImpl | **86%** | **85%** | Tốt |
| — AuthServiceImpl | **84%** | **50%** | Tốt |
| — DriverServiceImpl | **83%** | **90%** | Tốt |

### 5.4. Tổng hợp kỹ thuật Mocking đã áp dụng

| # | Kỹ thuật | Mô tả | Module minh họa |
|---|---|---|---|
| 1 | `@Mock` + `@InjectMocks` | Tạo mock và tiêm tự động | Tất cả module |
| 2 | `given().willReturn()` | Thiết lập hành vi trả về | Tất cả module |
| 3 | `given().willThrow()` | Giả lập ném exception | AuthServiceImplTest |
| 4 | `then().should(times(N))` | Xác minh gọi đúng N lần | PaymentServiceImplTest |
| 5 | `then().should(never())` | Xác minh KHÔNG gọi | CustomerServiceImplTest |
| 6 | `shouldHaveNoInteractions()` | Xác minh hoàn toàn không tương tác | DriverServiceImplTest |
| 7 | `ArgumentCaptor` | Bắt đối tượng truyền vào mock | PaymentServiceImplTest, NotificationServiceImplTest |
| 8 | `InOrder` | Kiểm tra thứ tự gọi dependency | DriverServiceImplTest, AuthServiceImplTest |
| 9 | Service-to-Service Mock | Mock Service phụ thuộc Service khác | DriverServiceImplTest |
| 10 | `willDoNothing().given()` | Stub phương thức void | AuthServiceImplTest |

### 5.5. So sánh: Có Mocking vs. Không Mocking

| Tiêu chí | Có Mocking (Mockito) | Không Mocking (Integration Test) |
|---|---|---|
| **Tốc độ** | ~19ms/test | ~200-500ms/test |
| **Phụ thuộc bên ngoài** | Không cần DB, Email, SMS | Cần MySQL, SMTP config |
| **Độ cô lập** | 100% cô lập logic | Phụ thuộc nhiều thành phần |
| **Trường hợp biên** | Dễ giả lập (null, hết hạn, hết lượt) | Khó tạo dữ liệu biên |
| **Verify hành vi** | `shouldHaveNoInteractions()`, `InOrder` | Không kiểm tra được |
| **Ổn định kết quả** | Luôn ổn định (deterministic) | Có thể thay đổi theo dữ liệu DB |
| **Chi phí bảo trì** | Thấp | Cao (quản lý test data) |

---

## 6. Kết luận

### 6.1. Tổng kết

Việc áp dụng kỹ thuật Mocking trong kiểm thử đơn vị cho hệ thống Speed Delivery đã đạt được các kết quả sau:

1. **158 test cases** được xây dựng cho **13 module**, tất cả PASSED 100%.
2. **Code coverage đạt 83%** cho tầng Service (vượt mục tiêu 80%).
3. **4 module đạt coverage 100%**: PaymentServiceImpl, NotificationServiceImpl, PricingServiceImpl, DistanceServiceImpl.
4. **Thời gian thực thi chỉ ~10 giây** cho toàn bộ 158 test cases — nhanh hơn 3-6 lần so với Integration Test.
5. **Không cần bất kỳ tài nguyên bên ngoài** nào (DB, email server, SMS gateway) để chạy test.

### 6.2. Bài học kinh nghiệm

- **Constructor Injection** giúp việc Mocking trở nên dễ dàng — Mockito tự tiêm mock qua `@InjectMocks`.
- **BDDMockito** giúp code test đọc tự nhiên hơn: `given...willReturn` → `then...should`.
- **ArgumentCaptor** là công cụ mạnh để kiểm tra entity trước khi lưu vào DB — đặc biệt hữu ích khi entity được tạo bên trong Service.
- **shouldHaveNoInteractions()** giúp đảm bảo fail-fast: khi validation lỗi thì không có dependency nào phía sau bị gọi.

### 6.3. Hướng phát triển

- Bổ sung test cho các Service tích hợp bên ngoài (EmailService, MapService, SMSService).
- Viết Integration Test với `@SpringBootTest` để kiểm thử tích hợp giữa các lớp.
- Tích hợp vào pipeline CI/CD để tự động chạy test khi push code.
- Nâng Branch Coverage lên >80% bằng cách bổ sung test cases cho các nhánh chưa bao phủ.
