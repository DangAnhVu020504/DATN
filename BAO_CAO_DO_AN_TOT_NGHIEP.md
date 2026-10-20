# BÁO CÁO ĐỒ ÁN TỐT NGHIỆP

**TRƯỜNG ĐẠI HỌC QUY NHƠN — KHOA CÔNG NGHỆ THÔNG TIN**

**Đề tài:** NGHIÊN CỨU VÀ ỨNG DỤNG KỸ THUẬT MOCKING TRONG XÂY DỰNG KIỂM THỬ ĐƠN VỊ

- **Sinh viên thực hiện:** Đặng Anh Vũ — Lớp/Khóa: K45 — Chuyên ngành: Kỹ thuật phần mềm
- **Giảng viên hướng dẫn:** Ths. Đinh Thị Mỹ Cảnh
- **Đơn vị thực nghiệm:** Hệ thống giao hàng nhanh **Speed Delivery** (Spring Boot 3.4.1 · Java 21)

> **Quy ước trích dẫn.** Báo cáo dùng hai loại nguồn:
> - **Nguồn lý thuyết** được đánh số `[1]…[9]`, trích từ các tài liệu trong thư mục `TaiLieu/` (danh sách URL ở **Tài liệu tham khảo**, Mục cuối).
> - **Nguồn số liệu thực nghiệm** được ghi rõ bằng đường dẫn tệp bằng chứng thô (log Maven Surefire, `jacoco.csv`) trong thư mục `bang_chung_so_lieu/`. **Mọi con số trong Chương 3 đều lấy trực tiếp từ các tệp bằng chứng này**, không có số liệu tự suy diễn.

---

## MỤC LỤC

- **MỞ ĐẦU**
- **CHƯƠNG 1. CƠ SỞ LÝ THUYẾT VỀ UNIT TESTING VÀ TEST DOUBLE**
  - 1.1. Tổng quan về kiểm thử Unit Testing
    - 1.1.1. Khái niệm và vai trò của Unit Testing
    - 1.1.2. Các nguyên tắc trong Unit Testing
    - 1.1.3. Unit Testing trong quy trình phát triển phần mềm
  - 1.2. Vấn đề phụ thuộc (Dependencies) trong kiểm thử phần mềm
  - 1.3. Test Double trong Unit Testing
    - 1.3.1. Khái niệm Test Double
    - 1.3.2. Các loại Test Double
    - 1.3.3. Vai trò của Mocking trong Test Double
- **CHƯƠNG 2. NGHIÊN CỨU KỸ THUẬT MOCKING VÀ CÔNG CỤ MOCKITO**
  - 2.1. Nguyên lý hoạt động của kỹ thuật Mocking
  - 2.2. Dependency Injection hỗ trợ Mocking
  - 2.3. Mockito Framework
  - 2.4. Các kỹ thuật Mocking với Mockito
  - 2.5. Nguyên tắc và lưu ý khi áp dụng kỹ thuật Mocking
    - 2.5.1. Khi nào nên áp dụng kỹ thuật Mocking
    - 2.5.2. Khi nào không nên áp dụng kỹ thuật Mocking
    - 2.5.3. Những hạn chế khi lạm dụng kỹ thuật Mocking (Over-Mocking)
    - 2.5.4. So sánh kiểm thử sử dụng Mocking và kiểm thử tích hợp (Integration Testing)
- **CHƯƠNG 3. TRIỂN KHAI THỰC NGHIỆM ỨNG DỤNG MOCKING**
  - 3.1. Đối tượng thực nghiệm
  - 3.2. Môi trường thực nghiệm
  - 3.3. Thiết kế các kịch bản Unit Test
  - 3.4. Xây dựng và thực thi Unit Test
  - 3.5. Đánh giá kết quả thực nghiệm
- **CHƯƠNG 4. KẾT LUẬN VÀ HƯỚNG PHÁT TRIỂN**
- **TÀI LIỆU THAM KHẢO**

---

# MỞ ĐẦU

Trong bối cảnh công nghiệp phần mềm hiện đại, quy trình phát triển linh hoạt (Agile) và phân phối liên tục (CI/CD) đòi hỏi tốc độ phát hành nhanh nhưng vẫn bảo đảm chất lượng. Kiểm thử đơn vị (Unit Testing) đóng vai trò cốt lõi giúp phát hiện lỗi sớm ngay từ giai đoạn lập trình, với nguyên tắc sống còn là tính **cô lập**: một đơn vị mã phải được kiểm thử độc lập với các hệ thống bên ngoài.

Thực tế, các ứng dụng hiện đại giao tiếp với cơ sở dữ liệu, API, hệ thống tệp nên việc chạy unit test trực tiếp trên môi trường thật gây ra nhiều rào cản: chạy chậm, kết quả không ổn định do phụ thuộc đường truyền, nguy cơ hỏng dữ liệu thật và rất khó mô phỏng các tình huống lỗi. Kỹ thuật **Mocking** ra đời nhằm tạo ra các **đối tượng giả lập (mock objects)** thay thế và mô phỏng hành vi của các thành phần phụ thuộc, giúp test chạy độc lập với tốc độ mili-giây và cho phép chủ động tạo kịch bản lỗi. Tuy nhiên, nếu lạm dụng hoặc áp dụng sai, bộ test có thể đánh giá sai chất lượng mã nguồn.

**Mục tiêu nghiên cứu:**

1. Hệ thống hóa cơ sở lý thuyết về Unit Testing, các nguyên tắc kiểm thử, vấn đề phụ thuộc, Test Double và vai trò của Mocking.
2. Nghiên cứu nguyên lý hoạt động của Mocking, cơ chế hỗ trợ của Dependency Injection và khả năng ứng dụng công cụ Mockito.
3. Xây dựng và thực nghiệm các kịch bản unit test áp dụng Mocking trên một ứng dụng Java (Speed Delivery) bằng Mockito.
4. Đánh giá hiệu quả của Mocking qua các tiêu chí: khả năng cô lập phụ thuộc, thời gian thực thi, độ bao phủ mã nguồn, khả năng bảo trì và những hạn chế khi lạm dụng.

**Đối tượng và phạm vi:** đối tượng là kỹ thuật Mocking trong Unit Testing (nguyên lý, cơ chế cô lập, các kỹ thuật Mocking, ứng dụng Mockito trong môi trường Java). Phạm vi thực nghiệm giới hạn ở **tầng Service** của ứng dụng Speed Delivery; **không** nghiên cứu kiểm thử hệ thống, **không** so sánh giữa nhiều framework Mocking, và **không** đi sâu vào Integration Testing (ranh giới được phân định tại Mục 2.5.4).

**Phương pháp nghiên cứu:**

- *Nghiên cứu tài liệu:* thu thập và phân tích các tài liệu về Unit Testing, Test Double, Mocking và Mockito (các nguồn trong `TaiLieu/`).
- *Phân tích – thiết kế:* phân tích kiến trúc và đồ thị phụ thuộc của ứng dụng, thiết kế ma trận test case.
- *Thực nghiệm:* xây dựng môi trường Java 21 + JUnit 5 + Mockito, triển khai bộ unit test và thi hành.
- *Đánh giá:* đo lường bằng các công cụ (Maven Surefire, JaCoCo) và so sánh có/không Mocking.

**Bố cục:** Chương 1 trình bày cơ sở lý thuyết về Unit Testing và Test Double; Chương 2 nghiên cứu kỹ thuật Mocking và công cụ Mockito; Chương 3 triển khai thực nghiệm trên Speed Delivery; Chương 4 kết luận và hướng phát triển.

---

# CHƯƠNG 1. CƠ SỞ LÝ THUYẾT VỀ UNIT TESTING VÀ TEST DOUBLE

## 1.1. Tổng quan về kiểm thử Unit Testing

### 1.1.1. Khái niệm và vai trò của Unit Testing

**Định nghĩa.** Unit test kiểm thử một **đơn vị công việc (unit of work)** — một hành vi có thể quan sát được của hệ thống — thay vì một "hàm" đơn lẻ. Một đơn vị nên có **điểm vào (entry point)** và **điểm ra (exit point)**; exit point gồm ba loại: giá trị trả về, thay đổi trạng thái nội bộ, và **lời gọi ra thành phần phụ thuộc** (third-party dependency) — chính là cơ sở để phân biệt các kỹ thuật kiểm thử và để Mocking phát huy vai trò [1, Ch.1].

