# TEST-AUDIT - Handoff

## 1. Summary

Đã thêm đúng một test class thuần Mockito cho `AuditLogServiceImpl`
(`speed-backend/src/test/java/com/speed/delivery/service/impl/AuditLogServiceImplTest.java`) gồm 13 test
trong 4 `@Nested`, phủ 4 phương thức public, chỉ mock `LogRepository`. Lần chạy mới nhất:
`mvn -q verify` từ `speed-backend/` exit 0, `jacoco:check` PASS; 13/13 test pass, 0 failure/error/skip;
`AuditLogServiceImpl` đạt 31/31 dòng (100%) và 103/103 instruction theo `target/site/jacoco/jacoco.csv`.
Không sửa production code, `pom.xml`, test cũ hay demo test; lớp này vẫn chưa nằm trong danh sách
`jacoco:check` includes.

## 2. Why

- Vấn đề: `AuditLogServiceImpl` được 6 service nghiệp vụ gọi để ghi audit và cấp dữ liệu cho 2 endpoint
  admin, nhưng trước feature chưa có test class nên hành vi ghi log và ánh xạ `Log` -> `LogResponse`
  không được bảo vệ khi refactor.
- Quyết định: viết unit test thuần Mockito ở tầng Service, mock `LogRepository` để kiểm soát page,
  trang rỗng và lỗi DB mà không cần database, đúng phạm vi thực nghiệm của `GEMINI.md`.
- Loại bỏ: `@SpringBootTest`/`@DataJpaTest`/H2 (chậm, không phải unit test cô lập); test qua controller
  hoặc repository (ngoài phạm vi unit test của repo); sửa production code để thêm validation hoặc bọc
  ngoại lệ (thay đổi hành vi, ngoài phạm vi).

## 3. What changed

- `speed-backend/src/test/java/com/speed/delivery/service/impl/AuditLogServiceImplTest.java` -> file mới,
  chứa toàn bộ 13 test; hiện là file untracked (`git status --short`).
- `specs/TEST-AUDIT/spec.md` -> đặc tả đã được duyệt (artifact của pipeline, không phải code chạy).
- `specs/TEST-AUDIT/reviews/spec-review-1.md`, `specs/TEST-AUDIT/reviews/code-review-1.md` -> biên bản
  review (APPROVE), lưu làm decision trail.
- `docs/handoff/TEST-AUDIT.md` -> tài liệu bàn giao này.
- Không thay đổi `AuditLogServiceImpl`, interface, repository, entity, DTO, `pom.xml`, test cũ hay
  `src/test/java/com/speed/delivery/demo/`.

## 4. How it works

- 4 `@Nested`: ghi log 5 tham số (3 test, `AL-TC01`..`AL-TC03`), ghi log 2 tham số (3 test,
  `AL-TC04`..`AL-TC06`), lấy toàn bộ log (4 test, `AL-TC07`..`AL-TC09`, `AL-TC13`), lấy log theo user
  (3 test, `AL-TC10`..`AL-TC12`).
- Fixture mới trong `@BeforeEach`: `pageable = PageRequest.of(0, 10)`, `log1`/`log2` với timestamp cố
  định `T1`/`T2`, `systemLog` có `userId`, `entityType`, `entityId`, `details` null.
- Biên mock: chỉ `LogRepository` là mock (`@Mock`, test:46). `Log`, `LogResponse`, `Page`/`PageImpl`,
  `PageRequest`/`Pageable` và SUT là object thật; không mock entity/DTO/value object.
- HP/ED của `log` dùng `ArgumentCaptor<Log>` rồi assert 5 trường và các trường JPA chưa set
  (`id`, `createdAt`, `ipAddress`) là null. EX dùng `any(Log.class)` để chứng minh SUT đã cố `save`
  trước khi lỗi lan truyền.
- Test đọc dùng `PageImpl` thật, assert nội dung, thứ tự và metadata; verify đúng finder `times(1)`
  với `userId`/`pageable` cụ thể, finder còn lại `never()`, `save` `never()`, kết thúc bằng
  `shouldHaveNoMoreInteractions()`. Strict stubs giữ mặc định, không `lenient()`.

