# Chương 3: Thực nghiệm và Đánh giá

## 3.1. Đối tượng thực nghiệm

Đối tượng thực nghiệm của đề tài là hệ thống **Speed Delivery** – Hệ thống giao hàng nhanh, được xây dựng theo kiến trúc **3 lớp (3-Layer Architecture)**: Controller → Service → Repository. Kỹ thuật Mocking được áp dụng để kiểm thử đơn vị (Unit Test) tại **tầng Service** – nơi chứa toàn bộ logic nghiệp vụ cốt lõi của hệ thống.

### 3.1.1. Kiến trúc hệ thống và các thành phần phụ thuộc

Hệ thống Speed Delivery gồm **6 module nghiệp vụ chính** cần kiểm thử, mỗi module là một lớp Service Implementation phụ thuộc vào nhiều thành phần bên ngoài (Repository truy xuất CSDL, Service khác, thư viện bảo mật...):

| Module (Class Under Test) | Số Dependencies | Các phụ thuộc cần Mock |
|---|:---:|---|
| `AuthServiceImpl` | 11 | UserRepository, RoleRepository, CustomerRepository, DriverRepository, RefreshTokenRepository, PasswordEncoder, AuthenticationManager, JwtTokenProvider, OTPService, EmailService, AuditLogService |
| `OrderServiceImpl` | 10 | OrderRepository, CustomerRepository, DriverRepository, OrderHistoryRepository, PaymentService, PricingService, NotificationService, VoucherService, DistanceService, AuditLogService |
| `PaymentServiceImpl` | 2 | PaymentRepository, OrderRepository |
| `CustomerServiceImpl` | 4 | UserRepository, CustomerRepository, AddressRepository, AuditLogService |
| `DriverServiceImpl` | 5 | DriverRepository, OrderRepository, OrderService, NotificationService, AuditLogService |
| `AdminServiceImpl` | 5 | UserRepository, CustomerRepository, DriverRepository, OrderRepository, AuditLogService |

Ngoài ra, hệ thống còn có các module **không có phụ thuộc bên ngoài** (pure logic) được test trực tiếp không cần Mock:

| Module (No Dependencies) | Chức năng |
|---|---|
| `PricingServiceImpl` | Tính giá giao hàng (giá cơ bản + khoảng cách + phụ thu trọng lượng) |
| `DistanceServiceImpl` | Tính khoảng cách Haversine giữa 2 tọa độ GPS |
| `JwtTokenProvider` | Tạo, xác thực và trích xuất thông tin từ JWT token |

### 3.1.2. Mã nguồn các thành phần tiêu biểu

Dưới đây trình bày mã nguồn của **3 module tiêu biểu** minh họa cho 3 cấp độ phức tạp khác nhau của kỹ thuật Mocking:

**Module 1 – PaymentServiceImpl (2 Dependencies – Mức cơ bản):**
```java
@Service
@RequiredArgsConstructor
public class PaymentServiceImpl implements PaymentService {
    private final PaymentRepository paymentRepository; // Phụ thuộc CSDL
    private final OrderRepository orderRepository;     // Phụ thuộc CSDL

    @Override
    public boolean processPayment(Long orderId, BigDecimal amount, PaymentMethod method) {
        // 1. Tìm đơn hàng trong CSDL
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", orderId));
        // 2. Validate số tiền
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new PaymentFailedException("Số tiền thanh toán không hợp lệ");
        }
        // 3. Tạo Payment entity và lưu vào CSDL
        Payment payment = Payment.builder()
                .order(order).paymentMethod(method).amount(amount)
                .paymentStatus(method == PaymentMethod.CASH ? PaymentStatus.PENDING : PaymentStatus.COMPLETED)
                .transactionId("TXN-" + System.currentTimeMillis())
                .paidAt(method != PaymentMethod.CASH ? LocalDateTime.now() : null)
                .build();
        paymentRepository.save(payment);
        return true;
    }

    @Override
    public boolean refundPayment(Long orderId) {
        return paymentRepository.findByOrderId(orderId)
                .map(payment -> {
                    payment.setPaymentStatus(PaymentStatus.REFUNDED);
                    paymentRepository.save(payment);
                    return true;
                }).orElse(false);
    }
}
```

