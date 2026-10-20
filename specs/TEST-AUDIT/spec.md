# TEST-AUDIT - Bổ sung unit test thuần Mockito cho AuditLogServiceImpl

## 1. Problem and goal

`AuditLogServiceImpl` là lớp ghi audit log dùng bởi 6 service nghiệp vụ khác
(`AuthServiceImpl`, `AdminServiceImpl`, `OrderServiceImpl`, `CustomerServiceImpl`,
`DriverServiceImpl`, `ReviewServiceImpl`) và cung cấp dữ liệu cho 2 endpoint quản trị
(`GET /admin/logs`, `GET /admin/logs/user/{userId}`). Hiện lớp này chưa có test class, nên hành vi
ghi log và ánh xạ `Log` → `LogResponse` không được bảo vệ khi refactor.

Mục tiêu: thêm một bộ unit test thuần Mockito cho toàn bộ 4 phương thức public của lớp, theo đúng
quy ước kiểm thử hiện có, làm bằng chứng cho luận văn về kỹ thuật Mocking ở tầng Service.

Tầng Service là phạm vi của thực nghiệm luận văn theo `GEMINI.md`: controller, entity và repository
không phải đối tượng unit test. Việc mock `LogRepository` cho phép kiểm thử cả happy path, edge case
và exception path mà không cần database.

## 2. Users and use cases

- **Lập trình viên / tác giả luận văn**: chạy bộ test để xác nhận `AuditLogServiceImpl` giữ đúng
  hành vi, đo coverage và ghi số liệu vào handoff.
- **Các service nghiệp vụ gọi `log(...)`**: cần biết entity `Log` được tạo với đúng actor, action,
  entity và details trước khi `save`.
- **Quản trị viên qua `AdminController`**: cần `getAllLogs` / `getUserLogs` trả về `Page` đã ánh xạ
  đúng, giữ nguyên thứ tự và metadata phân trang do repository cung cấp.

Use case thực tế đã có trong mã nguồn:

- `AuthServiceImpl`, `OrderServiceImpl`, ... gọi overload 5 tham số với đầy đủ user/entity.
- `AdminServiceImpl` gọi overload 5 tham số với `userId = null` cho hành động hệ thống
  (`TOGGLE_USER_ACTIVE`, `DELETE_USER`).
- `AdminController` gọi `getAllLogs(pageable)` và `getUserLogs(userId, pageable)`.
- Overload 2 tham số `log(String action, String details)` không có caller nào trong `src/main` tại
  thời điểm viết spec; vẫn phải kiểm thử vì nó là phương thức public của interface.

## 3. Scope

### 3.1 In scope

- Tạo đúng một file test mới:
  `speed-backend/src/test/java/com/speed/delivery/service/impl/AuditLogServiceImplTest.java`.
- 13 test case (`AL-TC01` … `AL-TC13`) phủ 4 phương thức public:
  - `log(Long userId, String action, String entityType, Long entityId, String details)`
  - `log(String action, String details)`
  - `getAllLogs(Pageable pageable)`
  - `getUserLogs(Long userId, Pageable pageable)`
- Kiểm thử ánh xạ đầy đủ 7 trường của `LogResponse`, metadata phân trang, trang rỗng, log hệ thống
  có `userId = null`, và ngoại lệ Spring Data lan truyền từ repository.
- Kiểm chứng tương tác mock: đúng phương thức, đúng tham số, đúng số lần, không có tương tác thừa.
- Chạy và ghi lại kết quả của `mvn -q -Dtest=AuditLogServiceImplTest test` và `mvn -q verify`
  từ `speed-backend/`.

### 3.2 Out of scope

- Không sửa production code: `AuditLogServiceImpl`, `AuditLogService`, `LogRepository`, `Log`,
  `LogResponse`, `AdminController` hay bất kỳ lớp nào khác.
- Không sửa `pom.xml`, kể cả danh sách `jacoco:check` includes.
- Không sửa, xoá hoặc copy từ `src/test/java/com/speed/delivery/demo/` (`MockingDemoTest`,
  `SpringContextDemoTest`).
- Không thêm/sửa test của lớp khác.
- Không dùng `@SpringBootTest`, `@DataJpaTest`, database, H2, network, filesystem, `Thread.sleep`,
  hay bất kỳ I/O thật nào.
- Không test controller, entity, repository, security.
- Không thêm validation, wrapper exception, hay thay đổi chính sách lỗi của production code.
- Không test nội dung log output của SLF4J, không test trường `ipAddress` (SUT không set và DTO
  không có trường này).