## 5. Contracts

| Phương thức | Hành vi quan sát được |
|---|---|
| `log(Long userId, String action, String entityType, Long entityId, String details)` | Tạo `Log` qua builder với đúng 5 giá trị; gọi `logRepository.save` đúng 1 lần; `id`, `createdAt`, `ipAddress` vẫn null trong unit test; ghi `log.debug` sau `save`. |
| `log(String action, String details)` | Tạo `Log` chỉ với `action`, `details`; `userId`, `entityType`, `entityId`, `id`, `createdAt`, `ipAddress` null; gọi `save` đúng 1 lần. |
| `getAllLogs(Pageable pageable)` | Gọi `findAllByOrderByCreatedAtDesc(pageable)` đúng 1 lần; `Page.map(this::mapResponse)`; giữ thứ tự và metadata trang. |
| `getUserLogs(Long userId, Pageable pageable)` | Gọi `findByUserIdOrderByCreatedAtDesc(userId, pageable)` đúng 1 lần; ánh xạ và giữ metadata như trên. |

Ánh xạ `Log` -> `LogResponse` trong `mapResponse` (`AuditLogServiceImpl.java:61-71`) gồm 7 trường:
`id`, `userId`, `action`, `entityType`, `entityId`, `details`, `createdAt`. `ipAddress` không có trong
DTO và không được SUT set.

Ngoại lệ: SUT không có validation, không `try/catch`, không có domain exception. Mọi ngoại lệ từ
`LogRepository` lan truyền nguyên vẹn; 4 test EX assert đúng
`DataAccessResourceFailureException` với message `Database is down`.

## 6. Configuration and migration

Không có. Không thêm dependency, config key, feature flag hay migration database; `pom.xml` không đổi.
`AuditLogServiceImpl` vẫn không nằm trong `<includes>` của `jacoco:check` (`pom.xml:192-205`), nên
coverage của lớp này được xác nhận thủ công từ báo cáo JaCoCo, không phải bằng gate tự động.

## 7. How to verify

Chạy từ `C:\Users\ANHVU\LEARNING\DATN\DATN-Project\speed-backend`:

```powershell
mvn -q -Dtest=AuditLogServiceImplTest test
mvn -q verify
```

Kết quả mong đợi (số liệu lấy từ lần chạy `mvn -q verify` ngày 2026-10-20):

- Lệnh đầu (chạy riêng class): kỳ vọng exit 0. Surefire tạo 4 báo cáo nested:
  `TEST-com.speed.delivery.service.impl.AuditLogServiceImplTest$GhiLogDayDuTests.xml` (3 test, 0.009 s),
  `...$GhiLogToiGianTests.xml` (3 test, 0.015 s), `...$LayTatCaLogTests.xml` (4 test, 0.008 s),
  `...$LayLogTheoNguoiDungTests.xml` (3 test, 0.085 s). Tổng: **13 test, 0 failure, 0 error, 0 skip**.
  Báo cáo top-level `com.speed.delivery.service.impl.AuditLogServiceImplTest.txt` ghi `Tests run: 0`
  vì toàn bộ test nằm trong `@Nested`; phải cộng 4 báo cáo nested mới ra 13. Số thời gian dưới đây
  lấy từ lần chạy `mvn -q verify` trong phiên bàn giao, cùng bộ test này.
- Lệnh thứ hai: exit 0, **`jacoco:check` PASS** (check gắn ở phase `verify`, `pom.xml:183-216`).
  Lệnh này chạy toàn bộ suite, bao gồm `SpringContextDemoTest` có sẵn dùng Spring/H2; điều đó không
  ảnh hưởng tính cô lập của `AuditLogServiceImplTest`.
- Coverage từ `target/site/jacoco/jacoco.csv`, dòng:
  `Speed Delivery,com.speed.delivery.service.impl,AuditLogServiceImpl,0,103,0,0,0,31,0,6,0,6`
  -> instruction 103/103 (100%); branch 0/0 (lớp không có nhánh rẽ); line **31/31 (100%)**;
  complexity 6/6; method 6/6 (4 phương thức public + `mapResponse` + constructor).
