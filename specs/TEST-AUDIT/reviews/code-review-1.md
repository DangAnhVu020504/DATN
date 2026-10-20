# Code review - TEST-AUDIT - attempt 1

Verdict: APPROVE

Scope reviewed:
- New untracked test file, read in full (460 lines, 13 tests):
  `speed-backend/src/test/java/com/speed/delivery/service/impl/AuditLogServiceImplTest.java`.
- New artifacts: `specs/TEST-AUDIT/spec.md`, `specs/TEST-AUDIT/reviews/spec-review-1.md`.
- Branch `feature/TEST-AUDIT`; `git status --short` shows only the untracked test file and `specs/`.
  No tracked file, production class, `pom.xml`, demo test or existing test was modified.
- Production and reference files read in full: `AuditLogServiceImpl`, `AuditLogService`,
  `LogRepository`, `Log`, `LogResponse`, `NotificationServiceImplTest`, `WalletServiceImplTest`,
  `pom.xml` (JaCoCo `check` includes).

Checks performed:
1. AC traceability: mapped AC-1..AC-10 to SUT lines and test lines; no AC is unproven.
2. Whole files: read the test, SUT, interface, repository, entity, DTO, pom and two reference suites in full.
3. DRY sweep: no existing test covers this SUT; no helper/class/DTO is duplicated. The 7-field mapping assertions in AL-TC07 (test:264-287) and AL-TC10 (test:385-408) are intentionally repeated to keep each test self-contained (DAMP) and are mandated per test by AC-4/AC-5; no shared helper is warranted. No new abstraction for a single caller.
4. Clean code: package-private class, descriptive method names, 4 `@Nested` classes, Arrange/Act/Assert comments explain intent; no dead code, debug output, disabled tests or random data. Fixed timestamps `T1`/`T2` and `DB_ERROR_MESSAGE` constant replace magic values.
5. Correctness: assertions would catch wrong field mapping, swapped `userId`/`entityId`/`action`/`details`, double `save`, wrong finder, wrong `pageable`/`userId`, and swallowed/wrapped exceptions. `PageImpl` metadata math (`total=2`, size 10 -> `totalPages=1`; `total=0` -> `totalPages=0`) matches the assertions and the green run.
6. Contract: only `LogRepository` is mocked (test:46). `Log`, `LogResponse`, `Page`/`PageImpl`, `PageRequest`/`Pageable` and the SUT are real. No SUT/entity/DTO/value-object mocking. Method contracts match `AuditLogService`.
7. Security: test-only change; no secrets, credentials, network, database, filesystem or `System.out`.
8. Test pass: strict stubs only; no `lenient()`, no unused stub. EX tests assert exact `DataAccessResourceFailureException` type and message `Database is down`; `times(1)` proves the attempted call; `shouldHaveNoMoreInteractions()` proves fail-fast. HP/ED `log` tests use `ArgumentCaptor<Log>`; EX intentionally uses `any(Log.class)` per AC-7/§11.4.
9. Conventions: `com.speed.delivery.service.impl`, `@ExtendWith(MockitoExtension.class)`, one `@Mock`, one `@InjectMocks`, 4 `@Nested`, Vietnamese `@DisplayName` with stable `AL-TC01`..`AL-TC13`, fresh fixture in `@BeforeEach`, one behaviour per test, no order dependence.
10. Gates: targeted test and full verify both pass; Surefire nested reports aggregate 13 tests with 0 failures/errors/skips; JaCoCo reports 31/31 covered lines (100%) for `AuditLogServiceImpl`.

Spec-review minor findings (stage-2 carry-over):
- `spec.md:65` ipAddress: implementation asserts `Log.ipAddress` is `null` in AL-TC01/02/04/05 (test:123,149,199,225), satisfying FR-2/FR-3 without testing that the SUT sets/maps it. No AC weakened; the §3.2 wording is still contradictory and is recorded as a deferred minor.
- `spec.md:125` other-finder `never()`: implemented in every read test (test:291,315,334,363,412,436,455). Resolved.
- `spec.md:92` captor vs `any` in EX: implemented as AC-7/§11.4 require (test:168,243 use `any(Log.class)`); HP/ED use the captor. No AC weakened; the FR-7 wording remains ambiguous and is recorded as a deferred minor.
- `spec.md:256` runtime observation: no timing assertion in code; Surefire nested-suite time is 0.144 s (container 0.159 s), under the 2,000 ms observation. Resolved as an observation, not a gate.
- `spec.md:128` test-count evidence: the top-level Surefire report shows `Tests run: 0` because all tests live in `@Nested` classes; the four nested reports aggregate to 13/0/0/0. Resolved by aggregation; handoff must state this explicitly.

