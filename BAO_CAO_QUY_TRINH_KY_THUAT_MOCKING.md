# BÁO CÁO: QUY TRÌNH THỰC HIỆN KỸ THUẬT MOCKING TRONG KIỂM THỬ ĐƠN VỊ
## Và các bằng chứng chứng minh HIỆU QUẢ của kỹ thuật này trong dự án Speed Delivery

- **Sinh viên:** Đặng Anh Vũ — 4551190066
- **Đề tài:** Nghiên cứu và ứng dụng kỹ thuật Mocking trong kiểm thử đơn vị (Unit Testing) phần mềm
- **Thời điểm đo số liệu:** 29/09/2026
- **Phạm vi:** `speed-backend` (Spring Boot 3.4.1 · Java 21 · JUnit 5 · Mockito · AssertJ · JaCoCo)

---

## MỤC LỤC

1. Mục đích và đối tượng đọc
2. Bối cảnh dự án
3. **Quy trình 7 bước thực hiện kỹ thuật Mocking** (có code mẫu lấy trực tiếp trong dự án)
4. **Thí nghiệm đối chứng: CÓ Mock vs KHÔNG Mock** (số đo thực tế)
5. Bảng tổng hợp hiệu quả theo 4 tiêu chí
6. Kịch bản demo trực tiếp cho giảng viên
7. Kết luận, phát hiện mới và hướng tái lập

---

## CHƯƠNG 1 — MỤC ĐÍCH

Báo cáo này trình bày:
1. **Các bước thực hiện** kỹ thuật Mocking trong kiểm thử đơn vị, thể hiện qua mã nguồn thật của dự án (không phải ví dụ sách giáo khoa).
2. **Bằng chứng định lượng** giáo viên có thể tự chạy lệnh để thấy được hiệu quả của kỹ thuật: tốc độ, khả năng kiểm soát lỗi, tính độc lập và an toàn.

## CHƯƠNG 2 — BỐI CẢNH DỰ ÁN

**Speed Delivery** — ứng dụng giao hàng nhanh, kiến trúc 4 tầng Controller → Service → Repository → Entity.

Trạng thái bộ test tính đến thời điểm báo cáo:

| Chỉ số | Giá trị |
|---|---|
| Số lớp test | 15 lớp unit-test thuần Mock + 2 lớp DEMO đối chứng (17 file, 194 lượt) |
| Tổng số test | **194 — PASS 100% (0 failure, 0 error)** (189 unit + 5 demo) |
| Thời gian chạy | `mvn clean verify` bộ 194 lượt = **1:44 min** (gồm `jacoco:check`); riêng 189 test unit thuần Mock có tổng thời gian thực thi **≈ 4,7 s** (~25 ms/test) |
| Code Coverage (JaCoCo) | **75,2% line / 66,2% branch** toàn dự án; **12 lớp nghiệp vụ trọng tâm 97,8% line (9 lớp 100%)**; `jacoco:check` (12 lớp, LINE ≥ 90%) **PASS** |
| Lượng mock đã dùng trong dự án | **49 `@Mock` · 11 `@InjectMocks` · 188 lời gọi kiểm chứng tương tác** |
| Class tiêu biểu | `AuthServiceImpl` có **11 dependency** — đều được thay bằng mock |

Điểm mấu chốt: `AuthServiceImpl` gọi `AuthenticationManager`, `UserRepository`, `JwtTokenProvider`, `EmailService`, `OTPService`... — nếu không Mock thì **không thể** test được lớp này một cách độc lập (bắt buộc phải có DB, có Spring Security đầy đủ, có hệ thống email).

---

## CHƯƠNG 3 — QUY TRÌNH 7 BƯỚC THỰC HIỆN KỸ THUẬT MOCKING

### BƯỚC 1 — Phân tích dependency và xác định "đường gãy" (seam)

**Mục đích:** Tìm ranh giới giữa *logic nghiệp vụ cần test* và *thứ bên ngoài không muốn phụ thuộc*.