- Không đo hiệu năng theo kiểu benchmark; chỉ ghi thời gian chạy test từ báo cáo Surefire.

## 4. Functional requirements

- **FR-1 — Khung test thuần Mockito.** Tạo `AuditLogServiceImplTest` trong package
  `com.speed.delivery.service.impl`, dùng `@ExtendWith(MockitoExtension.class)`,
  `@Mock LogRepository`, `@InjectMocks AuditLogServiceImpl`. Không dùng Spring context.
- **FR-2 — `log(Long, String, String, Long, String)`.** Kiểm thử HP (đầy đủ tham số), ED
  (`userId = null` như caller `AdminServiceImpl`) và EX (repository `save` ném ngoại lệ). Test phải
  chứng minh SUT tạo một `Log` mới với đúng 5 giá trị truyền vào, `id`, `createdAt`, `ipAddress`
  vẫn `null`, và gọi `save` đúng một lần.
- **FR-3 — `log(String, String)`.** Kiểm thử HP, ED (`details = null`) và EX. Test phải chứng minh
  SUT tạo `Log` chỉ với `action` và `details`; `userId`, `entityType`, `entityId` là `null`; gọi
  `save` đúng một lần.
- **FR-4 — `getAllLogs(Pageable)`.** Kiểm thử HP (page có dữ liệu), ED (page rỗng, và page chứa
  log hệ thống có các trường tham chiếu `null`) và EX (repository ném ngoại lệ). Phải chứng minh
  SUT gọi đúng `findAllByOrderByCreatedAtDesc(pageable)` với chính `Pageable` được truyền vào, ánh
  xạ đủ 7 trường, giữ nguyên thứ tự nội dung và metadata trang.
- **FR-5 — `getUserLogs(Long, Pageable)`.** Kiểm thử HP, ED (page rỗng) và EX. Phải chứng minh SUT
  gọi đúng `findByUserIdOrderByCreatedAtDesc(userId, pageable)` với đúng `userId` và `Pageable`,
  ánh xạ đủ 7 trường và giữ metadata trang.
- **FR-6 — Ngoại lệ lan truyền nguyên vẹn.** Với mỗi lời gọi repository (`save`,
  `findAllByOrderByCreatedAtDesc`, `findByUserIdOrderByCreatedAtDesc`), khi repository ném
  `org.springframework.dao.DataAccessResourceFailureException` thì SUT không bắt, không nuốt,
  không bọc lại; client nhận đúng type và message.
- **FR-7 — Kiểm chứng tương tác và strict stubs.** Dùng `ArgumentCaptor<Log>` cho `save`; dùng
  tham số chính xác (không `any()`) cho các finder và `userId`; verify `times(1)`; verify finder
  còn lại và `save` là `never()` trong các test đọc; kết thúc bằng
  `shouldHaveNoMoreInteractions()` sau khi đã verify lời gọi mong đợi. Không stub thừa; không dùng
  `lenient()`.
- **FR-8 — Cấu trúc và đặt tên.** Mỗi phương thức public có một `@Nested` class; `@DisplayName`
  tiếng Việt theo mẫu `AL-TCxx: <hành vi>`; mỗi test chỉ kiểm chứng một hành vi; fixture mới trong
  `@BeforeEach`; id test ổn định từ `AL-TC01` đến `AL-TC13`.
- **FR-9 — Coverage và gate.** Bộ test đạt tối thiểu 90% line coverage cho `AuditLogServiceImpl`
  theo ngưỡng của `jacoco:check`; `mvn -q verify` từ `speed-backend/` phải thành công. Lớp hiện
  chưa nằm trong danh sách includes của `jacoco:check`, nên developer phải đọc báo cáo JaCoCo để
  xác nhận (xem §11.5).
- **FR-10 — Cách ly và tất định.** Test không phụ thuộc thứ tự chạy, không dùng thời gian hiện tại
  trong assertion, không sleep, không in ra stdout, không chạm database/network/filesystem.

## 5. Acceptance criteria

- **AC-1 (FR-1):** File `speed-backend/src/test/java/com/speed/delivery/service/impl/AuditLogServiceImplTest.java`
  tồn tại; class có `@ExtendWith(MockitoExtension.class)`, một `@Mock LogRepository`, một
  `@InjectMocks AuditLogServiceImpl`; không có `@SpringBootTest`, `@DataJpaTest`, `Thread.sleep`,
  hay import database/network.
