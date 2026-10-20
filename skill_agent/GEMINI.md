# GEMINI.md - AI SDLC workflow contract (this repository)

This file is the delivery contract for every agent working in this repository: the controller
agent, every subagent it spawns, and any human reviewing the output. Read it before touching code.

A request never goes straight from "user asks" to "agent writes code and finishes". Work moves
through a fixed pipeline - spec, spec review, development, code review, handoff document, commit -
where every stage produces a written artifact, every artifact is checked by a different agent than
the one that produced it, and nothing is committed until the code review verdict is `APPROVE`.
The point is not ceremony: mistakes get caught while they are still cheap, and a later reader can
reconstruct what happened from the files alone.


## 1. This repository

Speed Delivery - thesis project "Research and application of Mocking in unit testing". Backend:
Java 21, Spring Boot 3.4.1 (WebMVC, Data JPA, Security, Validation), MySQL, Maven, JUnit 5,
Mockito, AssertJ, JaCoCo. Frontend: `speed-frontend` (React 19 + Vite + TypeScript + Redux Toolkit
+ TanStack Query); it is outside the unit-test experiment and has no test runner.

### Gates - run from `speed-backend/` before code review and before commit

```
mvn -q verify
```

`verify` runs the full JUnit 5 suite and JaCoCo, including the `jacoco:check` rule that requires
the 12 in-scope service classes to keep at least 90% line coverage. Single class:
`mvn -q -Dtest=<ClassName> test`. The bundled `mvnw.cmd` is broken in this checkout; use the
system Maven 3.9+ with JDK 21.

### Conventions and reuse inventory

Layering is strict: controller -> service interface -> service impl -> repository -> entity.

- controllers under `controller/`
- services under `service/` + `service/impl/`
- repositories under `repository/`
- entities under `entity/`, enums under `enums/`
- DTOs under `dto/request/` and `dto/response/` (Lombok builders)
- security under `security/`, cross-cutting wiring under `config/`
- domain exceptions and the handler under `exception/`

Reuse before creating anything new - a reviewer rejects duplicates of these:

- exceptions: `exception/` - `BadRequestException`, `ResourceNotFoundException`,
  `DuplicateResourceException`, `UnauthorizedException`, `VoucherExpiredException`,
  `PaymentFailedException`, `GlobalExceptionHandler`
- response envelope: `dto/response/ApiResponse`
- auth: `security/JwtTokenProvider`, `security/JwtAuthenticationFilter`,
  `security/CustomUserDetailsService`, `config/SecurityConfig`
- tests: JUnit 5 + `MockitoExtension` + BDDMockito + AssertJ already on the classpath; no new
  test library unless the spec allows it

### Testing contract (this repository)

The thesis experiment lives at the service layer only. Controllers, entities and repositories
are not unit-test targets here.

- A unit test is pure Mockito: `@ExtendWith(MockitoExtension.class)`, `@Mock`, `@InjectMocks`,
  BDDMockito and AssertJ. No `@SpringBootTest`, no database, no network, no filesystem.
- `src/test/java/com/speed/delivery/demo/` contains deliberate comparison experiments
  (`MockingDemoTest`, `SpringContextDemoTest`). They are exempt from the isolation rule but must
  not be copied into a normal test suite.
- Mock only Depended-On Components at the boundary: repositories, external services and
  infrastructure. Never mock the class under test, entities, DTOs, value objects or Lombok
  builders.
- Every suite covers three paths with stable test-case ids: happy path (HP), edge case (ED) and
  exception path (EX). Assert exception types and messages; assert fail-fast with
  `shouldHaveNoInteractions` / `never()` where the business rule forbids further calls.
- Mockito strict stubs stay enabled. No unnecessary stubbing, no `any()` when the value matters,
  use `ArgumentCaptor` when the payload is the point.
- One behaviour per test, fresh fixture in `@BeforeEach`, `@DisplayName` in Vietnamese matching
  the existing `TCxx` style.
- The target class keeps at least 90% line coverage (`jacoco:check`); a new suite must not lower
  the gate. Runtime and coverage numbers used in the thesis are recorded in the handoff document
  with the exact command that produced them.

## 2. Pipeline and skills

```
 human request
      |
      v
 [1] sdlc-spec-writer    --> specs/<feature-id>/spec.md
      |
      v
 [2] sdlc-spec-reviewer  --CHANGES_REQUESTED--> back to [1] (max 3 attempts)
      | APPROVE
      v
 [3] sdlc-developer      --> code + tests --> [gates must pass]
      |
      v
 [4] sdlc-code-reviewer  --CHANGES_REQUESTED--> back to [3] (max 3 review attempts)
      | APPROVE
      v
 [5] sdlc-handoff-doc    --> docs/handoff/<feature-id>.md
      |
      v
 [6] sdlc-committer      --> local commit, never push
      |
      v
 final report to the human
```