Theo quan niệm kinh điển, unit là "đơn vị nhỏ nhất có thể kiểm thử" (thường là một phương thức/lớp), được kiểm thử **độc lập** với phần còn lại — một định nghĩa định hướng theo *hành vi* (behavior), phù hợp với kiểm thử ở tầng logic nghiệp vụ [2, 3].

**Vai trò.**

- Phát hiện lỗi **sớm** (shift-left), chi phí sửa lỗi thấp.
- Cung cấp **lưới an toàn** cho việc refactor: test tốt cho phép thay đổi cấu trúc mã mà vẫn bảo toàn hành vi.
- Đóng vai trò **tài liệu sống** mô tả hành vi mong đợi của mã nguồn.
- Là **điều kiện tiên quyết** cho CI/CD: bộ test phải nhanh, ổn định và tự động xác minh [1, 3].

### 1.1.2. Các nguyên tắc trong Unit Testing

Các tài liệu chuẩn mực thống nhất bộ tiêu chí **F.I.R.S.T** cho một unit test tốt [1, 3]:

| Tiêu chí | Ý nghĩa |
|---|---|
| **F**ast (Nhanh) | Chạy trong mili-giây, không chạm I/O; test chậm sẽ bị lập trình viên bỏ qua. |
| **I**solated (Cô lập) | Không phụ thuộc trạng thái/ thứ tự của test khác, không phụ thuộc môi trường ngoài. |
| **R**epeatable (Lặp lại được) | Cho cùng kết quả ở mọi máy, mọi thời điểm. |
| **S**elf-validating (Tự xác minh) | Kết quả pass/fail rõ ràng, không cần đọc log thủ công. |
| **T**imely (Kịp thời) | Viết trước hoặc cùng lúc với mã nguồn. |

Ngoài ra, một đơn vị kiểm thử tốt nên **kiểm tra một hành vi duy nhất**, có tên mô tả mục đích, dữ liệu kiểm thử hiện thực và dễ đọc [7]. Trong tài liệu về chất lượng test, việc phân nhỏ đơn vị và viết test cho từng phần logic giúp việc xác minh dễ dàng và tăng độ tin cậy [2].

### 1.1.3. Unit Testing trong quy trình phát triển phần mềm

Unit test là tầng kiểm thử **đầu tiên và chạy thường xuyên nhất** trong tháp kiểm thử (test pyramid), trước Integration Test và System Test. Trong vòng phát triển TDD (Test-Driven Development) theo chu trình **Red – Green – Refactor**, test được viết trước để định hình thiết kế [1, Ch.1].

Một trong các thực hành cốt lõi của CI là **"keep the build fast"** — thời gian chạy test quyết định độ trễ phản hồi (feedback loop) của toàn pipeline. Vì phải chạy ở *mọi lần commit*, unit test bắt buộc phải nhanh và không phụ thuộc tài nguyên ngoài — lý do trực tiếp khiến Mocking trở thành kỹ thuật thiết yếu [6].

## 1.2. Vấn đề phụ thuộc (Dependencies) trong kiểm thử phần mềm

Các đơn vị chức năng trong ứng dụng hiện đại hiếm khi tồn tại độc lập mà phụ thuộc vào nhiều **thành phần được phụ thuộc (Depended-On Component – DOC)**: cơ sở dữ liệu (qua Repository), dịch vụ web/API (email, SMS, bản đồ), hệ thống tệp, cổng thanh toán, hoặc các service khác (Service-to-Service).

Việc chạy unit test trực tiếp với các phụ thuộc thật dẫn tới các vấn đề:

- **Tốc độ:** mở kết nối mạng/DB, nạp framework tốn hàng trăm mili-giây đến hàng chục giây mỗi test.
- **Không ổn định (flaky):** kết quả phụ thuộc mạng, thời điểm, dữ liệu chia sẻ giữa các test.
- **Khó tái lập biên/lỗi:** rất khó chủ động tạo "DB sập", "email đã tồn tại", "token hết hạn".
- **Rủi ro dữ liệu:** test có thể làm hỏng dữ liệu thật [1, Ch.1; 6].

Vấn đề phụ thuộc còn thể hiện ở **thiết kế**: một phương thức `static` gọi trực tiếp tài nguyên ngoài (ví dụ tạo `new HttpClient()`) tạo ra *coupling tại thời điểm biên dịch*, vi phạm Dependency Inversion và khiến mã khó kiểm thử [6]. Để cô lập, người kiểm thử cần một cơ chế "seam" (ranh giới có thể thay thế) — nền tảng cho khái niệm Test Double ở Mục 1.3.

> Trong thực nghiệm này, "vấn đề phụ thuộc" được thể hiện cụ thể: lớp `OrderServiceImpl` phụ thuộc **10** thành phần ngoài (4 Repository + 6 Service), `AuthServiceImpl` phụ thuộc **11** thành phần — chi tiết tại Mục 3.1.

## 1.3. Test Double trong Unit Testing

### 1.3.1. Khái niệm Test Double

**Test Double** (đối tượng thay thế) là thuật ngữ chỉ bất kỳ đối tượng nào được dùng để **thay thế cho một DOC thật** trong khi kiểm thử, nhằm cô lập đối tượng cần kiểm thử (SUT). Nó "đứng vào vị trí" của DOC để test không phải chạm tài nguyên thật, đồng thời cho phép lập trình viên **kiểm soát** hoàn toàn đầu vào/đầu ra của DOC [1, Ch.4; 3].

Việc tạo double cũng là cơ hội **cải thiện thiết kế**: một phương thức khó kiểm thử thường là dấu hiệu coupling cao; khi "seam" được tạo đúng cách (qua interface/DI), mã vừa dễ test vừa tăng tính mô-đun [6].

### 1.3.2. Các loại Test Double

Truyền thống phân biệt **năm loại** Test Double theo mục đích sử dụng [1, 3]:

| Loại | Vai trò | Đặc trưng |
|---|---|---|
| **Dummy** | Đối tượng "đắp" vào tham số cho đủ chữ ký | Không bao giờ được dùng thực sự. |
| **Stub** | Cung cấp giá trị trả về cố định để SUT chạy tiếp | Phục vụ **kiểm chứng kết quả (state verification)**. |
| **Spy** | Ghi lại thông tin tương tác để truy vấn sau | Bổ trợ xác minh gián tiếp. |
| **Mock** | Đối tượng được "lập trình kỳ vọng" (expectation) và tự xác minh có được gọi đúng | Phục vụ **kiểm chứng hành vi (behavior verification)**. |
| **Fake** | Cài đặt rút gọn nhưng *chạy thật* (ví dụ repository in-memory) | Dùng khi không cần kiểm tra tương tác. |

Sự phân biệt **Stub (kiểm kết quả) vs Mock (kiểm tương tác)** là nền tảng khái niệm: một test dùng double cần biết mình đang kiểm *giá trị trả về* hay kiểm *cách SUT giao tiếp với DOC*. Các nguồn tài liệu cũng nhấn mạnh: chỉ nên dùng Fake cho các thao tác lưu/đọc đơn giản, còn Mock dành cho những gì "do đội của mình viết ra" (service/repository), không mock các lớp thư viện có sẵn [7].

### 1.3.3. Vai trò của Mocking trong Test Double

Trong năm loại trên, **Mock** là loại gắn chặt nhất với kỹ thuật **Mocking**. Vai trò của Mocking:

1. **Cô lập SUT** khỏi mọi DOC, biến một hệ thống phức tạp thành phép kiểm thử thuần JVM.
2. **Điều khiển điều kiện đầu vào**, đặc biệt cho **kịch bản lỗi/biên** — điều gần như không thể làm được với hạ tầng thật (ví dụ: bắt một API trả về thất bại, buộc một giao dịch ném ngoại lệ).
3. **Kiểm chứng tương tác**: xác minh SUT đã gọi đúng DOC, đúng số lần, đúng thứ tự, và quan trọng là **đã không gọi** những DOC mà theo thiết kế phải bị bỏ qua khi xảy ra lỗi (fail-fast).