- **AC-2 (FR-2):** `AL-TC01`, `AL-TC02`, `AL-TC03` chạy xanh và assert đúng các giá trị mô tả ở
  §11.3; `AL-TC03` assert `DataAccessResourceFailureException` với message `Database is down`.
- **AC-3 (FR-3):** `AL-TC04`, `AL-TC05`, `AL-TC06` chạy xanh và assert `Log` chỉ có `action` /
  `details`; `AL-TC06` assert đúng ngoại lệ và message như `AL-TC03`.
- **AC-4 (FR-4):** `AL-TC07`, `AL-TC08`, `AL-TC09`, `AL-TC13` chạy xanh; `AL-TC07` assert đủ 7
  trường và metadata (`totalElements = 2`, `totalPages = 1`, `number = 0`, `size = 10`);
  `AL-TC08` / `AL-TC13` không ném NPE.
- **AC-5 (FR-5):** `AL-TC10`, `AL-TC11`, `AL-TC12` chạy xanh; `AL-TC10` assert đủ 7 trường,
  metadata và đúng `userId = 5L`; `AL-TC12` assert đúng ngoại lệ và message.
- **AC-6 (FR-6):** Cả 4 test EX (`AL-TC03`, `AL-TC06`, `AL-TC09`, `AL-TC12`) assert
  `isInstanceOf(DataAccessResourceFailureException.class)` và `hasMessage("Database is down")`;
  không test nào bắt hoặc thay thế ngoại lệ.
- **AC-7 (FR-7):** Mọi test HP/ED của `log` dùng `ArgumentCaptor` và verify `save` `times(1)`;
  test đọc verify đúng finder `times(1)` với tham số chính xác, finder còn lại `never()`, `save`
  `never()`; tất cả kết thúc bằng `shouldHaveNoMoreInteractions()`.
- **AC-8 (FR-8):** Surefire báo `Tests run: 13, Failures: 0, Errors: 0, Skipped: 0`; đủ 13
  `@DisplayName` bắt đầu bằng `AL-TC01` … `AL-TC13`.
- **AC-9 (FR-9):** `mvn -q verify` trả về exit code 0; báo cáo JaCoCo của
  `AuditLogServiceImpl` có line coverage ≥ 90%; số liệu được ghi lại trong handoff kèm lệnh đo.
- **AC-10 (FR-10):** Không có `Thread.sleep`, `LocalDateTime.now()` trong assertion, `System.out`,
  `@SpringBootTest`, `@DataJpaTest`, JDBC, socket hay đọc/ghi file trong test class; chạy lại test
  class cho kết quả giống nhau.

## 6. Data and API contract

### 6.1 SUT and public methods

| Thuộc tính | Giá trị |
|---|---|
| SUT | `com.speed.delivery.service.impl.AuditLogServiceImpl` |
| Đường dẫn | `speed-backend/src/main/java/com/speed/delivery/service/impl/AuditLogServiceImpl.java` |
| Interface | `com.speed.delivery.service.AuditLogService` |
| Constructor dependency | Chỉ `LogRepository` (sinh bởi Lombok `@RequiredArgsConstructor`) |
| Public methods | `void log(Long userId, String action, String entityType, Long entityId, String details)`; `void log(String action, String details)`; `Page<LogResponse> getAllLogs(Pageable pageable)`; `Page<LogResponse> getUserLogs(Long userId, Pageable pageable)` |
| Lý do thuộc phạm vi | Tầng Service là phạm vi thực nghiệm Mocking của luận văn; mock repository cô lập hoàn toàn khỏi database |

### 6.2 Dependency / seam table

| Dependency | Type | Decision | Justification |
|---|---|---|---|
| `logRepository` | `com.speed.delivery.repository.LogRepository` (Spring Data JPA proxy) | **mock** | Là Depended-On Component ở biên (database). Mock cho phép điều khiển page, trang rỗng và ngoại lệ DB mà không cần MySQL/H2. Đây là dependency duy nhất của constructor. |
| `Pageable` | `org.springframework.data.domain.Pageable` | **real** (`PageRequest.of(0, 10)`) | Value object của framework, không phải DOC cần cô lập; dùng thật để kiểm tra SUT truyền nguyên vẹn xuống repository. |
| `Page<Log>` | `org.springframework.data.domain.Page` | **real** (`PageImpl`) | Kết quả trả về của repository; dùng `PageImpl` thật để kiểm tra `Page.map` và metadata. Không mock. |
| `Log` | `com.speed.delivery.entity.Log` | **real** (Lombok builder) | Entity là dữ liệu vào/ra, không phải DOC; mock entity sẽ che giấu lỗi ánh xạ. |
| `LogResponse` | `com.speed.delivery.dto.response.LogResponse` | **real** (Lombok builder) | DTO là kết quả của SUT; không mock. |
| SLF4J logger (`log`) | `org.slf4j.Logger` (Lombok `@Slf4j`) | **không mock, không verify** | Không phải constructor dependency; nội dung log không phải hành vi nghiệp vụ cần kiểm thử. |