| Stage        | Skill                  | Runs as    | Write scope                    |
|--------------|------------------------|------------|--------------------------------|
| control      | `sdlc-orchestrator`     | controller | nothing                        |
| 1 write spec | `sdlc-spec-writer`      | subagent   | `specs/<id>/`                    |
| 2 review spec| `sdlc-spec-reviewer`    | subagent   | `specs/<id>/reviews/`            |
| 3 develop    | `sdlc-developer`        | subagent   | source + tests                 |
| 4 review code| `sdlc-code-reviewer`    | subagent   | `specs/<id>/reviews/`            |
| 5 handoff    | `sdlc-handoff-doc`      | subagent   | `docs/handoff/`                  |
| 6 commit     | `sdlc-committer`        | subagent   | git index only                 |

Skills live in `skill_agent/.agents/skills/<skill-name>/SKILL.md` inside this repository.
`opencode.json` loads `skill_agent/GEMINI.md` as instructions and that skills directory as the
skill path. The controller loads `sdlc-orchestrator`; every subagent loads the skill of its own
stage. Prompts handed to subagents are written in English.

## 3. Artifacts

- `specs/<feature-id>/spec.md` - the specification; source of truth for scope.
- `specs/<feature-id>/reviews/spec-review-<attempt>.md` - spec review verdicts and findings.
- `specs/<feature-id>/reviews/code-review-<attempt>.md` - code review verdicts and findings.
- `docs/handoff/<feature-id>.md` - handoff document, written after code review passes.
- Branch: `feature/<feature-id>` from `main` (this repository has no `dev` branch; do not create
  one for a feature).

Feature ids for this thesis: `TEST-<Module>` for one unit-test suite (for example `TEST-AUDIT`)
and `EXP-<name>` for a controlled experiment (for example `EXP-MOCK-VS-NOMOCK`). Without a
tracker use `FEAT-<slug>`.
Review reports are kept forever - they are the decision trail. Revise a spec in place, but never
delete or rewrite a review report.

## 4. Subagent report contract

Every subagent ends its reply with exactly one `REPORT` block. The controller parses it and decides
the next step; prose above the block is for humans.

```
REPORT
feature_id: TEST-AUDIT
stage: spec-writer | spec-reviewer | developer | code-reviewer | handoff-doc | committer
attempt: 1
verdict: DONE | BLOCKED | APPROVE | CHANGES_REQUESTED
summary: <= 5 lines
findings:
- [blocker] path:line - problem - fix: required change
evidence:
- command -> result
open_questions:
- only when something genuinely needs a human decision
changed_files: (optional)
- path
ac_coverage: (optional)
- AC-1 -> path:line -> test: path:line
```

Verdict vocabulary: producer stages (spec-writer, developer, handoff-doc, committer) report
`DONE` or `BLOCKED`. Review stages report `APPROVE` or `CHANGES_REQUESTED`. `BLOCKED` means the
stage cannot proceed without a human decision - never a way to hide a solvable problem.

Severity, used identically by both reviewers:

- `blocker` - wrong behaviour against the spec, security or data-loss risk, a failing gate, a
  missing acceptance criterion. Must be fixed.
- `major` - real duplication (DRY), missing or meaningless tests, unhandled error or empty states,
  misleading naming, dead code, a convention violation that will confuse the next reader. Must be
  fixed before `APPROVE`.
- `minor` - style, micro-optimisation, cosmetic consistency. May be deferred, and every deferred
  item must appear under "Known limitations" in the handoff document.
- `note` - information only.

Verdict rule, mechanical: any `blocker` or `major` => `CHANGES_REQUESTED`; only `minor` and `note`
=> `APPROVE`.

## 5. Loops, budgets, stop conditions

- Spec writing: at most 3 attempts (1 initial + 2 revisions).
- Development: at most 3 code-review attempts (1 initial + 2 fix rounds).
- Review findings are fed back verbatim to the producing stage, with the review report path.
- On budget exhaustion the controller stops, runs no later stage, never commits, and reports the
  full attempt history plus unresolved findings to the human.
- The code reviewer is always a different subagent from the developer and is read-only.
- The controller never edits code to make a stage pass.

## 6. Hard rules

- Never commit: `.env*`, secrets, tokens, `node_modules/`, `target/`, `speed-frontend/dist/`,
  `*.tsbuildinfo`, editor and OS junk, verification scratch directories.
- Logs are not committed. The thesis evidence under `bang_chung_so_lieu/` may be committed only
  in an explicit evidence/docs commit, never inside a feature commit.
- Never widen scope "while we are here". An unrelated refactor is its own feature.
- Spec and handoff documents are written in the language the human used for the request.
- Commit is local. Pushing, merging and opening pull requests require an explicit human order.

## 7. How to trigger

The human states the feature id and the request, for example:

```
Chạy SDLC cho TEST-AUDIT: bổ sung unit test cho AuditLogServiceImpl.
```

The controller agent then loads `sdlc-orchestrator` and runs the pipeline from stage 1.