**Module 2 – DriverServiceImpl (5 Dependencies – Mức trung bình, có Service-to-Service):**
```java
@Service
@RequiredArgsConstructor
public class DriverServiceImpl implements DriverService {
    private final DriverRepository driverRepository;       // Phụ thuộc CSDL
    private final OrderRepository orderRepository;         // Phụ thuộc CSDL
    private final OrderService orderService;               // Phụ thuộc Service khác (Service-to-Service)
    private final NotificationService notificationService; // Phụ thuộc Service khác
    private final AuditLogService auditLogService;         // Phụ thuộc Service khác

    @Override
    public OrderResponse acceptOrder(Long driverId, Long orderId) {
        // 1. Kiểm tra driver tồn tại
        Driver driver = driverRepository.findById(driverId)
                .orElseThrow(() -> new ResourceNotFoundException("Driver", "id", driverId));
        // 2. Kiểm tra driver khả dụng
        if (!driver.getIsAvailable()) {
            throw new BadRequestException("Tài xế hiện không khả dụng");
        }
        // 3. Ủy quyền (delegate) cho OrderService xử lý gán tài xế
        return orderService.assignDriver(orderId, driverId);
    }

    @Override
    public OrderResponse completeDelivery(Long driverId, Long orderId) {
        Driver driver = driverRepository.findById(driverId)
                .orElseThrow(() -> new ResourceNotFoundException("Driver", "id", driverId));
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", orderId));
        // Kiểm tra đơn hàng thuộc về tài xế này
        if (order.getDriver() == null || !order.getDriver().getId().equals(driverId)) {
            throw new BadRequestException("Đơn hàng không thuộc về tài xế này");
        }
        if (order.getStatus() != OrderStatus.IN_TRANSIT) {
            throw new BadRequestException("Đơn hàng chưa đang giao để hoàn thành");
        }
        return orderService.updateOrderStatus(orderId, "DELIVERED", driver.getUser().getId());
    }
}
```

**Module 3 – AdminServiceImpl (5 Dependencies – Mức nâng cao, Dashboard tổng hợp):**
```java
@Service
@RequiredArgsConstructor
public class AdminServiceImpl implements AdminService {
    private final UserRepository userRepository;
    private final CustomerRepository customerRepository;
    private final DriverRepository driverRepository;
    private final OrderRepository orderRepository;
    private final AuditLogService auditLogService;

    @Override
    public DashboardResponse getDashboardStats() {
        // Mock nhiều count() queries cùng lúc
        long totalOrders = orderRepository.count();
        long totalCustomers = customerRepository.count();
        long totalDrivers = driverRepository.count();
        BigDecimal totalRevenue = orderRepository.calculateRevenueAfter(startOfMonth);
        long pendingOrders = orderRepository.countByStatus(OrderStatus.PENDING);
        // ... tổng hợp nhiều thống kê từ nhiều repository khác nhau

        return DashboardResponse.builder()
                .totalOrders(totalOrders).totalCustomers(totalCustomers)
                .totalRevenue(totalRevenue != null ? totalRevenue : BigDecimal.ZERO)
                .build();
    }

    @Override
    public void toggleUserActive(Long userId, boolean active) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        user.setIsActive(active);
        userRepository.save(user);
        auditLogService.log(null, "TOGGLE_USER_ACTIVE", "User", userId,
                "User " + (active ? "activated" : "deactivated"));
    }
}
```

## 3.2. Môi trường thực nghiệm

Môi trường phần mềm và thư viện được sử dụng để xây dựng và thực thi các kịch bản kiểm thử đơn vị:

| Thành phần | Phiên bản | Vai trò |
|---|---|---|
| **Ngôn ngữ lập trình** | Java (JDK 21) | Ngôn ngữ phát triển chính |
| **Framework ứng dụng** | Spring Boot 3.4.1 | Framework backend |
| **Framework kiểm thử** | JUnit 5 (JUnit Jupiter) | Thực thi test cases |
| **Framework Mocking** | Mockito 5.x (BDDMockito) | Giả lập dependencies |
| **Thư viện Assertion** | AssertJ 3.x | Kiểm tra kết quả (fluent API) |
| **Code Coverage** | JaCoCo 0.8.12 | Đo độ bao phủ mã nguồn |
| **Build Tool** | Apache Maven 3.x | Quản lý thư viện và build |
| **IDE** | IntelliJ IDEA | Môi trường phát triển |

**Cấu hình JaCoCo trong `pom.xml`** – Yêu cầu bao phủ tối thiểu:
```xml
<rules>
    <rule>
        <element>BUNDLE</element>
        <limits>
            <limit><counter>LINE</counter><value>COVEREDRATIO</value><minimum>0.90</minimum></limit>
            <limit><counter>METHOD</counter><value>COVEREDRATIO</value><minimum>0.90</minimum></limit>
            <limit><counter>BRANCH</counter><value>COVEREDRATIO</value><minimum>0.85</minimum></limit>
        </limits>
    </rule>
</rules>
```

## 3.3. Thiết kế các kịch bản Unit Test

Dựa trên logic nghiệp vụ của từng module, các kịch bản kiểm thử (Test Cases) được thiết kế bao phủ cả **luồng thành công (Happy Path)** và **luồng ngoại lệ/lỗi (Edge Cases/Exceptions)**. Tổng cộng **56 kịch bản mới** được thiết kế cho 6 module chưa có test.

### 3.3.1. Module PaymentServiceImpl (10 Test Cases)