Không mock SUT, entity, DTO, value object, `Pageable` hay `Page`.

### 6.3 Method contracts

| Method | Hành vi quan sát được |
|---|---|
| `log(Long userId, String action, String entityType, Long entityId, String details)` | Tạo `Log` mới qua builder với đúng 5 giá trị; `id`, `createdAt`, `ipAddress` chưa được set (SUT không set, `@PrePersist` không chạy trong unit test); gọi `logRepository.save(log)` đúng một lần; không trả về giá trị. |
| `log(String action, String details)` | Tạo `Log` mới chỉ với `action` và `details`; `userId`, `entityType`, `entityId`, `id`, `createdAt`, `ipAddress` là `null`; gọi `save` đúng một lần. |
| `getAllLogs(Pageable pageable)` | Gọi `logRepository.findAllByOrderByCreatedAtDesc(pageable)` đúng một lần; ánh xạ từng `Log` sang `LogResponse`; trả về `Page<LogResponse>` giữ nguyên thứ tự nội dung, `totalElements`, `totalPages`, `number`, `size`. |
| `getUserLogs(Long userId, Pageable pageable)` | Gọi `logRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable)` đúng một lần với đúng `userId`; ánh xạ và giữ metadata trang như trên. |

### 6.4 `Log` → `LogResponse` mapping

| `Log` | `LogResponse` | Ghi chú |
|---|---|---|
| `id` | `id` | |
| `userId` | `userId` | Có thể `null` với log hệ thống |
| `action` | `action` | |
| `entityType` | `entityType` | Có thể `null` ở overload 2 tham số |
| `entityId` | `entityId` | Có thể `null` |
| `details` | `details` | Có thể `null` |
| `createdAt` | `createdAt` | |
| `ipAddress` | — | Không có trong DTO; SUT không set; ngoài phạm vi |

### 6.5 Page contract

- `Page.map` của Spring Data trả về `PageImpl` mới với cùng `Pageable` và `total`, nội dung đã ánh
  xạ, giữ nguyên thứ tự phần tử do repository trả về.
- SUT không sắp xếp lại trong bộ nhớ; thứ tự `createdAt DESC` là trách nhiệm của tên phương thức
  repository. Test chỉ assert thứ tự được bảo toàn, không assert việc sắp xếp.
- Với `PageImpl<>(List.of(), PageRequest.of(0, 10), 0)`: `content` rỗng, `totalElements = 0`,
  `totalPages = 0`, `number = 0`, `size = 10`.

### 6.6 Failure contract

- SUT không có validation, không có try/catch, không có domain exception riêng.
- Mọi ngoại lệ từ `LogRepository` lan truyền nguyên vẹn cho caller.
- Loại ngoại lệ dùng trong test: `org.springframework.dao.DataAccessResourceFailureException`
  (có trên classpath qua `spring-tx`, đã dùng trong `MockingDemoTest`), message `Database is down`.
- Vì mỗi phương thức chỉ có đúng một lời gọi repository, sau khi lời gọi đó ném ngoại lệ thì không
  còn lời gọi downstream nào; điều này được biểu diễn bằng `shouldHaveNoMoreInteractions()`.

## 7. UI/UX behaviour

Không áp dụng. Feature chỉ thêm unit test ở tầng Service, không thay đổi API, UI hay luồng người
dùng.

## 8. Edge cases and error handling

### 8.1 Edge cases (ED)

| Edge case | Lý do | Test |
|---|---|---|
| `userId = null` khi ghi log | `AdminServiceImpl` thực tế gọi `auditLogService.log(null, ...)` cho hành động hệ thống; cột `user_id` cho phép null | `AL-TC02` |
| `details = null` ở overload 2 tham số | SUT không validate; cột `details` là `TEXT` nullable | `AL-TC05` |
| Page rỗng | Admin có thể xem trang không có log; `Page.map` phải trả page rỗng, không NPE | `AL-TC08`, `AL-TC11` |
| Log hệ thống có `userId`, `entityType`, `entityId`, `details` đều null | Kết quả của overload 2 tham số; ánh xạ phải chịu được null | `AL-TC13` |