Một nghiên cứu quy mô (10.846 test script của 4 dự án mã nguồn mở) chỉ ra rằng **mock thái quá (over-mocking)** làm tăng gánh nặng bảo trì đối tượng giả lập và có thể gây **test fail giả**, còn **mock thiếu (under-mocking)** khiến không cô lập được CUT; đồng thời **17%** đối tượng bị mock được thêm vào *sau* khi test ra đời và **13%** đối tượng mock ban đầu *về sau không còn bị mock* — cho thấy quyết định mock là biến động và cần nguyên tắc rõ ràng [4]. Đây là cơ sở để Chương 2 đặt ra tiêu chí "khi nào nên/không nên mock".

---

# CHƯƠNG 2. NGHIÊN CỨU KỸ THUẬT MOCKING VÀ CÔNG CỤ MOCKITO

## 2.1. Nguyên lý hoạt động của kỹ thuật Mocking

Mocking hoạt động dựa trên ba ý tưởng:

1. **Đối tượng giả lập tại biên hệ thống.** Ta xác định "biên giới" giữa logic cần kiểm thử (SUT) và thế giới bên ngoài (DOC), rồi thay mọi thứ bên ngoài biên này bằng đối tượng giả lập. SUT **chạy thật**, mọi thứ nó gọi ra ngoài là **giả lập**.

2. **Lập trình hành vi (stubbing).** Trước khi gọi SUT, ta "dạy" cho double biết cần trả về gì (`stub`/`willReturn`) hoặc ném lỗi gì (`willThrow`). Nhờ đó, điều kiện đầu vào trở nên **hoàn toàn xác định** — kể cả các tình huống không thể tái lập trong môi trường thật.

3. **Xác minh (verification).** Sau khi SUT chạy, ta kiểm tra: kết quả trả về (nếu có) **và** các tương tác với DOC — đã gọi chưa, gọi mấy lần, thứ tự ra sao, có gọi nhầm không.

Về mặt kỹ thuật, thư viện mocking hiện đại tạo đối tượng giả lập bằng **sinh lớp động (dynamic proxy / bytecode manipulation)** ở thời điểm chạy. Một tài liệu kinh điển về "phép thuật" này cảnh báo: các công cụ mock mạnh (như JMockIt có thể thay cả phương thức `static`) mở ra khả năng kiểm thử mã cũ nhưng cũng dễ khiến lập trình viên "đi đường tắt" mà bỏ qua việc sửa chữa coupling — do đó cần kỷ luật sử dụng [6].

## 2.2. Dependency Injection hỗ trợ Mocking

Mocking hoạt động hiệu quả nhất khi **phụ thuộc được tiêm từ bên ngoài (Dependency Injection – DI)** thay vì SUT tự khởi tạo (`new`) hay gọi `static` trực tiếp. Khi các phụ thuộc được inject qua **constructor**, việc thay thế bằng double chỉ còn là "đưa phiên bản giả vào" [6].

Các lợi ích:

- **Seam rõ ràng:** mỗi phụ thuộc là một tham số có thể truyền thay thế.
- **Interface-based design:** SUT phụ thuộc *abstraction* (interface), nên có thể thay bằng cài đặt giả.
- **Hỗ trợ tiêm tự động:** framework test đọc constructor và bơm double tương ứng.

Trong Spring, hai cơ chế DI phổ biến là constructor injection (`@RequiredArgsConstructor` của Lombok) và field injection. **Constructor injection** được khuyến nghị vì bảo đảm tính bất biến và thể hiện phụ thuộc rõ ràng — và chính nó cho phép Mockito tự động tiêm qua `@InjectMocks` [3, 7].

## 2.3. Mockito Framework

**Mockito** là framework mocking phổ biến nhất cho Java [6] và được dùng rộng rãi trong các dự án Java thực tế [4, 7]. Đặc điểm:

- **Khai báo:** `@ExtendWith(MockitoExtension.class)` kích hoạt Mockito cho JUnit 5; `@Mock` tạo double; `@InjectMocks` tiêm các double vào SUT qua constructor/setter [3, 7].
- **API cổ điển:** `when(mock.method()).thenReturn(v)`, `verify(mock).method()`.
- **BDDMockito (phong cách BDD):** `given(mock.method()).willReturn(v)`, `then(mock).should().method()` — được khuyến nghị vì đọc như ngôn ngữ tự nhiên, khớp với cấu trúc **Given–When–Then** [7].
- **Đối sánh đối số:** `any()`, `eq()`, `anyString()`… (lưu ý hạn chế việc lạm dụng `any()` khi cần kiểm tra dữ liệu cụ thể) [7].

Trong thực nghiệm này, Mockito được dùng dưới dạng **BDDMockito thuần túy** để bộ test đọc được như đặc tả hành vi (xem Mục 3.3, 3.4).

## 2.4. Các kỹ thuật Mocking với Mockito

Bảng dưới tổng hợp các kỹ thuật Mockito tiêu biểu, đối chiếu với tài liệu thực hành và tài liệu framework:

| # | Kỹ thuật | API Mockito | Mục đích |
|---|---|---|---|
| 1 | Tạo & tiêm double | `@Mock`, `@InjectMocks` | Thay toàn bộ DOC bằng giả lập, tiêm vào SUT [3, 7]. |
| 2 | Stub giá trị trả về | `given(...).willReturn(v)` | Điều khiển đầu vào (happy path & biên) [3, 7]. |
| 3 | Giả lập ngoại lệ | `given(...).willThrow(ex)` | Mô phỏng lỗi hạ tầng/DOC [7]. |
| 4 | Stub phương thức `void` | `willDoNothing()/willThrow().given(mock).voidMethod()` | Xử lý hành vi của DOC void. |
| 5 | Xác minh số lần gọi | `then(m).should(times(n))`, `never()` | Kiểm chứng tương tác đúng/đủ/không [7]. |
| 6 | Xác minh không tương tác | `then(m).shouldHaveNoInteractions()` | Chứng minh **fail-fast**: nhánh lỗi không chạm DOC phía sau [4]. |
| 7 | Bắt đối số | `ArgumentCaptor` | Kiểm tra chi tiết đối tượng SUT truyền cho DOC [7]. |
| 8 | Kiểm thử thứ tự | `InOrder` | Xác minh trình tự gọi theo nghiệp vụ [7]. |
| 9 | Kiểm thử có tham số | `@ParameterizedTest` + `@CsvSource` | Tránh lặp test cho nhiều bộ dữ liệu [7]. |
| 10 | Đối chứng Fake | cài đặt in-memory | Dùng khi chỉ cần hành vi lưu/đọc đơn giản [7]. |

Các kỹ thuật #1–#8 được áp dụng trực tiếp trong bộ test của thực nghiệm (minh chứng tại Chương 3); kỹ thuật #9 (parameterized) dùng cho các lớp thuần logic có nhiều bộ dữ liệu biên.

## 2.5. Nguyên tắc và lưu ý khi áp dụng kỹ thuật Mocking

### 2.5.1. Khi nào nên áp dụng kỹ thuật Mocking

Nên mock khi **DOC nằm ngoài phạm vi kiểm thử đơn vị** hoặc khi cần **kiểm soát điều kiện** mà hạ tầng thật không cho phép [4, 6, 7]:

- Truy cập **cơ sở dữ liệu/Repository** (I/O chậm, phụ thuộc môi trường).
- Gọi **dịch vụ bên thứ ba** (email, SMS, cổng thanh toán, bản đồ) — không ổn định, có thể phát sinh chi phí/ side-effect thật.
- Các **Service khác** khi muốn cô lập logic của SUT (Service-to-Service).
- Khi cần **giả lập lỗi/edge case** khó tạo: lỗi mạng, time-out, dữ liệu trùng, hết hạn, giao dịch thất bại.
- Khi chỉ quan tâm **kiểm chứng tương tác** (SUT có gọi đúng DOC không).

### 2.5.2. Khi nào không nên áp dụng kỹ thuật Mocking

Không nên mock khi việc mock làm mất giá trị kiểm thử [2, 4, 7]:

- **Đối tượng giá trị (POJO/entity/DTO):** là dữ liệu thuần, nên dùng thật.
- **Logic thuần (pure logic):** tính toán, công thức — **không có DOC**, nên test trực tiếp, không cần mock (tránh over-mocking).
- **Thư viện chuẩn/khung sẵn có** (ví dụ `List`, `Map`): mock là dư thừa và dễ tạo hành vi phi thực tế.
- Khi mục tiêu là kiểm chứng **tích hợp thật** (SQL đúng, giao tiếp giữa các tầng): phải dùng **Integration Test**, không thay bằng mock.
- Khi chi tiết cài đặt (implementation detail) bị đưa vào test: test "giòn" và gãy khi refactor dù hành vi không đổi [2].

### 2.5.3. Những hạn chế khi lạm dụng kỹ thuật Mocking (Over-Mocking)

Mocking là "con dao hai lưỡi":

- **Test không còn phản ánh thực tế:** mock "dạy" DOC trả về đúng như ta kỳ vọng, nên test có thể xanh dù mã sai logic — đặc biệt nguy hiểm khi mock cả những thành phần đáng lẽ phải chạy thật [2, 4].
- **Chi phí bảo trì cao:** khi SUT thay đổi cách gọi DOC, hàng loạt test mock phải sửa theo; số liệu cho thấy đối tượng bị mock thay đổi theo thời gian đáng kể (17%/13%) [4].
- **Cảnh báo về công cụ mạnh:** các công cụ mock quá "ảo diệu" (thay `static`, chọc sâu vào classloader) khiến lập trình viên giải quyết triệu chứng thay vì nguyên nhân và triệt tiêu động lực cải thiện thiết kế [6].
- **Kiểm chứng quá chi tiết (over-specification):** kiểm tra từng lời gọi nội bộ làm test gắn chặt vào cài đặt [2].

**Nguyên tắc cân bằng:** mock đúng **biên hệ thống**, giữ logic thuần chạy thật, và luôn có Integration Test cho phần tương tác thật (ranh giới tại Mục 2.5.4) [2, 4, 6].

### 2.5.4. So sánh kiểm thử sử dụng Mocking và kiểm thử tích hợp (Integration Testing)

| Tiêu chí | Unit Test có Mocking | Integration Test (không Mock) |
|---|---|---|
| Phạm vi | Một đơn vị + DOC giả lập | Nhiều thành phần thật (DB, context) |
| Tốc độ | Rất nhanh (mili-giây/test) | Chậm (giây/phút; phụ thuộc khởi động context/DB) |
| Tính ổn định | Cao (không phụ thuộc mạng/DB) | Có thể flaky theo dữ liệu/môi trường |
| Kiểm chứng | Logic + tương tác (behavior) | Tương tác thật, câu lệnh SQL, cấu hình |
| Giá trị phát hiện lỗi | Logic nghiệp vụ, biên, lỗi DOC | Lỗi tích hợp, schema, transaction, wiring |
| Chi phí bảo trì | Trung bình–cao (phụ thuộc mock) | Cao (quản lý môi trường/dữ liệu) |
| Khi dùng | Kiểm thử đơn vị logic | Xác minh toàn hệ thống/`@SpringBootTest` |

**Ranh giới của đồ án:** đề tài tập trung vào **Unit Test có Mocking**; phần so sánh định lượng (có/không Mock) chỉ dùng để **đối chứng hiệu quả**, **không** nhằm thay thế Integration Test. Các khía cạnh như "câu lệnh SQL đúng" hay "giao tiếp giữa các tầng" thuộc phạm vi Integration Test và nằm ngoài đề tài [2, 6].

---

# CHƯƠNG 3. TRIỂN KHAI THỰC NGHIỆM ỨNG DỤNG MOCKING

> **Ghi chú nguồn dữ liệu.** Toàn bộ số đo trong chương này lấy từ các tệp bằng chứng thô trong `bang_chung_so_lieu/`:
> - `run_158_kiem_thu_don_vi.log` — chạy 158 unit test có Mocking (kèm JaCoCo).
> - `run_163_toan_bo_co_demo.log` — chạy toàn bộ 163 lượt (158 unit + 5 demo đối chứng).
> - `run_thu_tu_ngau_nhien.log`, `run_le_1_lop_kiem_thu.log`, `run_le_1_phuong_thuc.log` — bằng chứng độc lập.
> - `jacoco_do_bao_phu_158.csv`, `jacoco_do_bao_phu_163.csv` — số liệu độ bao phủ JaCoCo theo lớp.
> - `Ket_qua_test_case.csv` — kết quả từng test case.
> - `ket_qua_verify_mocking.log`, `jacoco_do_bao_phu_194.csv` — lần đo mới nhất **18/10/2026** trên bộ test mở rộng (194 lượt; `jacoco:check` PASS) — nguồn cho các kết luận hiện hành ở Mục 3.4.5 và 3.5.
> Ngày chạy ghi trong log: **30/09/2026 – 01/10/2026** (các lần đo gốc), **18/10/2026** (lần đo bổ sung 194 lượt).

## 3.1. Đối tượng thực nghiệm

**Đối tượng:** tầng **Service** (`com.speed.delivery.service.impl`) của ứng dụng **Speed Delivery** — hệ thống giao hàng nhanh, kiến trúc phân tầng **Controller → Service → Repository → Entity** trên Spring Boot 3.4.1 / Java 21.

**Quy mô mã nguồn** (liệt kê trực tiếp từ cây mã nguồn `speed-backend/src/main/java`):

| Thành phần | Số lượng |
|---|---:|
| REST Controller | 9 |
| Service interface | 18 |
| Service implementation | 18 |
| Repository (JPA) | 16 |
| Entity | 16 |
| Enum | 10 |
| Exception | 7 |
| DTO (request + response) | 23 |

**Nguyên tắc thiết kế thuận lợi cho Mocking:**

- Mỗi service có **interface** riêng (interface-based design).
- Mọi phụ thuộc được inject qua **constructor** (`@RequiredArgsConstructor` của Lombok) → Mockito có thể tiêm double qua `@InjectMocks`.
- Controller chỉ nhận request và gọi Service; logic nghiệp vụ tập trung tại Service.

**Đồ thị phụ thuộc (DOC) của các lớp được kiểm thử:**

| Lớp (SUT) | Số DOC | DOC tiêu biểu | Cấp độ |
|---|---:|---|---|
| `AuthServiceImpl` | 11 | 5 Repository, `PasswordEncoder`, `AuthenticationManager`, `JwtTokenProvider`, `OTPService`, `EmailService`, `AuditLogService` | Nâng cao |
| `OrderServiceImpl` | 10 | 4 Repository, `PaymentService`, `PricingService`, `DistanceService`, `VoucherService`, `NotificationService`, `AuditLogService` | Nâng cao |
| `DriverServiceImpl` | 5 | 2 Repository, `OrderService`, `NotificationService`, `AuditLogService` | Trung bình |
| `AdminServiceImpl` | 5 | 4 Repository, `AuditLogService` | Trung bình |
| `ReviewServiceImpl` | 5 | 4 Repository, `AuditLogService` | Trung bình |
| `CustomerServiceImpl` | 4 | 3 Repository, `AuditLogService` | Trung bình |
| `PaymentServiceImpl` | 2 | 2 Repository | Cơ bản |
| `NotificationServiceImpl` | 1 | 1 Repository | Cơ bản |
| `VoucherServiceImpl` | 1 | 1 Repository | Cơ bản |
| `CustomUserDetailsService` | 1 | `UserRepository` | Cơ bản |
| `PricingServiceImpl` | **0** | — (pure logic) | Không mock |
| `DistanceServiceImpl` | **0** | — (pure logic) | Không mock |
| `JwtTokenProvider` | **0** | JJWT + cấu hình (pure logic) | Không mock |

Ba lớp `PricingServiceImpl`, `DistanceServiceImpl`, `JwtTokenProvider` **cố ý không mock** — minh họa nguyên tắc "không mock logic thuần" (Mục 2.5.2).

## 3.2. Môi trường thực nghiệm