- Thời gian theo Surefire: tổng 4 nested là 0.009 + 0.015 + 0.008 + 0.085 = **0.117 s**; container
  top-level ghi 0.137 s. Code review trước đó đo 0.144 s, nên có dao động cold/warm giữa các lần chạy;
  mốc 2.000 ms trong spec chỉ là quan sát, không phải tiêu chí pass/fail.
- Không có raw evidence nào được copy vào `bang_chung_so_lieu/` cho feature này; mọi số liệu trên lấy
  trực tiếp từ `target/surefire-reports/` và `target/site/jacoco/jacoco.csv`.

## 8. Known limitations

Deferred minor findings từ `specs/TEST-AUDIT/reviews/code-review-1.md`:

- `spec.md:65`: §3.2 ghi "không test trường `ipAddress`", trong khi FR-2/FR-3 và test
  (`test:123,149,199,225`) assert `Log.ipAddress` là null. Hành vi không sai, nhưng câu chữ spec tự
  mâu thuẫn; cần sửa thành "không kiểm thử việc set/ánh xạ, chỉ assert vẫn null". Owner: unassigned.
- `spec.md:92`: FR-7 nói dùng `ArgumentCaptor` cho mọi `save`, còn AC-7/§11.4 và code dùng
  `any(Log.class)` ở 4 test EX (`test:168,243`). Cần ghi rõ ngoại lệ này trong FR-7. Owner: unassigned.
- `spec.md:256`: mốc "dưới 2.000 ms" không gắn với AC nào và phụ thuộc máy/Surefire; đã ghi nhận là
  quan sát (0.117 s nested, 0.137 s container), không dùng làm gate. Owner: unassigned.

Giả định còn lại từ `spec.md` §12:

- `jacoco:check` chưa bao gồm `AuditLogServiceImpl`; coverage được xác nhận thủ công. Owner: unassigned.
- Overload `log(String, String)` không có caller trong `src/main` (xác nhận bằng tìm kiếm
  `auditLogService.log(`: 18 lời gọi, tất cả là bản 5 tham số); vẫn được giữ và kiểm thử như API public.
  Owner: unassigned.
- SUT không validate: chấp nhận `userId = null`, `details = null`; không test `action = null` vì cột
  DB là `NOT NULL` và thêm validation sẽ là thay đổi production. Owner: unassigned.
- `ipAddress` không được ánh xạ (DTO không có trường này); giữ nguyên thiết kế hiện tại. Owner: unassigned.
- Loại ngoại lệ đại diện lỗi DB là `DataAccessResourceFailureException` với message `Database is down`,
  nhất quán với `MockingDemoTest`; SUT không bọc ngoại lệ. Owner: unassigned.
- Không test `pageable = null` và `getUserLogs(null, ...)` vì SUT không validate và không có caller
  tương ứng. Owner: unassigned.
- Chính sách lỗi audit hiện tại là lan truyền lỗi; nếu muốn best-effort (lỗi audit không làm hỏng
  nghiệp vụ) thì phải sửa production code trong feature riêng. Owner: unassigned.

## 9. Rollback

Xoá đúng một file mới:
`speed-backend/src/test/java/com/speed/delivery/service/impl/AuditLogServiceImplTest.java`.
Không có thay đổi production, dữ liệu hay migration cần hoàn tác. Tại thời điểm bàn giao file còn
untracked; nếu đã được commit, revert commit của feature là đủ.

## 10. Follow-ups

- Thêm `*AuditLogServiceImpl` vào `<includes>` của `jacoco:check` trong một feature riêng, kèm chạy lại
  `mvn -q verify` để chứng minh gate tự động; không làm trong TEST-AUDIT vì spec cấm sửa `pom.xml`.
- Sửa 3 câu chữ spec ở phần Known limitations trong một lần cập nhật tài liệu riêng.
- Quyết định số phận overload `log(String, String)` (giữ làm API public hay bổ sung caller/xoá) ở feature
  riêng; hiện không có caller trong `src/main`.
- Nếu cần bảo vệ luồng admin end-to-end, viết integration test cho `GET /admin/logs` và
  `GET /admin/logs/user/{userId}`; việc này nằm ngoài phạm vi unit test của repo.