### 8.2 Error handling (EX)

| Điều kiện | Ngoại lệ chính xác | Test |
|---|---|---|
| `logRepository.save(...)` ném lỗi DB | `org.springframework.dao.DataAccessResourceFailureException`, message `Database is down` | `AL-TC03`, `AL-TC06` |
| `logRepository.findAllByOrderByCreatedAtDesc(...)` ném lỗi DB | `org.springframework.dao.DataAccessResourceFailureException`, message `Database is down` | `AL-TC09` |
| `logRepository.findByUserIdOrderByCreatedAtDesc(...)` ném lỗi DB | `org.springframework.dao.DataAccessResourceFailureException`, message `Database is down` | `AL-TC12` |

Ghi chú bắt buộc:

- SUT **không** có validation và **không** có domain exception. Vì vậy không có test nào kỳ vọng
  `BadRequestException`, `ResourceNotFoundException` hay exception tự định nghĩa.
- Không test `action = null`: service không validate, nhưng cột `action` là `NOT NULL`; hành vi
  thực tế phụ thuộc database và sẽ là thay đổi production nếu thêm validation (ngoài phạm vi).
- Không test `pageable = null`: service không validate; Spring Data thật sẽ từ chối, còn mock sẽ
  nhận null. Đây không phải contract của SUT.
- Không test `getUserLogs(null, ...)`: không có caller và không có validation tương ứng.

## 9. Reuse plan

- **Test stack có sẵn, không thêm dependency:** JUnit 5, `MockitoExtension`, BDDMockito
  (`given`, `willThrow`, `then`, `should`, `shouldHaveNoMoreInteractions`), AssertJ
  (`assertThat`, `assertThatThrownBy`), `ArgumentCaptor`.
- **Spring Data có sẵn:** `Page`, `PageImpl`, `PageRequest`, `Pageable`.
- **Entity/DTO có sẵn:** `Log.builder()` (Lombok), `LogResponse` (Lombok), không tạo builder hay
  DTO mới.
- **Repository có sẵn:** `LogRepository` với đúng 2 finder và `save` kế thừa `JpaRepository`.
- **Exception có sẵn:** dùng `org.springframework.dao.DataAccessResourceFailureException` cho
  ngoại lệ lan truyền. Không dùng lại các domain exception trong `com.speed.delivery.exception`
  vì SUT không ném chúng.
- **Quy ước tham chiếu:** `NotificationServiceImplTest` (ArgumentCaptor cho `save`, `PageImpl`,
  verify `times(1)`/`never()`), `WalletServiceImplTest` (`Nested`, `shouldHaveNoInteractions`,
  `assertThatThrownBy`).
- **Không copy** `MockingDemoTest`: đây là demo so sánh, không phải test suite thông thường; không
  dùng vòng lặp 10.000 lần, `System.out`, hay assert thời gian.

## 10. Non-functional requirements

- **Tốc độ:** 13 test thuần Mockito phải chạy xong dưới 2.000 ms tổng cộng trên máy phát triển;
  được xác nhận từ thời gian của Surefire. Không có timeout, retry hay sleep.
- **Cách ly:** không Spring context, không database/H2, không network, không filesystem, không
  phụ thuộc trạng thái tĩnh giữa các test.
- **Tất định:** dùng timestamp cố định (`LocalDateTime.of(2026, 1, 15, 10, 30)`), id cố định;
  không dùng `LocalDateTime.now()` trong assertion, không random, không phụ thuộc múi giờ.
- **Độc lập thứ tự:** mỗi test tự arrange; fixture tạo mới trong `@BeforeEach`; chạy riêng từng
  test hoặc cả class đều cho cùng kết quả.
- **Strict stubs:** giữ mặc định `MockitoExtension` (STRICT_STUBS); không `lenient()`.
- **Không side effect:** không ghi log ra console bằng `System.out`, không tạo file.

## 11. Test and verification plan

### 11.1 Test class

| Thuộc tính | Giá trị |
|---|---|
| File | `speed-backend/src/test/java/com/speed/delivery/service/impl/AuditLogServiceImplTest.java` |
| Package | `com.speed.delivery.service.impl` |
| Class name | `AuditLogServiceImplTest` |
| Javadoc | `Unit Tests cho AuditLogServiceImpl - 13 test cases` + kỹ thuật sử dụng (BDDMockito, ArgumentCaptor, PageImpl) |
| Mock | `@Mock private LogRepository logRepository;` |
| SUT | `@InjectMocks private AuditLogServiceImpl auditLogService;` |
| Cấu trúc | 4 `@Nested`: ghi log đầy đủ (5 tham số), ghi log tối giản (2 tham số), lấy toàn bộ log, lấy log theo người dùng |