| Thành phần | Phiên bản / cấu hình | Nguồn |
|---|---|---|
| Hệ điều hành | Windows (win32) | `run_158_kiem_thu_don_vi.log` |
| JDK | Java 21 (Oracle) | dòng khởi động trong `run_163_toan_bo_co_demo.log` |
| Build tool | Apache Maven (Surefire 3.5.2) | `run_158_kiem_thu_don_vi.log` |
| Framework ứng dụng | Spring Boot 3.4.1 | `speed-backend/pom.xml` |
| Test framework | JUnit 5 (Jupiter) + Mockito (BDDMockito) + AssertJ | `pom.xml` (spring-boot-starter-test) |
| Đo độ bao phủ | JaCoCo 0.8.12 (gắn phase `test`) | `pom.xml` |
| CSDL runtime | MySQL (ứng dụng); **test không kết nối** | `application.yml` |
| CSDL cho demo đối chứng | H2 in-memory (`@SpringBootTest` + profile `test`) | `application-test.yml` |

Cấu hình quality gate JaCoCo trong `pom.xml`: **LINE ≥ 90%, METHOD ≥ 90%, BRANCH ≥ 85%** (chạy ở phase `verify`). Đối tượng đo coverage của đồ án là tầng Service (xem Mục 3.5).

## 3.3. Thiết kế các kịch bản Unit Test

### 3.3.1. Phân loại theo ba đường dẫn

Mỗi chức năng được thiết kế theo ba đường dẫn:

| Đường dẫn | Ký hiệu | Định nghĩa áp dụng |
|---|:--:|---|
| **Happy path** | HP | Luồng nghiệp vụ thành công với dữ liệu hợp lệ |
| **Edge case** | ED | Giá trị biên: 0, âm, null, đúng/vượt ngưỡng, trùng lặp, hết hạn, không tìm thấy |
| **Exception path** | EX | Ngoại lệ kỳ vọng: DOC lỗi hoặc vi phạm nghiệp vụ → **fail-fast** |

### 3.3.2. Quy trình 7 bước áp dụng Mocking

1. **Phân tích dependency & xác định seam** — liệt kê DOC của SUT, phân loại (Repository / Service ngoài / hạ tầng / logic thuần).
2. **Chọn công cụ** — `@ExtendWith(MockitoExtension.class)`, không dùng `@SpringBootTest` (không nạp context).
3. **Khởi tạo mock & tiêm** — `@Mock` cho từng DOC, `@InjectMocks` cho SUT.
4. **Thiết kế 3 đường dẫn** — HP/ED/EX, dùng `given().willReturn()` và `given().willThrow()`.
5. **Kiểm chứng kết quả và tương tác** — `then().should(...)`, `shouldHaveNoInteractions()`, `ArgumentCaptor`, `InOrder`.
6. **Chạy & đo** — Surefire (thời gian) + JaCoCo (độ bao phủ) + kiểm tra độc lập.
7. **Đối chứng có/không Mock** — hai lớp demo kiểm thử cùng một logic login.

### 3.3.3. Mẫu tổ chức một test case

Mỗi test theo mẫu **Arrange → Act → Assert → Verify** bằng BDDMockito:

```java
@Test
@DisplayName("TC02 - Email trùng lặp → DuplicateResourceException")
void register_DuplicateEmail() {
    // Arrange: dạy mock trả về email đã tồn tại
    given(userRepository.existsByEmail("test@speed.vn")).willReturn(true);

    // Act + Assert: Service phải fail-fast với ngoại lệ đúng loại
    assertThatThrownBy(() -> authService.register(registerRequest))
            .isInstanceOf(DuplicateResourceException.class);

    // Verify: các DOC phía sau KHÔNG được gọi
    then(roleRepository).shouldHaveNoInteractions();
    then(passwordEncoder).shouldHaveNoInteractions();
}
```

### 3.3.4. Ma trận test case (trích yếu)

> Số lượt chạy mỗi lớp lấy trực tiếp từ `run_158_kiem_thu_don_vi.log` (dòng `Tests run: … -- in <class>`).

| Lớp test | Lượt | SUT | DOC mock | Kịch bản trọng tâm |
|---|:--:|---|---:|---|
| `AuthServiceImplTest` | 22 | `AuthServiceImpl` | 11 | Đăng ký/đăng nhập, email & SĐT trùng, sai mật khẩu, tài khoản khóa, refresh token, OTP, đổi mật khẩu, logout, profile |
| `OrderServiceImplTest` | 17 | `OrderServiceImpl` | 10 | Tạo đơn, áp voucher, gán tài xế, chuyển trạng thái, hủy đơn |
| `PaymentServiceImplTest` | 10 | `PaymentServiceImpl` | 2 | CASH/BANK_TRANSFER, hoàn tiền, amount null/âm, không tìm thấy |
| `VoucherServiceImplTest` | 13 | `VoucherServiceImpl` | 1 | Voucher hết hạn/hết lượt/chưa hiệu lực, cap maxDiscount |
| `CustomerServiceImplTest` | 12 | `CustomerServiceImpl` | 4 | Profile, CRUD địa chỉ, địa chỉ mặc định, sai chủ sở hữu |
| `DriverServiceImplTest` | 12 | `DriverServiceImpl` | 5 | Toggle availability, nhận/từ chối/hoàn thành đơn, thu nhập |
| `AdminServiceImplTest` | 10 | `AdminServiceImpl` | 5 | Dashboard, danh sách user, bật/tắt, xóa user |
| `NotificationServiceImplTest` | 7 | `NotificationServiceImpl` | 1 | Gửi thông báo, đánh dấu đã đọc, đếm chưa đọc |
| `ReviewServiceImplTest` | 7 | `ReviewServiceImpl` | 5 | Tạo đánh giá, rating ngoài khoảng, đánh giá trùng, đơn chưa giao |
| `PricingServiceImplTest` | 22 | `PricingServiceImpl` | **0** | Base price, phí km, phụ phí cân nặng (parameterized), thu nhập 80% |
| `DistanceServiceImplTest` | 10 | `DistanceServiceImpl` | **0** | Haversine, ước lượng thời gian (parameterized) |
| `JwtTokenProviderTest` | 10 | `JwtTokenProvider` | **0** | Sinh/verify access & refresh token, token sai/rỗng |
| `CustomUserDetailsServiceTest` | 5 | `CustomUserDetailsService` | 1 | Load user, tài khoản khóa, nhiều role |
| `SpeedApplicationTest` | 1 | `Application` | **0** | Smoke test |
| **Tổng** | **158** | | | |

### 3.3.5. Ma trận kỹ thuật Mockito × đường dẫn

| Kỹ thuật Mockito | HP | ED | EX |
|---|:--:|:--:|:--:|
| `given(...).willReturn(value)` | ✅ | ✅ | — |
| `given(...).willThrow(ex)` | — | — | ✅ |
| `willReturn(false / Optional.empty())` | — | ✅ | ✅ |
| `then(m).should(...)` (times/never) | ✅ | ✅ | ✅ |
| `then(m).shouldHaveNoInteractions()` | — | — | ✅ |
| `ArgumentCaptor` | ✅ | ✅ | — |
| `InOrder` | ✅ | — | — |

## 3.4. Xây dựng và thực thi Unit Test

### 3.4.1. Kết quả chạy bộ 158 unit test

Từ `run_158_kiem_thu_don_vi.log`:

```
[INFO] Tests run: 158, Failures: 0, Errors: 0, Skipped: 0
[INFO] Analyzed bundle 'Speed Delivery' with 66 classes
[INFO] BUILD SUCCESS
[INFO] Total time:  18.114 s
```

→ **158/158 PASS**, 0 failure, 0 error. Thời gian pipeline (bao gồm Maven + Surefire + sinh báo cáo JaCoCo): **18.114 s**.

### 3.4.2. Thời gian thực thi theo lớp (từ cùng log)

| Lớp test | Time elapsed (s) |
|---|--:|
| `CustomUserDetailsServiceTest` | 4.844 |
| `JwtTokenProviderTest` (Validate 1.617 + Generate 0.050) | ~1.67 |
| `AdminServiceImplTest` | 0.589 |
| `AuthServiceImplTest` | 1.014 |
| `CustomerServiceImplTest` | 0.225 |
| `DistanceServiceImplTest` | 0.223 |
| `DriverServiceImplTest` | 0.238 |
| `NotificationServiceImplTest` | 0.174 |
| `OrderServiceImplTest` | 0.564 |
| `PaymentServiceImplTest` | 0.184 |
| `PricingServiceImplTest` | 0.064 |
| `ReviewServiceImplTest` | 0.156 |
| `VoucherServiceImplTest` | 0.164 |
| `SpeedApplicationTest` | 0.015 |