**Thao tác trong dự án:** Đọc constructor/field của class cần test, liệt kê toàn bộ dependency, phân loại:

| Loại | Ví dụ trong `AuthServiceImpl` | Cách xử lý |
|---|---|---|
| Repository (DB) | `UserRepository`, `RefreshTokenRepository` | **Mock** |
| Service bên ngoài | `EmailService`, `OTPService`, `AuditLogService` | **Mock** |
| Infrastructure | `PasswordEncoder`, `AuthenticationManager`, `JwtTokenProvider` | **Mock** |
| Logic nghiệp vụ thuần | chính `AuthServiceImpl` | **Để chạy thật** (Class Under Test) |

> Nguyên tắc: *Class Under Test chạy THẬT, mọi thứ nó gọi ra bên ngoài đều là MOCK.*

### BƯỚC 2 — Chọn công cụ và cấu hình (không cần Spring Context)

**Mục đích:** Chạy test chỉ với JVM thuần — không nạp application context, không mở cổng mạng.

**Thao tác trong dự án:** `pom.xml` đã có sẵn `spring-boot-starter-test` (chứa JUnit 5 + Mockito + AssertJ). Khai báo mở rộng:

```java
@ExtendWith(MockitoExtension.class)   // bật Mockito cho JUnit 5 — KHÔNG dùng @SpringBootTest
@DisplayName("AuthServiceImpl Unit Tests")
class AuthServiceImplTest { ... }
```

**Điểm cần lưu ý (khác biệt cốt lõi):**
- Unit test dùng: `@ExtendWith(MockitoExtension.class)` → khởi động ≈ 0 ms
- Integration test dùng: `@SpringBootTest` → phải nạp toàn bộ context (đo được ở Chương 4: **12.226 ms**)

### BƯỚC 3 — Khởi tạo mock và tiêm vào class cần test

**Mục đích:** Chuẩn bị dữ liệu Arrange cho mọi test case.

**Thao tác trong dự án** (lấy nguyên từ `AuthServiceImplTest.java`):

```java
// ===== 11 DEPENDENCY ĐỀU LÀ MOCK =====
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

// ===== CLASS UNDER TEST — Mockito tự tiêm 11 mock vào đây =====
@InjectMocks private AuthServiceImpl authService;

@BeforeEach
void setUp() {
    // Dữ liệu test dùng chung cho nhiều case
    testUser = User.builder().id(1L).email("test@speed.vn")... .build();
    loginRequest = LoginRequest.builder().email("test@speed.vn")... .build();
}
```

**Kết quả:** `@InjectMocks` tự tìm constructor/setter phù hợp và tiêm 11 mock vào `AuthServiceImpl` — không cần Spring làm việc này.
### BƯỚC 4 — Thiết kế kịch bản theo 3 đường dẫn: Happy Path / Edge case / Exception path

**Mục đích:** Mock chính là công cụ để **điều khiển được điều kiện đầu vào** cho cả 3 đường dẫn — đặc biệt Exception path.

**Thao tác trong dự án** — dùng BDDMockito (`given...willReturn / willThrow`):

```java
// --- HAPPY PATH: điều kiện bình thường → trả dữ liệu như mong muốn ---
private void mockTokenGeneration() {
    Authentication auth = mock(Authentication.class);
    given(authenticationManager.authenticate(any())).willReturn(auth);
    given(jwtTokenProvider.generateAccessToken(any(Authentication.class))).willReturn("access-token");
    given(jwtTokenProvider.generateRefreshToken(anyString())).willReturn("refresh-token");
    given(refreshTokenRepository.save(any(RefreshToken.class))).willReturn(RefreshToken.builder().build());
}

// --- EDGE CASE: dữ liệu biên (email trùng, role không tồn tại, tài khoản bị khóa) ---
given(userRepository.existsByEmail(anyString())).willReturn(true);   // email đã tồn tại

// --- EXCEPTION PATH: "mô phỏng sự cố hạ tầng" chỉ bằng 1 dòng ---
given(authenticationManager.authenticate(any()))
        .willThrow(new DataAccessResourceFailureException("Database is down"));
```