### 11.2 Fixture dùng chung

- `pageable = PageRequest.of(0, 10)`.
- `T1 = LocalDateTime.of(2026, 1, 15, 10, 30)`, `T2 = LocalDateTime.of(2026, 1, 15, 11, 0)`.
- `log1`: `id = 1L`, `userId = 5L`, `action = "CREATE_ORDER"`, `entityType = "Order"`,
  `entityId = 42L`, `details = "Order #42 created"`, `createdAt = T1`.
- `log2`: `id = 2L`, `userId = 5L`, `action = "LOGIN"`, `entityType = "User"`,
  `entityId = 5L`, `details = "User logged in"`, `createdAt = T2`.
- `systemLog`: `id = 3L`, `userId = null`, `action = "CLEANUP"`, `entityType = null`,
  `entityId = null`, `details = null`, `createdAt = T2`.
- `createdAt` được set trực tiếp trên builder vì `@PrePersist` không chạy trong unit test; đây là
  dữ liệu fixture, không phải hành vi của SUT.

### 11.3 Test-case matrix

| ID | Path | Phương thức | Arrange (mock) | Act | Kết quả mong đợi | Kiểm chứng tương tác |
|---|---|---|---|---|---|---|
| AL-TC01 | HP | `log(Long, String, String, Long, String)` | Không stub `save` (return bị bỏ qua) | `log(1L, "CREATE_ORDER", "Order", 42L, "Order #42 created")` | `ArgumentCaptor` giữ `Log`: `userId = 1L`, `action`, `entityType`, `entityId = 42L`, `details` đúng; `id`, `createdAt`, `ipAddress` là `null` | `save` `times(1)` + captor; `shouldHaveNoMoreInteractions()` |
| AL-TC02 | ED | `log(Long, String, String, Long, String)` | Không stub `save` | `log(null, "TOGGLE_USER_ACTIVE", "User", 7L, "User 7 toggled")` | `Log` có `userId = null`, các trường còn lại đúng; `save` thành công | `save` `times(1)` + captor; `shouldHaveNoMoreInteractions()` |
| AL-TC03 | EX | `log(Long, String, String, Long, String)` | `given(save(any(Log.class))).willThrow(new DataAccessResourceFailureException("Database is down"))` | `log(1L, "CREATE_ORDER", "Order", 42L, "...")` | Ném đúng `DataAccessResourceFailureException`, message `Database is down` | `save` `times(1)`; `shouldHaveNoMoreInteractions()` |
| AL-TC04 | HP | `log(String, String)` | Không stub `save` | `log("SYSTEM_STARTUP", "Application started")` | `Log` có `action = "SYSTEM_STARTUP"`, `details = "Application started"`; `userId`, `entityType`, `entityId`, `id`, `createdAt`, `ipAddress` là `null` | `save` `times(1)` + captor; `shouldHaveNoMoreInteractions()` |
| AL-TC05 | ED | `log(String, String)` | Không stub `save` | `log("CLEANUP", null)` | `Log` có `action = "CLEANUP"`, `details = null`; các trường khác `null`; `save` thành công | `save` `times(1)` + captor; `shouldHaveNoMoreInteractions()` |
| AL-TC06 | EX | `log(String, String)` | `given(save(any(Log.class))).willThrow(new DataAccessResourceFailureException("Database is down"))` | `log("SYSTEM_STARTUP", "Application started")` | Ném đúng `DataAccessResourceFailureException`, message `Database is down` | `save` `times(1)`; `shouldHaveNoMoreInteractions()` |
| AL-TC07 | HP | `getAllLogs(Pageable)` | `given(findAllByOrderByCreatedAtDesc(pageable)).willReturn(new PageImpl<>(List.of(log1, log2), pageable, 2))` | `getAllLogs(pageable)` | `content` size 2, giữ thứ tự `log1`, `log2`; mỗi phần tử ánh xạ đủ 7 trường; `totalElements = 2`, `totalPages = 1`, `number = 0`, `size = 10` | `findAllByOrderByCreatedAtDesc(pageable)` `times(1)`; `findByUserIdOrderByCreatedAtDesc(any(), any())` `never()`; `save` `never()`; `shouldHaveNoMoreInteractions()` |
| AL-TC08 | ED | `getAllLogs(Pageable)` | `given(findAllByOrderByCreatedAtDesc(pageable)).willReturn(new PageImpl<>(List.of(), pageable, 0))` | `getAllLogs(pageable)` | `content` rỗng; `totalElements = 0`, `totalPages = 0`, `number = 0`, `size = 10`; không ném ngoại lệ | Finder `times(1)` đúng `pageable`; `save` `never()`; `shouldHaveNoMoreInteractions()` |
| AL-TC09 | EX | `getAllLogs(Pageable)` | `given(findAllByOrderByCreatedAtDesc(pageable)).willThrow(new DataAccessResourceFailureException("Database is down"))` | `getAllLogs(pageable)` | Ném đúng `DataAccessResourceFailureException`, message `Database is down` | Finder `times(1)` đúng `pageable`; finder user `never()`; `save` `never()`; `shouldHaveNoMoreInteractions()` |
| AL-TC10 | HP | `getUserLogs(Long, Pageable)` | `given(findByUserIdOrderByCreatedAtDesc(5L, pageable)).willReturn(new PageImpl<>(List.of(log1, log2), pageable, 2))` | `getUserLogs(5L, pageable)` | `content` size 2, giữ thứ tự; mỗi phần tử ánh xạ đủ 7 trường, `userId = 5L`; metadata như `AL-TC07` | Finder `times(1)` với đúng `5L` và `pageable`; `findAllByOrderByCreatedAtDesc(any())` `never()`; `save` `never()`; `shouldHaveNoMoreInteractions()` |
| AL-TC11 | ED | `getUserLogs(Long, Pageable)` | `given(findByUserIdOrderByCreatedAtDesc(999L, pageable)).willReturn(new PageImpl<>(List.of(), pageable, 0))` | `getUserLogs(999L, pageable)` | `content` rỗng; `totalElements = 0`; không ném ngoại lệ | Finder `times(1)` với đúng `999L` và `pageable`; `save` `never()`; `shouldHaveNoMoreInteractions()` |
| AL-TC12 | EX | `getUserLogs(Long, Pageable)` | `given(findByUserIdOrderByCreatedAtDesc(5L, pageable)).willThrow(new DataAccessResourceFailureException("Database is down"))` | `getUserLogs(5L, pageable)` | Ném đúng `DataAccessResourceFailureException`, message `Database is down` | Finder `times(1)` với đúng `5L` và `pageable`; `findAllByOrderByCreatedAtDesc(any())` `never()`; `save` `never()`; `shouldHaveNoMoreInteractions()` |
| AL-TC13 | ED | `getAllLogs(Pageable)` | `given(findAllByOrderByCreatedAtDesc(pageable)).willReturn(new PageImpl<>(List.of(systemLog), pageable, 1))` | `getAllLogs(pageable)` | `LogResponse` có `id = 3L`, `action = "CLEANUP"`, `createdAt = T2`; `userId`, `entityType`, `entityId`, `details` là `null`; không NPE | Finder `times(1)` đúng `pageable`; `save` `never()`; `shouldHaveNoMoreInteractions()` |

