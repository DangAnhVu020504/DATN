# Spec review - TEST-AUDIT - attempt 1

Verdict: APPROVE

Checks performed:
- Read `skill_agent/GEMINI.md`, `skill_agent/.agents/skills/sdlc-spec-reviewer/SKILL.md` and `specs/TEST-AUDIT/spec.md` completely.
- Verified the SUT and contract: `AuditLogServiceImpl` has exactly the 4 public methods named in the spec, one constructor dependency (`LogRepository`, Lombok `@RequiredArgsConstructor`), no validation and no try/catch; `AuditLogService`, `LogRepository`, `Log` and `LogResponse` match the spec's field/method claims.
- Verified callers: exactly 6 services call `auditLogService.log(...)` (`AuthServiceImpl`, `AdminServiceImpl`, `OrderServiceImpl`, `CustomerServiceImpl`, `DriverServiceImpl`, `ReviewServiceImpl`); `AdminServiceImpl` passes `null` as `userId` on lines 87 and 97; the 2-argument overload has no caller in `src/main`; `AdminController` exposes `GET /admin/logs` and `GET /admin/logs/user/{userId}`.
- Verified `Log` nullability: `action` is `nullable = false`; `user_id`, `entity_type`, `entity_id`, `details` and `ip_address` are nullable; `@PrePersist` sets `createdAt` only when JPA is active, so the spec's unit-test fixture decision is correct.
- Verified `pom.xml`: `jacoco:check` runs at `verify`, uses `CLASS` + `LINE` `COVEREDRATIO` `0.90`, and its `<includes>` list contains 12 classes. `AuditLogServiceImpl` is absent, exactly as the spec states; the `report` goal is bound to `test`, so the stated report path is correct.
- Read `NotificationServiceImplTest` and `WalletServiceImplTest`: the spec's reuse claims (BDDMockito, `ArgumentCaptor`, `PageImpl`, `Nested`, `shouldHaveNoInteractions`, `times(1)`/`never()`) match the existing conventions.
- Read `MockingDemoTest`: `org.springframework.dao.DataAccessResourceFailureException` is already used with the exact message `Database is down`, so the exception choice is available and consistent.
- Checked that no `AuditLogServiceImplTest` currently exists (glob over `speed-backend/src/test/java`).
- Checked every FR -> AC mapping, every AC -> FR reference, HP/ED/EX coverage of all 4 public methods, Page/PageImpl metadata math, nullability assertions, mocked-vs-real seams, strict-stub/fail-fast expectations, out-of-scope boundary, and internal contradictions.
- Static review only; no Maven build was run and no code/test file was modified.

Findings:
- [minor] spec.md:65 - §3.2 says "không test trường `ipAddress`", but FR-2 (spec.md:76-77), FR-3 (spec.md:79-80) and AL-TC01/AL-TC04 (spec.md:298, 301) require asserting that `Log.ipAddress` is `null`; the two instructions contradict. - fix: reword §3.2 to "không test việc set/ánh xạ `ipAddress`; chỉ assert nó vẫn `null` như FR-2/FR-3", or remove the `ipAddress` clause from out-of-scope.
- [minor] spec.md:125 - AC-7 requires every read test to verify "finder còn lại `never()`", but the matrix rows for AL-TC08 (spec.md:305), AL-TC11 (spec.md:308) and AL-TC13 (spec.md:310) omit that verification. `shouldHaveNoMoreInteractions()` covers the same behavior, but the spec is internally inconsistent. - fix: add the missing `never()` entries to those three rows, or scope AC-7's wording to the rows that explicitly verify cross-calls.
- [minor] spec.md:92 - FR-7 says to use `ArgumentCaptor<Log>` for `save`, while §11.4 (spec.md:316-318) and AC-7 (spec.md:125) use `any(Log.class)` in the four EX tests. - fix: state the EX exception explicitly in FR-7 (captor for HP/ED; `any(Log.class)` for EX to prove the attempted save).
- [minor] spec.md:256 - The hard "under 2,000 ms" runtime requirement is not tied to any AC and depends on machine/Surefire overhead; §3.2 says not to benchmark and only to record Surefire time. - fix: record it as an observation/expectation in the handoff, or add a tolerance/AC; do not use it as a pass/fail criterion.
- [minor] spec.md:128 - AC-8 and §11.5 (spec.md:341-342) expect `mvn -q ...` to print `Tests run: 13...`; `-q` may suppress the Surefire console summary. - fix: verify the count from `target/surefire-reports/com.speed.delivery.service.impl.AuditLogServiceImplTest.txt` (or run that check without `-q`).
- [note] spec.md:344 - The 90% target is not enforced by `jacoco:check` for this class: `pom.xml:192-205` lists 12 includes and no `AuditLogServiceImpl`. The spec already discloses this and requires manual JaCoCo evidence; the follow-up feature in §12.1 is the right place to add `*AuditLogServiceImpl` to the gate.
- [note] spec.md:258 - The "no Spring context / no H2" rule applies to the new test class; `mvn -q verify` still runs the pre-existing `SpringContextDemoTest` (Spring context + H2). Clarify this so a reader does not read §10 as a claim about the whole verify command.
- [note] spec.md:304 - `any(), any()` inside `never()` checks (e.g. AL-TC07) is acceptable: the point is absence, not a value match, so it does not violate FR-7's "no `any()` when the value matters".

Open questions for the human:
- None. Assumption recorded: `AuditLogServiceImpl` stays outside `jacoco:check` for TEST-AUDIT; coverage is verified manually from the JaCoCo report, and adding it to the gate is the follow-up feature described in §12.1.