| Mã TC | Tên kịch bản | Đầu vào | Trạng thái Mock Data | Kết quả mong đợi |
|---|---|---|---|---|
| PM-TC01 | Thanh toán tiền mặt thành công | orderId=1, amount=40000, method=CASH | `findById` → Order hợp lệ | Payment lưu với status=PENDING, return true |
| PM-TC02 | Thanh toán online thành công | orderId=1, amount=40000, method=BANK_TRANSFER | `findById` → Order hợp lệ | Payment lưu với status=COMPLETED, paidAt≠null |
| PM-TC03 | Order không tồn tại | orderId=999 | `findById` → Optional.empty() | ResourceNotFoundException |
| PM-TC04 | Số tiền null | amount=null | `findById` → Order hợp lệ | PaymentFailedException |
| PM-TC05 | Số tiền ≤ 0 | amount=-1000 | `findById` → Order hợp lệ | PaymentFailedException |
| PM-TC06 | ArgumentCaptor kiểm tra Payment saved | Dữ liệu hợp lệ | `findById` → Order | Capture Payment: verify transactionId bắt đầu "TXN-" |
| PM-TC07 | Hoàn tiền thành công | orderId=1 | `findByOrderId` → Payment | status=REFUNDED, return true |
| PM-TC08 | Hoàn tiền – không tìm thấy payment | orderId=999 | `findByOrderId` → empty | return false, PaymentRepository.save() KHÔNG gọi |
| PM-TC09 | Trạng thái thanh toán – tìm thấy | orderId=1 | `findByOrderId` → Payment(COMPLETED) | return "COMPLETED" |
| PM-TC10 | Trạng thái thanh toán – không tìm thấy | orderId=999 | `findByOrderId` → empty | return "NOT_FOUND" |

### 3.3.2. Module CustomerServiceImpl (12 Test Cases)

| Mã TC | Tên kịch bản | Đầu vào | Trạng thái Mock Data | Kết quả mong đợi |
|---|---|---|---|---|
| CS-TC01 | Lấy profile thành công | email="customer@speed.vn" | `findByEmail` → User | UserResponse hợp lệ |
| CS-TC02 | Profile – user không tồn tại | email="x@x.vn" | `findByEmail` → empty | ResourceNotFoundException |
| CS-TC03 | Cập nhật fullName | email, fullName mới | `findByEmail` → User | fullName cập nhật, auditLog ghi nhận |
| CS-TC04 | Cập nhật SĐT trùng | SĐT đã tồn tại | `existsByPhone` → true | DuplicateResourceException, KHÔNG save |
| CS-TC05 | Lấy danh sách địa chỉ | customerId=1 | `findById` → Customer | List\<AddressResponse\> |
| CS-TC06 | Thêm địa chỉ mới | customerId=1, AddressRequest | `findById` → Customer | AddressResponse, auditLog ghi nhận |
| CS-TC07 | Thêm địa chỉ mặc định | isDefault=true | Có địa chỉ default cũ | Địa chỉ cũ reset, mới thành default |
| CS-TC08 | Cập nhật địa chỉ thành công | customerId=1, addressId=1 | Address thuộc customer | AddressResponse cập nhật |
| CS-TC09 | Cập nhật địa chỉ không thuộc customer | customerId=1, addressId khác | Address(customerId=2) | BadRequestException |
| CS-TC10 | Xóa địa chỉ thành công | customerId=1, addressId=1 | Address thuộc customer | delete() gọi |
| CS-TC11 | Xóa địa chỉ không thuộc customer | customerId=1, addressId khác | Address(customerId=2) | BadRequestException, delete() KHÔNG gọi |
| CS-TC12 | Đặt địa chỉ mặc định | customerId=1, addressId=2 | Địa chỉ tồn tại | Reset cũ + set mới |

### 3.3.3. Module DriverServiceImpl (12 Test Cases)

| Mã TC | Tên kịch bản | Đầu vào | Trạng thái Mock Data | Kết quả mong đợi |
|---|---|---|---|---|
| DR-TC01 | Bật trạng thái khả dụng | driverId=1, available=true | `findById` → Driver(OFFLINE) | status=ONLINE, isAvailable=true |
| DR-TC02 | Tắt trạng thái khả dụng | driverId=1, available=false | `findById` → Driver(ONLINE) | status=OFFLINE, isAvailable=false |
| DR-TC03 | Toggle – driver không tồn tại | driverId=999 | `findById` → empty | ResourceNotFoundException |
| DR-TC04 | Nhận đơn hàng thành công | driverId=1, orderId=1 | Driver available, `assignDriver` → OrderResponse | **OrderService.assignDriver** được gọi |
| DR-TC05 | Nhận đơn – tài xế không khả dụng | driverId=1 (unavailable) | Driver(unavailable) | BadRequestException, **OrderService KHÔNG gọi** |
| DR-TC06 | Từ chối đơn hàng | driverId=1, orderId=1 | Driver, Order tồn tại | auditLog + notification gửi customer |
| DR-TC07 | Hoàn thành giao hàng thành công | driverId=1, orderId=1 | Driver là owner, status=IN_TRANSIT | **OrderService.updateOrderStatus** gọi |
| DR-TC08 | Hoàn thành – đơn không thuộc driver | driverId khác | Order.driver.id ≠ driverId | BadRequestException |
| DR-TC09 | Hoàn thành – đơn chưa đang giao | status=PENDING | status ≠ IN_TRANSIT | BadRequestException |
| DR-TC10 | Lịch sử giao hàng | driverId=1, pageable | `findById` → Driver | Page\<OrderResponse\> |
| DR-TC11 | Lấy thu nhập | driverId=1 | earnings=800000 | return 800000 |
| DR-TC12 | Thu nhập – driver không tồn tại | driverId=999 | `findById` → empty | ResourceNotFoundException |

