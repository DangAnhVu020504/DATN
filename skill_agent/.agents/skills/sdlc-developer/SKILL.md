---
name: sdlc-developer
description: Implement one approved feature spec as code plus verification in this repository. Use when the SDLC pipeline stage "develop" starts, or the human asks to implement a feature from an approved spec.
---

# SDLC Developer

Mission: implement exactly what `specs/<feature-id>/spec.md` promises - every acceptance criterion,
nothing beyond scope - following the conventions in `GEMINI.md`.

## Steps

1. Read `GEMINI.md`, the spec, and the review findings you were handed (if any).
2. Explore the existing code the spec tells you to reuse. Read it before writing anything that
   could duplicate it.
3. Plan the change file by file. Keep the plan in your notes; do not create planning files.
4. Implement - the smallest change that satisfies every AC.
5. Add or update tests and verification exactly as the spec's test plan requires.
6. Run the project gates and fix failures before reporting.
7. Self-review your own diff with the checklist below.
8. Report with `changed_files` and `ac_coverage`.

## Rules

- Scope: only the files this feature needs. Unrelated refactors, formatting churn and
  "while we are here" changes are review findings, not goodwill.
- Reuse before create. A new helper next to an existing one that does the same job is a DRY
  violation the reviewer will find and reject.
- Follow the project's layout and naming exactly (see GEMINI.md).
- Keep the code simple: small functions, honest names, no dead code, no commented-out code, no
  speculative abstraction, no framework or dependency the spec did not allow.
- Comments only where the "why" is non-obvious. Never narrate what the code already says.
- Never touch `specs/`, `docs/`, review reports or `.env` files.
- Never commit; committing is a separate stage with its own skill.

## Self-review checklist before reporting

- Every AC implemented and covered by the spec's verification plan.
- Error, loading, empty and permission states handled wherever the UI or API needs them.
- No new duplication of existing logic (search before you claim this).
- No new dependency unless the spec allows it; if unavoidable, say so in the REPORT.
- Gates pass, with the output kept short and factual.
- Diff contains nothing unrelated.


## Java 21 / Spring Boot / Mockito specifics (this repository)

- Production code lives under `speed-backend/src/main/java/com/speed/delivery/`; tests mirror the
  package under `speed-backend/src/test/java/com/speed/delivery/service/impl/`.
- Constructor injection only (`@RequiredArgsConstructor`); do not introduce field injection.
- Tests: `@ExtendWith(MockitoExtension.class)`, `@Mock` for boundary dependencies, `@InjectMocks`
  for the SUT, BDDMockito `given/willReturn/willThrow` and `then/should`.
- Build fixtures with Lombok builders; never mock entities, DTOs, value objects or the SUT.
- Fresh fixture in `@BeforeEach`; group related cases with `@Nested`; `@DisplayName` in Vietnamese
  with a stable TC id (for example `TC01 - ...`).
- Assert exceptions with AssertJ `assertThatThrownBy`; assert the message when the spec names it.
- Run gates from `speed-backend/`: `mvn -q verify`; single class
  `mvn -q -Dtest=<ClassName> test`.
- Do not edit `src/test/java/com/speed/delivery/demo/`, the JaCoCo includes, or the Surefire
  config unless the spec explicitly says so.

## REPORT

End your reply with exactly one REPORT block (see GEMINI.md): stage `developer`, verdict `DONE` or
`BLOCKED`, `changed_files` listing every touched path, `ac_coverage` mapping each AC to the code
and verification that satisfies it, `evidence` with the gate commands and their results.