Quy ước đánh id: `AL-TC01` … `AL-TC13` là id ổn định, không đổi khi bổ sung test sau này.

### 11.4 Interaction verification

- **`save`:** HP/ED của hai overload `log` verify `save` đúng `times(1)` với `ArgumentCaptor`;
  EX verify `times(1)` với `any(Log.class)` để chứng minh SUT đã cố ghi trước khi lỗi lan truyền.
  Không dùng `any()` khi cần phân biệt giá trị; ở đây payload được kiểm tra bằng captor.
- **`findAllByOrderByCreatedAtDesc`:** chỉ được gọi bởi `getAllLogs`, đúng `times(1)` với chính
  `pageable`; trong test `getUserLogs` phải là `never()`.
- **`findByUserIdOrderByCreatedAtDesc`:** chỉ được gọi bởi `getUserLogs`, đúng `times(1)` với
  `userId` cụ thể (5L hoặc 999L) và chính `pageable`; trong test `getAllLogs` phải là `never()`.
- **Không gọi chéo:** `getAllLogs` không được gọi finder theo user; `getUserLogs` không được gọi
  finder toàn bộ; cả hai không được gọi `save`.
- **Fail-fast:** SUT không có nhánh validation nội bộ. Với EX, sau lời gọi repository ném lỗi
  không còn lời gọi nào khác; `shouldHaveNoMoreInteractions()` là bằng chứng fail-fast. Không dùng
  `shouldHaveNoInteractions()` cho repository trong EX vì chính lời gọi gây lỗi là hành vi mong
  đợi.