### 3.3.4. Module AdminServiceImpl (10 Test Cases)

| Mã TC | Tên kịch bản | Đầu vào | Trạng thái Mock Data | Kết quả mong đợi |
|---|---|---|---|---|
| AD-TC01 | Dashboard stats bình thường | — | count→50, 30, 10; revenue→5M | DashboardResponse đầy đủ |
| AD-TC02 | Dashboard – revenue null | — | `calculateRevenueAfter` → null | revenue = 0 (xử lý null) |
| AD-TC03 | Danh sách users (phân trang) | Pageable(0,10) | `findAll` → Page\<User\> | Page\<UserResponse\> |
| AD-TC04 | Lấy user theo ID | userId=1 | `findById` → User | UserResponse |
| AD-TC05 | User không tồn tại | userId=999 | `findById` → empty | ResourceNotFoundException |
| AD-TC06 | Kích hoạt tài khoản | userId=1, active=true | `findById` → User(inactive) | isActive=true, auditLog "activated" |
| AD-TC07 | Vô hiệu hóa tài khoản | userId=1, active=false | `findById` → User(active) | isActive=false, auditLog "deactivated" |
| AD-TC08 | Toggle – user không tồn tại | userId=999 | `findById` → empty | ResourceNotFoundException |
| AD-TC09 | Xóa user thành công | userId=1 | `findById` → User | delete() gọi, auditLog ghi |
| AD-TC10 | Xóa user không tồn tại | userId=999 | `findById` → empty | ResourceNotFoundException |

### 3.3.5. Module NotificationServiceImpl (7 Test Cases)

| Mã TC | Tên kịch bản | Đầu vào | Trạng thái Mock Data | Kết quả mong đợi |
|---|---|---|---|---|
| NF-TC01 | Gửi notification thành công | userId, title, message, type | save → Notification | isRead=false, save() gọi 1 lần |
| NF-TC02 | Gửi order notification | userId, orderId, title, message | save → Notification | type=ORDER, referenceId=orderId |
| NF-TC03 | ArgumentCaptor verify nội dung | Dữ liệu bất kỳ | — | Capture Notification, verify title, message |
| NF-TC04 | Lấy notifications (phân trang) | userId, pageable | `findByUserId` → Page | List\<NotificationResponse\> |
| NF-TC05 | Đánh dấu đã đọc – thành công | notificationId=1 | `findById` → Notification | isRead=true, save() gọi |
| NF-TC06 | Đánh dấu đã đọc – không tìm thấy | notificationId=999 | `findById` → empty | Không throw, save() KHÔNG gọi |
| NF-TC07 | Đếm notification chưa đọc | userId=1 | `countByUserIdAndIsReadFalse` → 5 | return 5 |

### 3.3.6. Module CustomUserDetailsService (5 Test Cases)

| Mã TC | Tên kịch bản | Đầu vào | Trạng thái Mock Data | Kết quả mong đợi |
|---|---|---|---|---|
| UD-TC01 | Load user thành công | email="admin@speed.vn" | `findByEmail` → User(active, ROLE_ADMIN) | UserDetails: enabled=true, authority=ROLE_ADMIN |
| UD-TC02 | Tài khoản bị khóa | email="locked@speed.vn" | `findByEmail` → User(inactive) | UserDetails: disabled=true |
| UD-TC03 | User không tồn tại | email="x@x.vn" | `findByEmail` → empty | UsernameNotFoundException |
| UD-TC04 | User có nhiều roles | email="admin@speed.vn" | User(ADMIN, CUSTOMER) | authorities chứa cả 2 roles |
| UD-TC05 | Verify repository gọi 1 lần | email bất kỳ | `findByEmail` → User | `should(times(1)).findByEmail()` |

## 3.4. Xây dựng và thực thi Unit Test với Mockito

Tất cả các bài kiểm thử đơn vị đều tuân thủ **pattern Arrange → Act → Assert → Verify** và sử dụng **BDDMockito thuần túy** (`given/willReturn`, `then/should`). Dưới đây là mã nguồn kiểm thử tiêu biểu cho từng cấp độ phức tạp:

### 3.4.1. Cấp độ cơ bản – PaymentServiceImplTest (Mock 2 Repository)