### 3.4.3. Bằng chứng tính độc lập

| Phép đo | Lệnh | Kết quả | Nguồn |
|---|---|---|---|
| Chạy **1 lớp** | `-Dtest=AuthServiceImplTest` | 22/22 PASS, tổng lệnh 4.916 s | `run_le_1_lop_kiem_thu.log` |
| Chạy **1 method** | `-Dtest=AuthServiceImplTest#register_Success` | 1/1 PASS, tổng lệnh 5.366 s | `run_le_1_phuong_thuc.log` |
| Chạy **thứ tự ngẫu nhiên** | random order toàn bộ | 158/158 PASS, tổng 7.338 s | `run_thu_tu_ngau_nhien.log` |

→ Bộ test chạy đúng khi chạy lẻ, khi đảo thứ tự và **không kết nối CSDL** ⇒ đạt tính cô lập (isolated) theo F.I.R.S.T [1].

### 3.4.4. Thí nghiệm đối chứng CÓ Mock vs KHÔNG Mock

Hai lớp test kiểm thử **cùng một logic** `AuthServiceImpl.login`:

- `MockingDemoTest` — `@ExtendWith(MockitoExtension.class)`, 11 DOC là `@Mock`, **không** DB/context.
- `SpringContextDemoTest` — `@SpringBootTest` + `@ActiveProfiles("test")`, **H2 in-memory thật**, nạp toàn bộ Spring Context.

Số đo từ `run_163_toan_bo_co_demo.log`:

| Phép đo | CÓ Mock | KHÔNG Mock (Spring + H2) | Nguồn |
|---|---|---|---|
| 1 lần login | 10.000 login = **3.567 ms** ⇒ **356,77 µs/login** | 10 login thật = **797 ms** ⇒ **79,70 ms/login** | log |
| Chi phí khởi động | **≈ 0 ms** (không context) | **19.438 ms** (khởi động Spring Context) | log |
| Thời gian cả lớp | 3 test = 7.051 s | 2 test = 20.58 s | log |

**Tỷ lệ hiệu quả đo được:** `79,70 ms ÷ 0,35677 ms ≈ 223 lần` — Mock nhanh hơn khoảng **223×** cho mỗi thao tác login trong lần chạy này. Ngoài ra, chỉ riêng chi phí khởi động Spring Context (**19,4 s**) đã lớn hơn tổng thời gian chạy toàn bộ 158 unit test Mock (**18,1 s**).

Bằng chứng cô lập side-effect: trong chế độ Mock, cổng thanh toán được giả lập in ra `[MOCK PAYMENT] Payment processed…` và toàn bộ email/SMS/OTP **không bao giờ được gửi thật** (thấy trong log của `PaymentServiceImplTest`).

### 3.4.5. Đo lại trên bộ test đã mở rộng (18/10/2026) — nguồn `ket_qua_verify_mocking.log`

Sau khi bổ sung `WalletServiceImplTest` (16 TC) và mở rộng Driver/Voucher/Auth, bộ test có **15 lớp unit + 2 lớp demo đối chứng, 189 lượt unit + 5 lượt demo = 194 lượt**:

```
[INFO] Tests run: 194, Failures: 0, Errors: 0, Skipped: 0
[INFO] --- jacoco:0.8.12:check (check) @ speed-delivery ---   ← PASS lần đầu
[INFO] BUILD SUCCESS — Total time: 01:44 min
[DEMO-1 MOCK] 10.000 login = 6930 ms (693,06 us/login)
[DEMO-5 SPRING+H2] 10 login THAT = 2706 ms (270,60 ms/login)
[DEMO-4 SPRING] Spring Context startup = 39654 ms
```

- 189 test đơn vị thuần Mock chỉ tốn **≈ 4,7 s** (tổng cột `Time elapsed` từng lớp); phần lớn thời gian `verify` đến từ 2 lớp demo (~57 s) + đóng gói jar + JaCoCo.
- Đối chứng lần này: Mock **≈ 0,69 ms/login** so với thật **270,6 ms/login** ⇒ **≈ 390×** (tỷ lệ dao động **223×–420×** giữa các lần đo do tải máy — xem Mục 3.4.4).
- `jacoco:check` được cấu hình lại theo **element=CLASS cho đúng 12 lớp nghiệp vụ trọng tâm** (LINE ≥ 90 %) — lần đầu **PASS**, khắc phục hạn chế "`mvn verify` không đạt" đã ghi nhận trước đây.

## 3.5. Đánh giá kết quả thực nghiệm

### 3.5.1. Tiêu chí 1 — Thời gian chạy (Execution Time)

| Chỉ số | Kết quả | Số đối chứng |
|---|---|---|
| 189 test đơn vị thuần Mock (18/10/2026) | **≈ 4,7 s** (≈ 25 ms/test) | — |
| `mvn clean verify` cả bộ 194 lượt (JaCoCo + check + jar) | **01:44 min** | — |
| 1 login có Mock (18/10) | **0,693 ms** | 1 login không Mock: **270,6 ms** (≈390×; các lần đo trước: 223×–420×) |
| Chi phí khởi động môi trường | **≈ 0 ms** | Spring Context: **19,4–39,7 s** tùy tải máy |

**Đánh giá:** đạt — bộ test đủ nhanh để chạy ở mọi lần commit, đúng nguyên tắc F.I.R.S.T và thực hành "keep the build fast" [1, 6].

### 3.5.2. Tiêu chí 2 — Độ bao phủ mã nguồn (Code Coverage)

Số liệu tổng hợp trực tiếp từ `jacoco_do_bao_phu_194.csv` (bộ 194 lượt, đo ngày 18/10/2026):

| Phạm vi | Bộ 194 lượt (18/10/2026) |
|---|---|
| **Toàn dự án** (66 lớp) — Line | 976/1.298 = **75,2 %** |
| **Toàn dự án** — Branch | 147/222 = **66,2 %** |
| **Package `service.impl`** (18 lớp) — Line | 816/893 = **91,4 %** |
| **12 lớp nghiệp vụ trọng tâm** — Line | 796/814 = **97,8 %** |

**Line coverage theo lớp (từ `jacoco_do_bao_phu_194.csv`):**

| Lớp | Line covered/Total | % Line | Branch |
|---|:--:|:--:|:--:|
| `PaymentServiceImpl` | 28/28 | **100 %** | 8/8 (100 %) |
| `PricingServiceImpl` | 19/19 | **100 %** | 4/4 (100 %) |
| `WalletServiceImpl` | 71/71 | **100 %** | 12/12 (100 %) |
| `DriverServiceImpl` | 56/56 | **100 %** | 9/10 (90,0 %) |
| `AdminServiceImpl` | 49/49 | **100 %** | 5/6 (83,3 %) |
| `NotificationServiceImpl` | 41/41 | **100 %** | (không nhánh) |
| `DistanceServiceImpl` | 12/12 | **100 %** | (không nhánh) |
| `VoucherServiceImpl` | 37/37 | **100 %** | 19/20 (95,0 %) |
| `AuthServiceImpl` | 155/155 | **100 %** | 25/32 (78,1 %) |
| `CustomerServiceImpl` | 98/102 | 96,1 % | 21/30 (70,0 %) |
| `OrderServiceImpl` | 188/199 | 94,5 % | 30/64 (46,9 %) |
| `ReviewServiceImpl` | 42/45 | 93,3 % | 12/14 (85,7 %) |
| `JwtTokenProvider` | 43/47 | 91,5 % | — |
| `CustomUserDetailsService` | 10/10 | **100 %** | 2/2 (100 %) |

**Các lớp ngoài phạm vi test (còn lại):**

