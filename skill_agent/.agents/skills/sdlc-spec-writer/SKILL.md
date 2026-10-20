---
name: sdlc-spec-writer
description: Write the implementation specification for one feature before any code exists. Use when the SDLC pipeline stage "write spec" starts, or the human asks for a spec or requirement analysis for a feature.
---

# SDLC Spec Writer

Mission: turn a human request into a spec precise enough that a developer agent can implement it
without guessing and a reviewer agent can verify it objectively. The spec is the source of truth
for scope: anything not covered by it is out of scope.

Read `GEMINI.md` first for project conventions and existing building blocks.

## Steps

1. Understand the request: feature id, goal, users, constraints. If something is ambiguous, do not
   stall - write the smallest reasonable interpretation and record the question.
2. Explore the codebase before writing: existing features, components, services, patterns that the
   new work must reuse or extend. A spec that ignores the current architecture gets rejected.
3. Draw the scope boundary: what is in, what is explicitly out.
4. Write `specs/<feature-id>/spec.md` with the template below.
5. Self-check against the quality rules, then report.

## Spec template

```
# <Feature id> - <title>

## 1. Problem and goal
## 2. Users and use cases
## 3. Scope
### 3.1 In scope
### 3.2 Out of scope
## 4. Functional requirements
FR-1 ...
## 5. Acceptance criteria
AC-1 (FR-1) ...
## 6. Data and API contract
## 7. UI/UX behaviour (if applicable)
## 8. Edge cases and error handling
## 9. Reuse plan
## 10. Non-functional requirements
## 11. Test and verification plan
## 12. Open questions and assumptions
```

## Quality rules - the spec reviewer checks exactly these

- Every FR has at least one AC, and every AC names the FR it proves. No orphan AC.
- ACs are objectively verifiable. Ban vague words: "fast", "smooth", "user-friendly", "as needed".
- Contracts are explicit wherever the feature touches them: endpoint shapes, fields, error codes,
  state transitions. Pure implementation choices stay with the developer.
- Reuse first: name the existing building block and its path whenever one fits. Planning a second
  copy of an existing component or service is a finding at review.
- Edge cases are listed: empty, loading, error, permission denied, invalid input, concurrent
  update, partial failure - whichever actually apply.
- Out of scope is explicit. Silence is not a boundary.
- Written in the language the human used for the request, in Markdown.
- As short as the content allows: no filler, no restating the request, no marketing words.

## Test-design specs (this repository)

A thesis feature is usually a unit-test suite, not a product endpoint. A spec for `TEST-<Module>`
must additionally state:

- SUT: class, public methods, path, and why the layer is in scope.
- Dependency/seam table: every constructor dependency, its type and a `mock` | `real` decision.
  Mock only repositories, external services and infrastructure. Never mock the SUT, entities,
  DTOs, value objects or Lombok builders.
- Test-case matrix: one row per TC with id, path `HP` | `ED` | `EX`, arrangement (mocked
  return/throw), action, expected result and interaction verification. At least one HP, one ED
  and one EX per public method unless the spec justifies the exception.
- Exact exception type and message/condition for every EX case.
- Fail-fast expectations (`shouldHaveNoInteractions` / `never()`) wherever the business rule
  forbids downstream calls after a failure.
- Coverage target for the SUT (>= 90% line, enforced by `jacoco:check`) and the command that
  measures it.
- Out of scope: no `@SpringBootTest`, no database, network or filesystem, no controller, entity
  or repository tests, and no production refactor unless a test proves a bug that the spec lists.

An `EXP-<name>` spec states the hypothesis, baseline and variant, fixed environment, the exact
metric and threshold, and where the raw evidence will be stored. It must be reproducible by one
command.

## Output

Write the file, then end with one REPORT block: stage `spec-writer`, verdict `DONE` or `BLOCKED`,
and under `evidence` the files you read to ground the spec in reality. Unresolved decisions go in
`open_questions`.
