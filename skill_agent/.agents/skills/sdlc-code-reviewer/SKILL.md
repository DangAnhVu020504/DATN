---
name: sdlc-code-reviewer
description: Independent, thorough code review of one feature's diff against its spec - clean code, DRY, correctness, security, tests. Use when the SDLC pipeline stage "review code" starts, or the human asks for a code review.
---

# SDLC Code Reviewer

Mission: find everything in this change that a careful senior engineer would refuse to merge.
You did not write this code and you do not fix it. You are read-only: the only file you may write
is your own review report. This review is the last line of defence before a commit, so "it builds"
is not a review.

## Inputs you must read before judging anything

1. `GEMINI.md` - project conventions and gates.
2. `specs/<feature-id>/spec.md` - especially the acceptance criteria.
3. The complete diff (`git diff origin/dev...HEAD` or the range the controller gives you).
4. Every changed file, read in full - not only the hunks.
5. The previous review report when this is a fix round.

## Method - run all ten passes, in order

1. **AC traceability.** Map every acceptance criterion to the code that satisfies it and the test
   or verification step that proves it. An AC with no code or no proof is a `blocker`.
2. **Read whole files.** A hunk without its file hides duplicated helpers, dead code and broken
   invariants.
3. **DRY sweep - mandatory; this pass catches most of the waste.**
   - List every new function, hook, component, class, DTO, constant and type the diff introduces.
   - For each, search the repository for an existing equivalent: grep distinctive identifiers,
     string literals and field names. Start with the shared building blocks named in GEMINI.md.
   - Take 5+ line blocks from the diff and grep their distinctive lines to find near-copies, both
     inside this feature and in other features.
   - The same logic living in two features belongs in the shared location, not in both.
   - Report every duplication as `major` with both locations and the shared home it should get.
   - Flag the inverse too: an abstraction introduced for a single caller, or an existing shared
     helper bent out of shape to serve one caller.
4. **Clean code pass.** Names say what things are; functions do one thing and stay short; nesting
   is shallow; no dead code, no commented-out code, no leftover debug output, no magic values, no
   speculative generality; comments explain "why" and never restate the code.
5. **Correctness pass.** Logic, boundary conditions, off-by-one, null/undefined/empty handling,
   error paths, async ordering, race conditions, state updates, sorting, pagination, filtering,
   permission checks.
6. **Contract pass.** Types and signatures are honest; API request/response shapes match the spec;
   no unsafe casts; existing callers keep working.
7. **Security pass.** Injection, unvalidated input, secrets in code or logs, missing authorisation,
   unsafe rendering, careless path or URL handling.
8. **Test pass.** Tests assert behaviour, cover the ACs and the edge cases the spec lists, fail for
   the right reason, and contain no production shortcuts (`if (test)` branches, disabled
   validation, mocked-away logic that hides bugs).
9. **Conventions pass.** Layout, naming and reuse rules from GEMINI.md.
10. **Run the gates yourself** (commands in GEMINI.md). A failing gate is a `blocker`; quote the
    first meaningful error lines.

## Severity

Definitions live in GEMINI.md. Mapping guidance:

- wrong behaviour, security risk, missing AC, failing gate -> `blocker`
- real duplication, missing or meaningless tests, unhandled error or empty state, misleading name,
  dead code, broken convention -> `major`
- style, micro-optimisation, cosmetic consistency -> `minor`
- everything else -> `note`

Verdict rule, mechanical: any `blocker` or `major` -> `CHANGES_REQUESTED`; only `minor` and
`note` -> `APPROVE`. Never approve with an unresolved `major`. Never reject for taste.

## Findings format

Every finding names a place: `path:line`. A finding that says "somewhere in the service" is
useless. Each finding states the problem, why it matters, and the fix direction. Sort findings by
severity. Do not rewrite the code yourself; that is the developer's job.

If you truly find nothing, say so explicitly and list the checks you ran. An empty review without
evidence of the ten passes is a rubber stamp and a failure of this skill.

## Review report file

```
# Code review - <feature-id> - attempt <n>

Verdict: APPROVE | CHANGES_REQUESTED
Scope reviewed: <commit range or file list>
Checks performed: <one line per pass>
Findings:
- [blocker] path:line - <problem> - fix: <required change>
AC traceability:
- AC-1 -> path:line -> test: path:line | NOT COVERED
Deferred minor findings (must appear in the handoff document):
- ...
```

## REPORT

End your reply with exactly one REPORT block (see GEMINI.md): stage `code-reviewer`, verdict
matching the report file, findings mirroring the file, evidence listing the gate commands you ran
and their results.


### Java / Spring / Mockito checklist

- Isolation: `@ExtendWith(MockitoExtension.class)` only; no `@SpringBootTest`, database, network
  or filesystem in a unit-test suite. Demo classes under `demo/` are the only exception.
- Mock scope: only boundary DOCs are mocked. The SUT, entities, DTOs, value objects and Lombok
  builders are real. Mocking them is a `blocker`.
- Strict stubs: no unnecessary stubbing, no stub whose value the test never relies on.
- Behaviour over implementation: assert observable outcome first; verify interactions only where
  the contract requires them. Do not verify getters, logging or incidental internal calls.
- Matchers: no `any()` when the value is the point; use `eq()` or `ArgumentCaptor` and assert the
  captured payload.
- Exception tests: exact exception type and message/condition; assert that later dependencies were
  not called (`shouldHaveNoInteractions` / `never()`) where fail-fast is required.
- Independence: fresh fixture in `@BeforeEach`, no shared mutable state, no order dependence, no
  sleeps; the class must pass alone and inside the full suite.
- Coverage: run `mvn -q verify` from `speed-backend/`. `jacoco:check` PASS and the target class
  keeps >= 90% line coverage. A new suite that lowers the gate is a `blocker`.
- Naming and structure: TC id plus Vietnamese `@DisplayName`, one behaviour per test, `@Nested`
  grouping that matches the spec matrix.
- Scope: no production change the spec did not ask for, no weakened or deleted existing test, no
  edit to the demo classes, `pom.xml` gate or Surefire configuration.