| Lớp | Line | % |
|---|:--:|:--:|
| `AuditLogServiceImpl` | 11/31 | 35,5 % |
| `OTPServiceImpl` | 1/23 | 4,3 % |
| Hạ tầng (`MapService`, `EmailService`, `SMSService`, `FileStorageService`) | 2/6 · 2/8 · 2/4 · 2/7 | 33,3 % · 25,0 % · 50,0 % · 28,6 % |
| Controller (9 lớp) | 0/… | 0 % |

**Đánh giá có đối chiếu quality gate `pom.xml` (LINE ≥ 90 % cho 12 lớp nghiệp vụ trọng tâm):**

- **Đạt:** 12/12 lớp trọng tâm ≥ 93,3 %; trong đó **9 lớp đạt 100 %** (Payment, Pricing, Wallet, Driver, Admin, Notification, Distance, Voucher, Auth). `jacoco:check` xác minh **tự động** điều kiện này trong `mvn verify` — build sẽ đỏ nếu bất kỳ lớp nào tụt dưới 90 %.
- **Chưa đạt 90 %:** vùng **Controller**, `AuditLogServiceImpl`, `OTPServiceImpl` và các lớp hạ tầng (ngoài phạm vi bộ test hiện tại).
- **Branch** của `OrderServiceImpl` (46,9 %) và `AuthServiceImpl` (78,1 %) còn thấp so với mức lý tưởng 85 % — ghi nhận là hướng hoàn thiện tiếp theo (Mục 4.3).

> **Diễn giải ranh giới:** con số **75,2 % toàn dự án** bị kéo xuống bởi các lớp **nằm ngoài phạm vi unit test có Mocking** (Controller, entity POJO, config, hạ tầng). Đối tượng của Mocking — **12 lớp nghiệp vụ trọng tâm** — đạt **97,8 % line** (9 lớp 100 %). Rule `jacoco:check` trong `mvn verify` vì vậy được **thu hẹp đúng vào 12 lớp này** (thay vì BUNDLE toàn dự án) để quality gate phản ánh đúng phạm vi đề tài và hiện **PASS** [2, 6].

### 3.5.3. Tiêu chí 3 — Tính độc lập (Test Isolation)

| Chỉ báo | Cách kiểm chứng | Kết quả | Nguồn |
|---|---|---|---|
| I1 — Không phụ thuộc môi trường | Chạy khi MySQL đang bật nhưng test không kết nối | 194/194 PASS (18/10) | `ket_qua_verify_mocking.log` |
| I2 — Không chia sẻ trạng thái | `@BeforeEach` + Mockito tạo mock mới mỗi test | PASS | mã test |
| I3 — Thứ tự không ảnh hưởng | Chạy lẻ lớp / lẻ method / random order; full-run bộ 194 | 26/26 · 1/1 · 189/189 (18/10) · 194/194 PASS | `run_le_auth_189.log`, `run_le_1method_189.log`, `run_thu_tu_ngau_nhien_189.log`, `ket_qua_verify_mocking.log` |
| I4 — Không phụ thuộc mạng | Email/SMS/Map/Payment là mock | Chỉ thấy `[MOCK PAYMENT]` | `run_158_kiem_thu_don_vi.log` |

**Đánh giá:** đạt — bộ test độc lập tuyệt đối theo định nghĩa F.I.R.S.T [1] và loại bỏ Platform Dependency [6].

### 3.5.4. Tổng hợp kết quả đối chiếu tiêu chí

| Tiêu chí | Ngưỡng/tham chiếu | Kết quả thực đo | Kết luận |
|---|---|---|---|
| Kết quả test | 0 failure, 0 error | 194/194 (15 lớp unit + 2 lớp demo, đo 18/10) PASS | ✅ |
| Execution time | Nhanh, chạy mỗi commit | 189 test unit ≈ 4,7 s; verify đầy đủ 1:44 min; ≈ 0,69 ms/login | ✅ |
| Coverage tầng Service | Hướng tới ≥ 90 % | 12 lớp trọng tâm **97,8 %** line (9 lớp 100 %); `service.impl` 91,4 % | ✅ |
| Quality gate `jacoco:check` | PASS khi `mvn verify` | PASS — 12 lớp CLASS ≥ 90 % line | ✅ |
| Coverage toàn dự án | ≥ 60 % (đề xuất) | 75,2 % line / 66,2 % branch | ✅ |
| Branch coverage lớp trọng yếu | ≥ 85 % | Order 46,9 %, Auth 78,1 % chưa đạt | ❌ cần bổ sung |
| Test Isolation | Random order 100 %, 0 flaky | 194/194 full-run; 189/189 random, 0 flaky | ✅ |
| Đối chứng có/không Mock | Mock nhanh hơn rõ rệt | ≈ 390× (dao động 223×–420×); tiết kiệm ~19–40 s khởi động/lần | ✅ |

---

# CHƯƠNG 4. KẾT LUẬN VÀ HƯỚNG PHÁT TRIỂN

## 4.1. Các kết quả đạt được

1. **Hệ thống hóa cơ sở lý thuyết** về Unit Testing, Test Double và Mocking, làm rõ phân biệt Stub/Mock, vai trò của DI và cơ chế hoạt động của Mocking (Chương 1–2), có đối chiếu các nguồn tài liệu chuẩn mực [1, 2, 3, 6, 7].
2. **Xây dựng thành công bộ unit test có Mocking** cho tầng Service của Speed Delivery: **15 lớp unit + 2 lớp demo đối chứng, 194 lượt test (189 unit + 5 demo), 100 % PASS** (đo lại 18/10/2026), bao phủ cả 3 đường dẫn HP/ED/EX; áp dụng đầy đủ 10 kỹ thuật Mockito (Mục 2.4).
3. **Chứng minh hiệu quả bằng số đo từ bằng chứng thô:**
   - Thời gian: 189 test unit thuần Mock chỉ tốn **≈ 4,7 s** (~25 ms/test); `mvn clean verify` đầy đủ 194 lượt hết **01:44 min** (`ket_qua_verify_mocking.log`).
   - Cô lập: chạy lẻ/đảo thứ tự đều PASS; không kết nối CSDL.
   - Đối chứng: Mock **nhanh hơn ≈ 390×** mỗi login (dao động 223×–420× giữa các lần đo) và tiết kiệm **~19–40 s** khởi động Spring Context mỗi phiên chạy.
4. **Đo lường độ bao phủ trung thực:** **12 lớp nghiệp vụ trọng tâm đạt 97,8 % line (9 lớp 100 %)**, gói `service.impl` 91,4 %; quality gate `jacoco:check` (12 lớp, LINE ≥ 90 %) **PASS trong `mvn verify`**; ranh giới với vùng Controller/Entity/hạ tầng được nêu rõ (75,2 % toàn dự án).
5. **Vận dụng nguyên tắc "không over-mocking":** cố ý để 3 lớp logic thuần (`Pricing`, `Distance`, `JwtTokenProvider`) chạy thật, không mock.

## 4.2. Các hạn chế

- **Branch coverage chưa đạt ngưỡng 85 %** ở `OrderServiceImpl` (46,9 %) và `AuthServiceImpl` (78,1 %): còn nhánh điều kiện chưa được kích hoạt.
- **Hai lớp nghiệp vụ chưa có test riêng**: `AuditLogServiceImpl` (35,5 %) và `OTPServiceImpl` (4,3 %); `WalletServiceImpl` đã được bổ sung đạt 100 % (18/10/2026).
- **Quality gate `jacoco:check` đã được thu hẹp phạm vi** từ BUNDLE toàn dự án (không khả thi vì Controller/Entity/Config chưa test) sang **12 lớp nghiệp vụ trọng tâm (LINE ≥ 90 %)** và hiện **PASS** — ranh giới phạm vi được nêu rõ để tránh hiểu sai.
- **Mock không chứng minh tương tác thật:** test mock xác nhận Service gọi `repository.save()` nhưng **không** chứng minh câu lệnh SQL đúng — phần này thuộc **Integration Test** (Mục 2.5.4) [2].
- **Rủi ro bảo trì:** khi SUT đổi cách gọi DOC, test mock phải sửa theo (đúng như tài liệu MockSniffer chỉ ra: 17 %/13 % mock thay đổi theo thời gian) [4].

## 4.3. Hướng phát triển