```java
@ExtendWith(MockitoExtension.class)
@DisplayName("PaymentServiceImpl Unit Tests")
class PaymentServiceImplTest {

    @Mock private PaymentRepository paymentRepository; // Giả lập PaymentRepository
    @Mock private OrderRepository orderRepository;     // Giả lập OrderRepository
    @InjectMocks private PaymentServiceImpl paymentService; // Tiêm Mock vào Service

    private Order testOrder;

    @BeforeEach
    void setUp() {
        testOrder = Order.builder().id(1L).orderCode("SPD12345678").build();
    }

    @Test
    @DisplayName("PM-TC01: Thanh toán tiền mặt thành công - status = PENDING")
    void processPayment_Cash_Success() {
        // Arrange: Thiết lập hành vi Mock
        given(orderRepository.findById(1L)).willReturn(Optional.of(testOrder));
        given(paymentRepository.save(any(Payment.class))).willReturn(Payment.builder().build());

        // Act: Thực thi hàm cần test
        boolean result = paymentService.processPayment(1L, BigDecimal.valueOf(40000), PaymentMethod.CASH);

        // Assert: Kiểm tra kết quả
        assertThat(result).isTrue();

        // Verify: Xác minh phụ thuộc đã được gọi đúng
        then(orderRepository).should(times(1)).findById(1L);
        then(paymentRepository).should(times(1)).save(any(Payment.class));
    }

    @Test
    @DisplayName("PM-TC03: Order không tồn tại → ResourceNotFoundException")
    void processPayment_OrderNotFound() {
        // Arrange: OrderRepository trả về empty
        given(orderRepository.findById(999L)).willReturn(Optional.empty());

        // Act & Assert: Phải throw ResourceNotFoundException
        assertThatThrownBy(() -> paymentService.processPayment(999L, BigDecimal.valueOf(40000), PaymentMethod.CASH))
                .isInstanceOf(ResourceNotFoundException.class);

        // Verify: PaymentRepository KHÔNG được gọi save (fail-fast)
        then(paymentRepository).shouldHaveNoInteractions();
    }

    @Test
    @DisplayName("PM-TC06: ArgumentCaptor - kiểm tra Payment được save đúng dữ liệu")
    void processPayment_CapturePaymentSaved() {
        // Arrange: Chuẩn bị ArgumentCaptor để bắt đối tượng
        ArgumentCaptor<Payment> paymentCaptor = ArgumentCaptor.forClass(Payment.class);
        given(orderRepository.findById(1L)).willReturn(Optional.of(testOrder));
        given(paymentRepository.save(any(Payment.class))).willReturn(Payment.builder().build());

        // Act: Thanh toán tiền mặt
        paymentService.processPayment(1L, BigDecimal.valueOf(50000), PaymentMethod.CASH);

        // Verify: Capture đối tượng Payment truyền vào save()
        then(paymentRepository).should().save(paymentCaptor.capture());

        // Assert: Kiểm tra Payment captured
        Payment captured = paymentCaptor.getValue();
        assertThat(captured.getOrder()).isEqualTo(testOrder);
        assertThat(captured.getPaymentMethod()).isEqualTo(PaymentMethod.CASH);
        assertThat(captured.getPaymentStatus()).isEqualTo(PaymentStatus.PENDING);
        assertThat(captured.getTransactionId()).startsWith("TXN-");
    }
}
```

### 3.4.2. Cấp độ trung bình – DriverServiceImplTest (Mock Service-to-Service)

```java
@ExtendWith(MockitoExtension.class)
@DisplayName("DriverServiceImpl Unit Tests")
class DriverServiceImplTest {

    @Mock private DriverRepository driverRepository;
    @Mock private OrderRepository orderRepository;
    @Mock private OrderService orderService;           // Mock Service-to-Service
    @Mock private NotificationService notificationService;
    @Mock private AuditLogService auditLogService;
    @InjectMocks private DriverServiceImpl driverService;

    @Test
    @DisplayName("DR-TC04: Nhận đơn hàng thành công - delegate sang OrderService")
    void acceptOrder_Success() {
        // Arrange: Driver khả dụng
        given(driverRepository.findById(1L)).willReturn(Optional.of(testDriver));
        OrderResponse expected = OrderResponse.builder().id(1L).status("ASSIGNED").build();
        given(orderService.assignDriver(1L, 1L)).willReturn(expected);

        // Act
        OrderResponse result = driverService.acceptOrder(1L, 1L);

        // Assert
        assertThat(result.getStatus()).isEqualTo("ASSIGNED");

        // Verify: OrderService.assignDriver được gọi (Service-to-Service)
        then(orderService).should(times(1)).assignDriver(1L, 1L);
    }

    @Test
    @DisplayName("DR-TC05: Nhận đơn – tài xế không khả dụng → OrderService KHÔNG được gọi")
    void acceptOrder_DriverUnavailable() {
        // Arrange: Driver tồn tại nhưng không khả dụng
        testDriver.setIsAvailable(false);
        given(driverRepository.findById(1L)).willReturn(Optional.of(testDriver));

        // Act & Assert
        assertThatThrownBy(() -> driverService.acceptOrder(1L, 1L))
                .isInstanceOf(BadRequestException.class);

        // Verify: OrderService KHÔNG được gọi khi validate thất bại
        then(orderService).shouldHaveNoInteractions();
    }

    @Test
    @DisplayName("DR-TC07: Hoàn thành giao hàng - InOrder verify thứ tự gọi")
    void completeDelivery_Success() {
        // Arrange
        given(driverRepository.findById(1L)).willReturn(Optional.of(testDriver));
        given(orderRepository.findById(1L)).willReturn(Optional.of(testOrder));
        given(orderService.updateOrderStatus(1L, "DELIVERED", 2L))
                .willReturn(OrderResponse.builder().status("DELIVERED").build());

        // Act
        OrderResponse result = driverService.completeDelivery(1L, 1L);
        assertThat(result.getStatus()).isEqualTo("DELIVERED");

        // Verify: Kiểm tra thứ tự gọi dependency bằng InOrder
        InOrder inOrder = inOrder(driverRepository, orderRepository, orderService);
        then(driverRepository).should(inOrder).findById(1L);
        then(orderRepository).should(inOrder).findById(1L);
        then(orderService).should(inOrder).updateOrderStatus(1L, "DELIVERED", 2L);
    }
}
```