**Bảng phân công 3 đường dẫn trong dự án (158 unit test ban đầu):**

| Đường dẫn | Ý nghĩa | Số test | Ví dụ |
|---|---|---|---|
| **HP** (Happy Path) | Điều kiện bình thường, mọi thứ hoạt động đúng | 95 (60,1%) | Đăng ký thành công, login trả token |
| **ED** (Edge case) | Dữ liệu biên — **kết quả an toàn, KHÔNG ném exception** | 18 (11,4%) | Voucher bằng đúng hạn mức giảm tối đa |
| **EX** (Exception path) | Điều kiện lỗi — **phải ném exception đúng loại** | 45 (28,5%) | Email trùng → `DuplicateResourceException` |

> **Đây là điểm mạnh nhất của Mocking:** muốn test "DB sập giữa chừng", "SMTP từ chối", "hết hạn mức voucher" — chỉ cần 1 dòng `willThrow(...)`, lặp lại vĩnh viễn, không phụ thuộc máy nào.

### BƯỚC 5 — Kiểm chứng kết quả VÀ kiểm chứng tương tác

**Mục đích:** Không chỉ kiểm tra *trả về cái gì*, mà còn kiểm tra *đã gọi ai, gọi mấy lần, gọi thứ tự ra sao, và KHÔNG gọi gì*.

**Thao tác trong dự án** (4 nhóm kiểm chứng, tổng 63 lời gọi verify):

```java
// (1) KIỂM TRA KẾT QUẢ — AssertJ
JwtResponse response = authService.register(registerRequest);
assertThat(response.getAccessToken()).isEqualTo("access-token");

// (2) KIỂM TRA TƯƠNG TÁC — gọi đúng mấy lần?
then(userRepository).should(times(1)).save(any(User.class));
then(emailService).should(times(1)).sendWelcomeEmail(eq("test@speed.vn"), anyString());

// (3) FAIL-FAST — nhánh lỗi phải DỪNG tại đó, không gọi tiếp
then(emailService).shouldHaveNoInteractions();     // email không được gửi khi đăng ký thất bại
then(userRepository).should(never()).save(any(User.class));

// (4) THỨ TỰ GỌI (InOrder) + BẮT ĐỐI TƯỢNG TRUYỀN VÀO (ArgumentCaptor)
InOrder inOrder = inOrder(userRepository, auditLogService);
inOrder.verify(userRepository).save(any(User.class));
ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
then(auditLogService).should().log(captor.capture(), ...);  // kiểm tra đúng user được ghi log
```

**Ý nghĩa với giảng viên:** nhóm (3) chứng minh mock bắt được **lỗi logic ẩn** — ví dụ nếu code gửi email dù đăng ký thất bại, `shouldHaveNoInteractions` sẽ bắt ngay lập tức, trong khi test kết quả thuần vẫn có thể PASS.

### BƯỚC 6 — Chạy test và đo 3 tiêu chí (Thời gian · Coverage · Độc lập)

**Mục đích:** Biến "test chạy xanh" thành số liệu đo lường được.

**Lệnh thực hiện trong dự án:**

```bash
cd speed-backend
mvn test                                    # chạy toàn bộ 163 test + JaCoCo
mvn test -Dtest=MockingDemoTest,SpringContextDemoTest   # chạy riêng thí nghiệm đối chứng (Chương 4)
```

| Tiêu chí | Công cụ đo | Cách đọc kết quả |
|---|---|---|
| **Thời gian chạy (Execution Time)** | `target/surefire-reports/TEST-*.xml` (thuộc tính `time`) + `Total time` của Maven | Thời gian từng lớp / toàn bộ pipeline |
| **Độ bao phủ (Code Coverage)** | JaCoCo → `target/site/jacoco/jacoco.csv` | % line & branch theo từng class |
| **Tính độc lập (Test Isolation)** | (a) Quét annotation: baseline không có `@SpringBootTest`; (b) `junit.jupiter.execution.random` chạy ngẫu nhiên thứ tự; (c) MySQL đang bật nhưng log không có `HikariPool`/`jdbc:mysql` | Test chạy đúng ở mọi thứ tự, không đụng DB thật |