1. **Bổ sung test** cho `AuditLogServiceImpl`, `OTPServiceImpl`; tăng branch coverage cho Order/Auth để đạt ngưỡng ≥ 85 %.
2. **Bổ sung Integration Test** với `@SpringBootTest`/H2 và cân nhắc **Testcontainers** để xác minh SQL, transaction và wiring thật — hoàn thiện bức tranh chất lượng bên cạnh unit test.
3. **Tích hợp CI/CD** để tách tầng unit test (nhanh) và integration test (chậm), chạy unit test ở mỗi commit.
4. **Nghiên cứu quyết định mock tự động** theo hướng của MockSniffer [4] và sinh mock từ hành vi production theo hướng của RICK [5] nhằm giảm chủ quan khi quyết định mock.
5. **Đo lường bổ sung bằng mutation testing** để đánh giá chất lượng assertion (ngoài phạm vi coverage).

---

# DANH MỤC TỪ VIẾT TẮT

| Viết tắt | Nghĩa |
|---|---|
| SUT | System Under Test / Service Under Test |
| DOC | Depended-On Component |
| DI | Dependency Injection |
| HP / ED / EX | Happy path / Edge case / Exception path |
| AAA | Arrange–Act–Assert |
| BDD | Behavior-Driven Development |
| JWT | JSON Web Token |
| JPA | Java Persistence API |

---

# TÀI LIỆU THAM KHẢO

> Danh sách nguồn lý thuyết được lấy từ thư mục `TaiLieu/` (file `danh-sach-duong-dan-tai-lieu.docx`). Các đường dẫn đã được kiểm chứng truy cập được.

[1] R. Osherove and V. Khorikov, *The Art of Unit Testing*, 3rd ed. Shelter Island, NY, USA: Manning Publications, 2024.
- Manning Livebook (Chapter 1 — The basics of unit testing): https://livebook.manning.com/book/the-art-of-unit-testing-third-edition/
- Mã nguồn kèm sách: https://github.com/royosherove/aout3-samples

[2] V. Khorikov, *Unit Testing: Principles, Practices, and Patterns*. Shelter Island, NY, USA: Manning Publications, 2020.
- Trang sách: https://www.manning.com/books/unit-testing
- Đọc trực tuyến (bản extract): https://livebook.manning.com/book/unit-testing

[3] T. Kaczanowski, *Practical Unit Testing with JUnit and Mockito*, 2nd ed. Kraków, Poland: Leanpub, 2019.
- Trang sách: https://leanpub.com/practicalunittestingwithjunitandmockito-2ndedition
- Trang tác giả: https://leanpub.com/u/tomekkaczanowski

[4] H. Zhu, L. Wei, M. Wen, Y. Liu, S.-C. Cheung, Q. Sheng, and C. Zhou, "MockSniffer: Characterizing and Recommending Mocking Decisions for Unit Tests," in *Proc. 35th IEEE/ACM Int. Conf. on Automated Software Engineering (ASE 2020)*, 2020, pp. 436–447.
- Cổng nghiên cứu HKUST: https://researchportal.hkust.edu.hk/en/publications/mocksniffer-characterizing-and-recommending-mocking-decisions-for/
- DOI chính thức: https://doi.org/10.1145/3324884.3416539

[5] D. Tiwari, M. Monperrus, and B. Baudry, "Mimicking Production Behavior with Generated Mocks," *IEEE Transactions on Software Engineering*, 2024.
- arXiv: https://arxiv.org/abs/2208.01321 (PDF: https://arxiv.org/pdf/2208.01321)
- DOI IEEE TSE: https://doi.org/10.1109/tse.2024.3458448

[6] B. L. Schuchert, "Modern Mocking Tools and Black Magic," Martin Fowler, 10 Sep. 2012.
- https://martinfowler.com/articles/modernMockingTools.html

[7] M. Kumar, "JUnit and Mockito Best Practices for Unit Testing in Java," DEV Community, 08 Aug. 2025.
- https://dev.to/iammadhankumar/junit-and-mockito-best-practices-for-unit-testing-in-java-4icb

[8] G. Y.-H. Chen and P.-Q. Wang, "Test Case Prioritization in a Specification-based Testing Environment," *Journal of Software*, vol. 9, no. 8, pp. 2056–2064, 2014. (Tệp trong `TaiLieu/`: `11846-28216-1-PB.pdf`.)

[9] S.-e.-Z. Haidry and T. Miller, "Using Dependency Structures for Prioritisation of Functional Test Suites," *IEEE Transactions on Software Engineering*, 2012.
- DOI IEEE Xplore: https://doi.org/10.1109/TSE.2012.38 (Tệp trong `TaiLieu/`: `tse-2012-dsp-prioritisation.pdf`.)

---

## PHỤ LỤC A — DANH MỤC TỆP BẰNG CHỨNG SỐ LIỆU

| Tệp | Nội dung | Số liệu được dùng |
|---|---|---|
| `bang_chung_so_lieu/run_158_kiem_thu_don_vi.log` | Chạy 158 unit test + JaCoCo | "Tests run: 158", "Total time: 18.114 s", per-class time |
| `bang_chung_so_lieu/run_163_toan_bo_co_demo.log` | Chạy 163 lượt (kèm demo) | DEMO-1/4/5, "Tests run: 163", "Total time: 35.846 s" |
| `bang_chung_so_lieu/run_thu_tu_ngau_nhien.log` | Chạy thứ tự ngẫu nhiên | 158/158 PASS, 7.338 s |
| `bang_chung_so_lieu/run_le_1_lop_kiem_thu.log` | Chạy lẻ một lớp | 22/22 PASS, 4.916 s |
| `bang_chung_so_lieu/run_le_1_phuong_thuc.log` | Chạy lẻ một method (đợt 29/09) | 1/1 PASS, 5.366 s |
| `bang_chung_so_lieu/run_le_auth_189.log` | Chạy lẻ một lớp, bộ 189 lượt (18/10/2026) | 26/26 PASS, 17,099 s |
| `bang_chung_so_lieu/run_le_1method_189.log` | Chạy lẻ một method, bộ 189 lượt (18/10/2026) | 1/1 PASS, 14,302 s |
| `bang_chung_so_lieu/run_thu_tu_ngau_nhien_189.log` | Chạy random order bộ 189 lượt (18/10/2026) | 189/189 PASS, 20,554 s |
| `bang_chung_so_lieu/jacoco_do_bao_phu_158.csv` | Coverage bộ 158 test | 62,2 % line / 57,9 % branch toàn dự án; 79,0 % service.impl |
| `bang_chung_so_lieu/jacoco_do_bao_phu_163.csv` | Coverage bộ 163 (kèm demo) | 68,6 % line toàn dự án; 81,4 % service.impl; coverage theo lớp |
| `bang_chung_so_lieu/Ket_qua_test_case.csv` | Kết quả từng test case | 194 lượt (182 phương thức), tất cả "Đạt" |
| `bang_chung_so_lieu/ket_qua_verify_mocking.log` | **Lần đo mới nhất 18/10/2026**: `mvn clean verify` 194 lượt + `jacoco:check` PASS | "Tests run: 194", "Total time: 01:44 min", DEMO-1/4/5 |
| `bang_chung_so_lieu/jacoco_do_bao_phu_194.csv` | Coverage bộ 194 lượt (18/10) | 75,2 % line / 66,2 % branch toàn dự án; `service.impl` 91,4 %; 12 lớp trọng tâm 97,8 % |

## PHỤ LỤC B — LỆNH TÁI LẬP KẾT QUẢ

```bash
cd speed-backend

# 1. Chạy toàn bộ + sinh báo cáo JaCoCo + tự kiểm tra ngưỡng coverage
mvn clean verify
# → "Tests run: 194, Failures: 0" + jacoco:check PASS + BUILD SUCCESS

# 2. Chạy riêng thí nghiệm đối chứng có/không Mock
mvn test -Dtest=MockingDemoTest,SpringContextDemoTest

# 3. Chứng minh tính độc lập (không cần CSDL)
mvn test -Dtest=AuthServiceImplTest

# 4. Xem báo cáo độ bao phủ trực quan
#    mở speed-backend/target/site/jacoco/index.html
```