### 3.4.3. Cấp độ nâng cao – AdminServiceImplTest (Mock Dashboard tổng hợp)

```java
@ExtendWith(MockitoExtension.class)
@DisplayName("AdminServiceImpl Unit Tests")
class AdminServiceImplTest {

    @Mock private UserRepository userRepository;
    @Mock private CustomerRepository customerRepository;
    @Mock private DriverRepository driverRepository;
    @Mock private OrderRepository orderRepository;
    @Mock private AuditLogService auditLogService;
    @InjectMocks private AdminServiceImpl adminService;

    @Test
    @DisplayName("AD-TC01: Dashboard stats - mock nhiều count() queries cùng lúc")
    void getDashboardStats_Success() {
        // Arrange: Mock TẤT CẢ count queries cho Dashboard
        given(orderRepository.count()).willReturn(50L);
        given(customerRepository.count()).willReturn(30L);
        given(driverRepository.count()).willReturn(10L);
        given(orderRepository.calculateRevenueAfter(any())).willReturn(BigDecimal.valueOf(5000000));
        given(orderRepository.countByStatus(OrderStatus.PENDING)).willReturn(5L);
        given(orderRepository.countByStatus(OrderStatus.IN_TRANSIT)).willReturn(3L);
        given(orderRepository.countByStatus(OrderStatus.PICKING_UP)).willReturn(2L);
        given(orderRepository.countByStatus(OrderStatus.ASSIGNED)).willReturn(1L);
        given(orderRepository.countByStatus(OrderStatus.DELIVERED)).willReturn(35L);
        given(orderRepository.countByStatus(OrderStatus.CANCELLED)).willReturn(4L);

        // Act
        DashboardResponse response = adminService.getDashboardStats();

        // Assert: Kiểm tra tất cả thống kê
        assertThat(response.getTotalOrders()).isEqualTo(50);
        assertThat(response.getTotalCustomers()).isEqualTo(30);
        assertThat(response.getDeliveringOrders()).isEqualTo(6); // 3 + 2 + 1
        assertThat(response.getTotalRevenue()).isEqualTo(BigDecimal.valueOf(5000000));

        // Verify: Tất cả repository đều được gọi
        then(orderRepository).should(times(1)).count();
        then(customerRepository).should(times(1)).count();
        then(driverRepository).should(times(1)).count();
    }

    @Test
    @DisplayName("AD-TC02: Dashboard – revenue null → xử lý trả về 0")
    void getDashboardStats_NullRevenue() {
        // Arrange: Revenue trả về null (chưa có đơn delivered)
        given(orderRepository.count()).willReturn(0L);
        given(customerRepository.count()).willReturn(0L);
        given(driverRepository.count()).willReturn(0L);
        given(orderRepository.calculateRevenueAfter(any())).willReturn(null);
        given(orderRepository.countByStatus(any())).willReturn(0L);

        // Act
        DashboardResponse response = adminService.getDashboardStats();

        // Assert: Revenue phải là 0, không phải null
        assertThat(response.getTotalRevenue()).isEqualTo(BigDecimal.ZERO);
    }
}
```

## 3.5. Kết quả thực nghiệm

### 3.5.1. Tổng hợp kết quả chạy test

Sau khi xây dựng và thực thi toàn bộ bộ kiểm thử đơn vị, kết quả thu được như sau:

```
[INFO] Tests run: 158, Failures: 0, Errors: 0, Skipped: 0
[INFO] BUILD SUCCESS
[INFO] Total time: 10.236 s
```

### 3.5.2. Bảng tổng hợp theo module