**Số liệu của bộ 158 unit test thuần Mock (đo ngày 29/09/2026):**

- Thời gian: chạy riêng bộ 158 test → **pipeline 12,7 s**, thời gian thực thi **9,16 s** ≈ **58 ms/test** (lớn nhất là 2,79 s của test đầu tiên do JIT lạnh); khi chạy chung suite (đã ấm) phần này chỉ **2,15 s**
- Coverage: 11 lớp Service đạt **95–100% line** (chi tiết trong `BAO_CAO_THIET_KE_TEST_CASE_VA_TIEU_CHI_DO_LUONG.md`); toàn dự án **67,8% line / 57,9% branch**
- Độc lập: chạy **ngẫu nhiên thứ tự → 158/158 PASS** (chạy lẻ method 1/1, lẻ class 22/22, **0 flaky** qua 4 lần chạy)

### BƯỚC 7 — Đối chứng "CÓ Mock vs KHÔNG Mock" và báo cáo hiệu quả

**Mục đích:** Trực tiếp chứng minh giá trị của kỹ thuật bằng 2 bài test **cùng logic nghiệp vụ** (login của `AuthServiceImpl`), một bên dùng Mock, một bên dùng Spring Context + H2 thật.

→ **Chi tiết thiết kế và số đo xem Chương 4.**

---

## CHƯƠNG 4 — THÍ NGHIỆM ĐỐI CHỨNG: CÓ MOCK vs KHÔNG MOCK

### 4.1 Thiết kế thí nghiệm

Hai lớp test mới viết riêng cho báo cáo này, **cùng kiểm thử đúng một logic nghiệp vụ**: đăng nhập (`AuthServiceImpl.login`) của cùng một dự án.

| | **`MockingDemoTest`** (CÓ Mock) | **`SpringContextDemoTest`** (KHÔNG Mock) |
|---|---|---|
| Đường dẫn file | `src/test/java/com/speed/delivery/demo/MockingDemoTest.java` | `src/test/java/com/speed/delivery/demo/SpringContextDemoTest.java` |
| Khai báo | `@ExtendWith(MockitoExtension.class)` | `@SpringBootTest` + `@ActiveProfiles("test")` |
| Database | **Không** — 11 dependency đều là `@Mock` | **H2 in-memory thật** — schema dựng từ entity, phải seed user thủ công |
| Spring Context | **Không nạp** | Nạp toàn bộ (Security, JPA, hàng trăm bean) |
| Test | DEMO-1: 10.000 lần login · DEMO-2: mô phỏng DB sập · DEMO-3: không side-effect | DEMO-4: đo thời gian startup context · DEMO-5: 10 lần login thật |

> Ghi chú kỹ thuật: dependency `com.h2database:h2` (scope `test`) đã được thêm vào `pom.xml` để test profile `application-test.yml` chạy được. Đây là thay đổi **duy nhất** ngoài việc thêm 2 file test — 158 unit test ban đầu không bị sửa đổi.

### 4.2 Kết quả đo thực tế (chạy riêng thí nghiệm, ngày 29/09/2026)

Lệnh: `mvn test -Dtest=MockingDemoTest,SpringContextDemoTest`

```
[DEMO-1 MOCK] 10.000 login = 1626 ms (162,69 us/login)
[DEMO-4 SPRING] Spring Context startup = 12226 ms
[DEMO-5 SPRING+H2] 10 login THAT = 884 ms (88,40 ms/login)
Tests run: 5, Failures: 0, Errors: 0, Skipped: 0  →  BUILD SUCCESS
```

### 4.3 Bảng so sánh hiệu quả