Findings:
- [minor] `specs/TEST-AUDIT/spec.md:65` - §3.2 still says "không test trường `ipAddress`", while FR-2/FR-3 require asserting it is `null`; the implementation correctly follows FR-2/FR-3 (test:123,149,199,225), so behaviour is not weakened, but the spec text is self-contradictory. - fix: reword §3.2 to "không kiểm thử việc set/ánh xạ `ipAddress`; chỉ assert nó vẫn `null` như FR-2/FR-3" in a follow-up spec edit.
- [minor] `specs/TEST-AUDIT/spec.md:92` - FR-7 says to use `ArgumentCaptor<Log>` for every `save`, while AC-7/§11.4 and the implementation use `any(Log.class)` in the four EX tests to prove the attempted save (test:168,243). - fix: state the EX exception explicitly in FR-7: captor for HP/ED, `any(Log.class)` for EX.
- [minor] `specs/TEST-AUDIT/spec.md:256` - the hard "under 2,000 ms" performance line is not tied to any AC and depends on the machine/Surefire overhead; the implementation correctly asserts no timing and the observed nested-suite time is 0.144 s. - fix: record it as an observation in the handoff (with the command) instead of a pass/fail criterion.

AC traceability:
- AC-1 -> `AuditLogServiceImpl.java:20-59` (SUT) -> test: `AuditLogServiceImplTest.java:41` (`@ExtendWith(MockitoExtension.class)`), `:46` (`@Mock LogRepository`), `:49` (`@InjectMocks AuditLogServiceImpl`); static scan found no `@SpringBootTest`, `@DataJpaTest`, JDBC/socket/network or filesystem use.
- AC-2 -> `AuditLogServiceImpl.java:25-35` -> tests: `AuditLogServiceImplTest.java:102-170` (AL-TC01 104, AL-TC02 130, AL-TC03 156); assertions 116-123, 142-149, 164-165.
- AC-3 -> `AuditLogServiceImpl.java:38-45` -> tests: `AuditLogServiceImplTest.java:178-245` (AL-TC04 180, AL-TC05 206, AL-TC06 232); assertions 192-199, 218-225, 239-240.
- AC-4 -> `AuditLogServiceImpl.java:49-52` -> tests: `AuditLogServiceImplTest.java:253-366` (AL-TC07 255, AL-TC08 298, AL-TC09 322, AL-TC13 341); assertions 264-287, 307-311, 329-330, 350-359.
- AC-5 -> `AuditLogServiceImpl.java:56-59` -> tests: `AuditLogServiceImplTest.java:374-458` (AL-TC10 376, AL-TC11 419, AL-TC12 443); assertions 385-408, 428-432, 450-451.
- AC-6 -> `AuditLogServiceImpl.java:33,43,50,57` -> tests: `AuditLogServiceImplTest.java:164-165` (AL-TC03), `:239-240` (AL-TC06), `:329-330` (AL-TC09), `:450-451` (AL-TC12); exact type and message `Database is down`.
- AC-7 -> `AuditLogServiceImpl.java:33,43,50-51,57-58` -> tests: captors at `:106/112`, `:132/138`, `:182/188`, `:208/214`; read verifications at `:290-293`, `:314-317`, `:333-336`, `:362-365`, `:411-414`, `:435-438`, `:454-457`; all 13 tests end with `shouldHaveNoMoreInteractions()`.
- AC-8 -> tests: 13 `@DisplayName` lines `:103,129,155,179,205,231,254,297,321,340,375,418,442`; Surefire nested reports aggregate tests=13, failures=0, errors=0, skipped=0.
- AC-9 -> `mvn -q verify` exit 0; JaCoCo `AuditLogServiceImpl` LINE_COVERED=31, LINE_MISSED=0 (100%), INSTRUCTION_COVERED=103, INSTRUCTION_MISSED=0; handoff recording is stage 5's obligation.
- AC-10 -> tests: fixed static `T1`/`T2` at `:52-53`, fixture at `:61-95`; scan found no `Thread.sleep`, `LocalDateTime.now()`, `System.out`, `@SpringBootTest`, `@DataJpaTest`, JDBC, socket or file I/O; two consecutive runs (targeted then full verify) were green.

Deferred minor findings (must appear in the handoff document):
- `specs/TEST-AUDIT/spec.md:65` - reword the §3.2 `ipAddress` clause to match FR-2/FR-3 (asserting `null` is in scope; setting/mapping is not).
- `specs/TEST-AUDIT/spec.md:92` - state in FR-7 that EX tests use `any(Log.class)` for the attempted `save`, while HP/ED use `ArgumentCaptor`.
- `specs/TEST-AUDIT/spec.md:256` - record the 2,000 ms runtime as an observation from Surefire, not as a pass/fail criterion.

No blocker or major findings. The verdict is APPROVE.