| # | Module Test | Đối tượng kiểm thử | Số Dependencies Mock | Số Test Cases | Kết quả | Thời gian |
|---|---|---|:---:|:---:|:---:|:---:|
| 1 | AuthServiceImplTest | AuthServiceImpl | 11 | 22 | ✅ PASSED | ~0.5s |
| 2 | OrderServiceImplTest | OrderServiceImpl | 10 | 17 | ✅ PASSED | ~0.4s |
| 3 | PaymentServiceImplTest | PaymentServiceImpl | 2 | 10 | ✅ PASSED | ~0.1s |
| 4 | CustomerServiceImplTest | CustomerServiceImpl | 4 | 12 | ✅ PASSED | ~0.1s |
| 5 | DriverServiceImplTest | DriverServiceImpl | 5 | 12 | ✅ PASSED | ~0.1s |
| 6 | AdminServiceImplTest | AdminServiceImpl | 5 | 10 | ✅ PASSED | ~0.3s |
| 7 | NotificationServiceImplTest | NotificationServiceImpl | 1 | 7 | ✅ PASSED | ~0.1s |
| 8 | CustomUserDetailsServiceTest | CustomUserDetailsService | 1 | 5 | ✅ PASSED | ~1.2s |
| 9 | VoucherServiceImplTest | VoucherServiceImpl | 1 | 15 | ✅ PASSED | ~0.1s |
| 10 | ReviewServiceImplTest | ReviewServiceImpl | 5 | 7 | ✅ PASSED | ~0.1s |
| 11 | PricingServiceImplTest | PricingServiceImpl | 0 | 22 | ✅ PASSED | ~0.04s |
| 12 | DistanceServiceImplTest | DistanceServiceImpl | 0 | 10 | ✅ PASSED | ~0.1s |
| 13 | JwtTokenProviderTest | JwtTokenProvider | 0 | 11 | ✅ PASSED | ~0.5s |
| | **TỔNG CỘNG** | **13 module** | | **158** | **158/158 PASSED** | **~10s** |

### 3.5.3. Tổng hợp kỹ thuật Mocking đã áp dụng

| Kỹ thuật Mockito | Mô tả | Module minh họa tiêu biểu |
|---|---|---|
| `@Mock` + `@InjectMocks` | Tạo đối tượng giả lập và tiêm tự động vào Class Under Test | Tất cả 10 module có mock |
| `given(...).willReturn(...)` | Thiết lập hành vi trả về cho phương thức của Mock (BDDMockito) | Tất cả module |
| `given(...).willThrow(...)` | Giả lập Mock ném ngoại lệ | AuthServiceImplTest |
| `then(...).should(times(N))` | Xác minh phương thức Mock được gọi đúng N lần | PaymentServiceImplTest, AuthServiceImplTest |
| `then(...).should(never())` | Xác minh phương thức Mock KHÔNG được gọi | PaymentServiceImplTest, CustomerServiceImplTest |
| `shouldHaveNoInteractions()` | Xác minh Mock hoàn toàn không bị tương tác | AuthServiceImplTest, DriverServiceImplTest |
| `ArgumentCaptor` | Bắt đối tượng truyền vào Mock để kiểm tra chi tiết | PaymentServiceImplTest, NotificationServiceImplTest |
| `InOrder` | Kiểm tra thứ tự gọi giữa các Mock | DriverServiceImplTest, AuthServiceImplTest |
| Service-to-Service Mock | Mock một Service phụ thuộc Service khác | DriverServiceImplTest (mock OrderService) |
| `willDoNothing().given(...)` | Stub phương thức void | AuthServiceImplTest (emailService) |

## 3.6. Đánh giá kết quả thực nghiệm

Sau khi xây dựng và thực thi bộ kiểm thử đơn vị cho toàn bộ hệ thống Speed Delivery, kết quả thu được phản ánh rõ rệt ưu điểm của việc áp dụng kỹ thuật Mocking:

### 3.6.1. Khả năng cô lập phụ thuộc hoàn hảo

Bộ Unit Test kiểm thử logic nghiệp vụ của **tất cả 13 module** độc lập hoàn toàn với:
- **Cơ sở dữ liệu MySQL** thật (tất cả Repository đều được Mock)
- **Cổng thanh toán** (PaymentService Mock, không kết nối bên ngoài)
- **Dịch vụ email/SMS** (EmailService, SMSService được Mock)
- **Spring Security Context** (AuthenticationManager, JwtTokenProvider được Mock)

Ngay cả khi **chưa cài đặt MySQL, chưa cấu hình SMTP server, hay chưa deploy lên server**, toàn bộ 158 test cases vẫn chạy thành công 100%.

### 3.6.2. Tốc độ thực thi vượt trội

| Phương pháp kiểm thử | Thời gian | So sánh |
|---|:---:|:---:|
| **Unit Test với Mocking** (Mockito) | **~10 giây** (bao gồm compile) | Nhanh nhất |
| Integration Test với H2 Database | ~30-60 giây | Chậm hơn 3-6x |
| Integration Test với `@SpringBootTest` | ~15-30 giây | Chậm hơn 2-3x |
| Manual Testing (test thủ công) | ~30-60 phút | Chậm hơn 180-360x |