- **Strict stubs:** chỉ stub những gì được dùng. Các test `log` không cần stub `save`; nếu developer
  stub, stub phải được sử dụng. Không stub finder trong test của phương thức kia.

### 11.5 Coverage và lệnh xác minh

Chạy từ `speed-backend/`:

```powershell
mvn -q -Dtest=AuditLogServiceImplTest test
mvn -q verify
```

- Lệnh thứ nhất phải báo `Tests run: 13, Failures: 0, Errors: 0, Skipped: 0` và sinh báo cáo JaCoCo
  tại `target/site/jacoco/com.speed.delivery.service.impl/AuditLogServiceImpl.html`.
- Lệnh thứ hai chạy toàn bộ suite + `jacoco:check`; phải kết thúc với exit code 0.
- **Mục tiêu:** `AuditLogServiceImpl` đạt ≥ 90% line coverage (ngưỡng `jacoco:check`), kỳ vọng
  100% vì mọi dòng thực thi đều nằm trong 13 test.
- **Lưu ý enforcement:** `pom.xml` hiện khai báo `jacoco:check` cho 12 lớp và **không** có
  `AuditLogServiceImpl`. Vì vậy `mvn -q verify` không tự động chặn coverage của lớp này. Trong
  phạm vi TEST-AUDIT không sửa `pom.xml`; developer phải đọc báo cáo JaCoCo để xác nhận và ghi số
  liệu. Nếu < 90%, coi như gate FAIL. Việc thêm lớp vào danh sách includes là feature follow-up
  (xem §12).

### 11.6 Line coverage mapping

| Dòng trong `AuditLogServiceImpl.java` | Test phủ |
|---|---|
| 26–34 (builder 5 trường, `save`, `log.debug`) | `AL-TC01`, `AL-TC02`, `AL-TC03` |
| 39–44 (builder 2 trường, `save`, `log.debug`) | `AL-TC04`, `AL-TC05`, `AL-TC06` |
| 50–51 + 62–70 (`findAll...`, `Page.map`, `mapResponse`) | `AL-TC07`, `AL-TC08`, `AL-TC09`, `AL-TC13` |
| 57–58 + 62–70 (`findByUserId...`, `Page.map`, `mapResponse`) | `AL-TC10`, `AL-TC11`, `AL-TC12` |

## 12. Open questions and assumptions

Mọi mục dưới đây là giả định đã chốt để không chặn phát triển; ghi lại để người review quyết định
nếu muốn thay đổi.

1. **`jacoco:check` chưa bao gồm `AuditLogServiceImpl`.** Giả định: không sửa `pom.xml` trong
   feature này; coverage được xác minh thủ công từ báo cáo JaCoCo. Nếu muốn gate tự động chặn,
   cần một feature riêng thêm `*AuditLogServiceImpl` vào danh sách `<includes>`.
2. **Overload `log(String, String)` không có caller trong `src/main`.** Giả định: đây vẫn là API
   public cần được bảo vệ; vẫn kiểm thử đầy đủ HP/ED/EX.
3. **SUT không validate.** Giả định: test ghi nhận hành vi hiện tại (chấp nhận `userId = null`,
   `details = null`), không yêu cầu thêm validation. Không test `action = null` vì DB có
   `NOT NULL`; thêm validation là thay đổi production ngoài phạm vi.
4. **`ipAddress` không được ánh xạ.** Giả định: đây là thiết kế hiện tại (DTO không có trường này,
   SUT không set); không thay đổi.
5. **Loại ngoại lệ lan truyền.** Giả định: dùng
   `DataAccessResourceFailureException` với message `Database is down` làm đại diện lỗi DB, nhất
   quán với `MockingDemoTest`; SUT không bọc ngoại lệ.
6. **`pageable = null` và `getUserLogs(null, ...)`.** Giả định: không phải contract của SUT (không
   có validation); không kiểm thử để tránh khẳng định hành vi phụ thuộc mock/Spring Data proxy.
7. **Chính sách lỗi khi ghi audit.** Giả định: lỗi ghi log được lan truyền (hiện trạng), không bị
   nuốt. Nếu sau này muốn audit theo hướng best-effort (lỗi audit không làm hỏng nghiệp vụ), đó là
   feature riêng và phải sửa production code.