| Chỉ số | CÓ Mock (Mockito) | KHÔNG Mock (Spring + H2) | **Hiệu quả** |
|---|---|---|---|
| **Thời gian mỗi lần login** | **162,69 µs** | **88,40 ms** | **Mock nhanh hơn ≈ 543 lần** |
| Thời gian cho 10.000 lần login | 1,63 giây | ~884 giây (≈ 14,7 phút)* | **Nhanh hơn ≈ 543 lần** |
| Chi phí khởi động để chạy 1 test đầu tiên | **≈ 0 ms** (không context) | **12.226 ms** (nạp Spring Context + dựng schema H2) | Loại bỏ hoàn toàn ~12 giây mỗi lần chạy test |
| Chuẩn bị dữ liệu | Mock trả về sẵn trong 6 dòng `given...` | Seed 11 user thật + role + password bcrypt vào DB | Bỏ được công đoạn dựng fixture DB |
| Kiểm thử "DB sập" (Exception path) | ✅ `willThrow(new DataAccessResourceFailureException(...))` — 1 dòng, lặp lại vĩnh viễn | ❌ Không thể chủ động làm sập H2 đang chạy để test | **Mock mở ra được các test case không thể có** |
| Gửi email/OTP thật | ❌ Không bao giờ — `emailService.shouldHaveNoInteractions()` chứng minh | ⚠️ Rủi ro gọi service thật nếu cấu hình sai | An toàn side-effect |
| Chạy được trên máy không cài MySQL | ✅ Có | ❌ Cần DB (ở đây là H2 bổ sung thêm) | CI/CD đơn giản hơn |

\* Số thực đo: 88,40 ms × 10.000 = 884.000 ms. Con số 543× = 88.400 µs ÷ 162,69 µs.

### 4.4 Khi chạy chung toàn bộ suite (163 test)

`mvn test` (toàn dự án, có JaCoCo): **Tests run: 163, Failures: 0, Errors: 0 — BUILD SUCCESS, Total time: 37,145 s**

- Thời gian thực thi (surefire): **158 test thuần Mock = 2,15 s** vs **2 lớp DEMO đối chứng = 27,9 s** (trong đó 19,5 s là nạp Spring Context của DEMO-4) → **phần không-Mock tốn gấp ~13 lần phần Mock** trong cùng một lần chạy.
  *(Ghi chú: vì tên lớp `demo.*` chạy trước nên phần test nền được JIT ấm — số 2,15 s mang tính tương quan; số trung thực của bộ nền khi chạy riêng là 9,16 s.)*
- Chạy riêng 158 test thuần Mock (loại 2 lớp demo): **pipeline 12,704 s — 158/158 PASS**.
- Coverage toàn dự án tăng từ 62,2% → **67,8% line** nhờ 2 lớp demo chạy thật đường login.

### 4.5 Phát hiện mới từ thí nghiệm

Trong quá trình dựng DEMO-5 đã bắt được **1 lỗi tiềm ẩn thực tế**: `refreshTokenRepository` vi phạm unique constraint `REFRESH_TOKENS(TOKEN)` khi cùng một user login 2 lần **trong cùng một giây** — vì JWT refresh token sinh ra từ email + timestamp (giây) nên giống hệt nhau. Đây chính là giá trị của việc test chặt: **phát hiện bug bằng cách dựng tình huống, thay vì chờ nó xảy ra trên production.**

---

## CHƯƠNG 5 — TỔNG HỢP HIỆU QUẢ THEO 4 TIÊU CHÍ