Thời gian thực thi thuần túy (không tính compile) chỉ khoảng **~3 giây** cho 158 test cases, trung bình **~19ms/test case**.

### 3.6.3. Chủ động mô phỏng các trường hợp biên (Edge Cases)

Nhờ kỹ thuật Mocking, việc giả lập các trường hợp dữ liệu khó trở nên cực kỳ đơn giản:

| Trường hợp biên | Cách giả lập Mock | Nếu không dùng Mock |
|---|---|---|
| Revenue = null (chưa có đơn delivered) | `given(repo.calculateRevenueAfter(...)).willReturn(null)` | Phải xóa hết dữ liệu đơn hàng trong DB |
| Tài khoản bị khóa | `testUser.setIsActive(false)` | Phải UPDATE trực tiếp trong DB |
| Refresh token hết hạn | `expiresAt = LocalDateTime.now().minusDays(1)` | Phải chờ token hết hạn thật hoặc sửa DB |
| Voucher hết lượt sử dụng | `voucher.setUsedCount(100)` | Phải tạo 100 giao dịch thật |
| Driver không khả dụng | `driver.setIsAvailable(false)` | Phải gán driver vào đơn hàng khác |

### 3.6.4. Xác minh hành vi (Behavior Verification)

Bộ test không chỉ kiểm tra **dữ liệu đầu ra** mà còn đảm bảo **luồng xử lý tối ưu**:

- **Fail-fast verification**: Khi validate thất bại sớm (vd: SĐT trùng), các dependency phía sau **KHÔNG bị gọi** → tiết kiệm tài nguyên:
  ```java
  // Khi SĐT trùng → KHÔNG save User, KHÔNG ghi audit log
  then(userRepository).should(never()).save(any(User.class));
  then(auditLogService).shouldHaveNoInteractions();
  ```

- **Thứ tự gọi đúng**: Đảm bảo luồng xử lý theo đúng thứ tự nghiệp vụ:
  ```java
  // driverRepository → orderRepository → orderService (KHÔNG được đảo)
  InOrder inOrder = inOrder(driverRepository, orderRepository, orderService);
  then(driverRepository).should(inOrder).findById(1L);
  then(orderRepository).should(inOrder).findById(1L);
  then(orderService).should(inOrder).updateOrderStatus(1L, "DELIVERED", 2L);
  ```

- **Service-to-Service chaining**: Khi DriverService gọi OrderService, đảm bảo đúng phương thức, đúng tham số:
  ```java
  then(orderService).should(times(1)).assignDriver(1L, 1L);
  ```

### 3.6.5. So sánh tổng quan: Có Mock vs. Không Mock

| Tiêu chí | Có Mocking (Mockito) | Không Mocking (Integration Test) |
|---|---|---|
| **Tốc độ** | ~19ms/test | ~200-500ms/test |
| **Phụ thuộc ngoài** | Không cần DB, Email, SMS | Cần H2/MySQL, config đầy đủ |
| **Độ cô lập** | 100% cô lập logic nghiệp vụ | Phụ thuộc nhiều thành phần |
| **Edge Cases** | Dễ giả lập mọi trường hợp | Khó tạo dữ liệu biên |
| **Verify hành vi** | `shouldHaveNoInteractions()`, `InOrder` | Không kiểm tra được |
| **Chi phí bảo trì** | Thấp (không cần data fixtures) | Cao (quản lý test data) |
| **Nhược điểm** | Không kiểm tra tích hợp thực tế | Chậm, phức tạp khi setup |

## 3.7. Kết luận chương

Kết quả thực nghiệm cho thấy việc áp dụng kỹ thuật Mocking trong kiểm thử đơn vị mang lại **những ưu điểm rõ rệt** cho dự án Speed Delivery:

1. **Tốc độ kiểm thử nhanh vượt trội**: 158 test cases thực thi trong ~10 giây, nhanh hơn 3-6 lần so với Integration Test.

2. **Cô lập hoàn toàn phụ thuộc bên ngoài**: Không cần CSDL, email server, hay cổng thanh toán để chạy test. Phù hợp cho môi trường CI/CD.

3. **Bao phủ đa dạng kịch bản**: Dễ dàng giả lập các trường hợp biên (revenue null, token hết hạn, voucher hết lượt) mà rất khó tạo trong môi trường thực.

4. **Xác minh hành vi luồng xử lý**: Không chỉ kiểm tra output, còn đảm bảo luồng xử lý nội bộ đúng logic (thứ tự gọi, fail-fast, không gọi dependency không cần thiết).

5. **Khả năng mở rộng cao**: Pattern `@Mock` + `@InjectMocks` + `given/willReturn` có thể áp dụng cho bất kỳ module nào trong hệ thống, bất kể số lượng dependency.

Tuy nhiên, kỹ thuật Mocking **không thay thế** Integration Test mà **bổ trợ** cho nó. Trong thực tế, nên kết hợp cả Unit Test (Mocking) để kiểm thử logic nghiệp vụ và Integration Test để kiểm thử tích hợp giữa các thành phần.