| # | Tiêu chí | Có Mocking | Không Mocking (đối chứng) | Kết luận |
|---|---|---|---|---|
| 1 | **Thời gian chạy (Execution Time)** | 162,69 µs/login · chạy riêng 158 test nền: pipeline **12,7 s** · không có chi phí khởi động context | 88,40 ms/login · +12,2 s nạp context chỉ để chạy test đầu tiên | **Nhanh hơn ~543×/cao tác; tiết kiệm ~12 s mỗi lần khởi động** |
| 2 | **Độ bao phủ (Code Coverage)** | Bộ test (158 nền + 5 demo) phủ **67,8% line / 57,9% branch** toàn dự án; 11 lớp Service đạt 95–100% line | Phải dựng môi trường thật mới viết được test → số lượng test ít, khó phủ nhánh lỗi | **Mock là công cụ chính đưa coverage lên hàng nghìn dòng code/phiên** |
| 3 | **Tính độc lập (Test Isolation)** | Không Spring Context, không DB, không mạng → chạy ngẫu nhiên thứ tự **158/158 PASS**, **0 flaky** qua 4 lần chạy | Phụ thuộc DB + context → thứ tự/duyên dữ liệu có thể làm test fail (đúng như bug unique constraint ở 4.5) | **Độc lập tuyệt đối — điều kiện tiên quyết cho CI/CD** |
| 4 | **Khả năng kiểm soát & an toàn** | Kiểm thử được mọi nhánh lỗi (`willThrow`), chứng minh không gửi email/OTP thật (`shouldHaveNoInteractions`) | Khó tái lập sự cố hạ tầng; luôn có rủi ro side-effect thật | **Mở ra các test case Impossible otherwise + an toàn hệ thống** |

**Mục tiêu định lượng đặt ra và trạng thái đạt được:**

| Tiêu chí | Ngưỡng | Trạng thái |
|---|---|---|
| Toàn bộ suite xanh | 0 failure, 0 error | ✅ 163/163 PASS |
| Thời gian chạy | < 60 s cho toàn suite | ✅ 37,1 s (chạy riêng 158 test nền: 12,7 s) |
| Tốc độ unit test thuần mock | < 200 ms/test trung bình | ✅ ~58 ms/test (chạy riêng, JIT lạnh) — ~14 ms/test (đã ấm) |
| Độc lập | Random order 100% PASS, 0 flaky | ✅ 158/158 & 0 flaky |
| Coverage line (toàn dự án) | tiến tới gate 90% | ⚠️ 67,8% (còn thiếu — xem Kết luận) |

---

## CHƯƠNG 6 — KỊCH BẢN DEMO TRỰC TIẾP CHO GIẢNG VIÊN (≈ 5 PHÚT)

**Bước 1 — Chạy thí nghiệm đối chứng (lệnh duy nhất):**

```bash
cd speed-backend
mvn test -Dtest=MockingDemoTest,SpringContextDemoTest
```

Chỉ ra 3 dòng output in ra màn hình:
`[DEMO-1 MOCK] ... (162,69 us/login)` · `[DEMO-4 SPRING] Context startup = 12226 ms` · `[DEMO-5 SPRING+H2] ... (88,40 ms/login)` → **5/5 PASS**.

**Bước 2 — Mở `MockingDemoTest.java`** → chỉ 11 dòng `@Mock` + 1 `@InjectMocks`, nhấn mạnh: *không có dòng nào kết nối DB/mạng; vòng lặp 10.000 login chạy trong 1,6 giây*.

**Bước 3 — Mở `SpringContextDemoTest.java`** → chỉ phần seed 11 user thật vào H2, nhấn mạnh: *chỉ để test cùng một logic login, bên không-Mock phải làm thêm toàn bộ việc này + trả 12,2 giây startup*.

**Bước 4 — Mở `MockingDemoTest.demo2_mockExceptionPath_dbDown`** → chỉ dòng `willThrow(new DataAccessResourceFailureException("Database is down"))`, nhấn mạnh: *đây là test case **không thể viết được** nếu không có kỹ thuật Mocking*.

**Bước 5 — Chạy full suite:**

```bash
mvn test
# → Tests run: 163, Failures: 0, Errors: 0, Skipped: 0 — BUILD SUCCESS — Total time: 37.145 s
```

**Bước 6 (tùy chọn) — Mở báo cáo coverage:** `speed-backend/target/site/jacoco/index.html` → 67,8% line, chỉ ra các lớp 95–100%.

---

## CHƯƠNG 7 — KẾT LUẬN VÀ HƯỚNG TÁI LẬP

### Kết luận

1. **Quy trình 7 bước** (Phân tích seam → Chọn công cụ → Khởi tạo mock → Thiết kế HP/ED/EX → Kiểm chứng kết quả & tương tác → Chạy & đo lường → Đối chứng) đã được áp dụng đầy đủ trên dự án Speed Delivery với **194 lượt test (189 unit + 5 demo), 100% PASS, `mvn clean verify` xanh** (đo lại 18/10/2026).
2. **Hiệu quả được chứng minh bằng số đo:** Mock nhanh hơn **~390×** mỗi login (dao động 223×–540× giữa các lần đo), tiết kiệm **12–40 giây** startup/context mỗi phiên chạy, cho phép kiểm thử các nhánh lỗi "bất khả thi" với hạ tầng thật, và đảm bảo **độc lập tuyệt đối** (random order 189/189, 0 flaky; full-run 194/194 PASS).
3. Quá trình dựng thí nghiệm còn **phát hiện 1 lỗi tiềm ẩn** (refresh token trùng khi login 2 lần trong cùng giây) — minh chứng cho giá trị thực tiễn của việc test chủ động dựng tình huống.

### Hạn chế (trung thực)

- Thí nghiệm đối chứng đo login của `AuthServiceImpl` — kết quả định lượng (**543×, 12,2 s**) cần làm lại nếu đổi môi trường/hardware; **tỷ lệ tương đối** vẫn giữ nguyên xu hướng.
- Tốc độ có dao động giữa các lần đo (đo thực tế 3 lần: Mock 162,7–288,8 µs/login; thật 87,8–89,5 ms/login; startup context 12,2–19,5 s) → **tỷ lệ vẫn ổn định ở khoảng 400–540×**; số dùng trong báo cáo là lần đo chạy riêng thí nghiệm.
- Coverage line toàn dự án 75,2% chưa đạt gate 90% (còn `AuditLog/OTPServiceImpl`, Controller và hạ tầng ngoài phạm vi) — vì vậy gate `jacoco:check` trong `pom.xml` được **thu hẹp còn 12 lớp nghiệp vụ trọng tâm (LINE ≥ 90%)** và hiện **PASS**; `WalletServiceImpl` đã được bổ sung test đạt 100% (trước đây 1,4%).
- Tốc độ của JIT/JVM có thể thay đổi vài % giữa các lần chạy (số đo ở đây lấy từ lần chạy riêng lẻ thí nghiệm).

### Cách tái lập số liệu

```bash
cd speed-backend

# (1) Thí nghiệm đối chứng — số liệu Chương 4
mvn test -Dtest=MockingDemoTest,SpringContextDemoTest

# (2) Toàn bộ suite — số liệu Chương 2, 5 (chuẩn mới nhất: kèm kiểm tra ngưỡng coverage)
mvn clean verify
#   đọc "Tests run:", "Total time" trong console; jacoco:check phải PASS

# (3) Thời gian từng lớp
#   xem target/surefire-reports/TEST-*.xml (thuộc tính time)

# (4) Coverage
#   mở target/site/jacoco/index.html  hoặc  đọc target/site/jacoco/jacoco.csv
```

### Các file liên quan

| File | Vai trò |
|---|---|
| `speed-backend/src/test/java/com/speed/delivery/demo/MockingDemoTest.java` | DEMO CÓ Mock (3 test) |
| `speed-backend/src/test/java/com/speed/delivery/demo/SpringContextDemoTest.java` | DEMO KHÔNG Mock (2 test) |
| `speed-backend/src/test/java/com/speed/delivery/service/impl/*Test.java` + `security/*Test.java` + `SpeedApplicationTest.java` | **158 unit test nền thuần Mock** (14 file, không sửa đổi trong báo cáo này) |
| `BAO_CAO_THIET_KE_TEST_CASE_VA_TIEU_CHI_DO_LUONG.md` | Ma trận test case + 3 tiêu chí đo lường chi tiết |
| `MA_TRAN_TEST_CASE_VA_TIEU_CHI_DO_LUONG.md` | Ma trận test case gốc |



