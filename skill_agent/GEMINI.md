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

Backend of the restaurant management system: Java 21, Spring Boot 4.1 (WebMVC, Data JPA, Security,
Validation, Actuator), MySQL, Maven. The sibling frontend repository is
`tip_dc13_fe_restaurantmanagement` (Next.js): an API contract change needs a matching spec entry
there and here.

### Gates - run in this repository before code review and before commit

```
mvn -q verify
```

`verify` runs the test suite; new behaviour needs a test at service level as a minimum.

### Conventions and reuse inventory

Layering is strict: controller -> service interface -> service impl -> repository -> entity.
DTOs under `dto/<domain>/`, mappers under `mapper/<Domain>Mapper`, entities under `entities/`,
repositories under `repository/`, services under `services/` + `services/impl/`, cross-cutting
code under `common/`, wiring under `config/`.

Reuse before creating anything new - a reviewer rejects duplicates of these:

- error handling: `common/exception/` - AppException, ErrorCode, GlobalExceptionHandler
- response envelopes: `common/response/` - SuccessResponse, ErrorResponse, ValidationErrorResponse
- search / filter / sort: `common/specification/` - SearchRequest, FilterCriteria, FilterOperation,
  GenericSpecification, GenericSortBuilder, SortCriteria
- helpers: `common/util/StringUtil`
- auth: `config/` - JwtService, JwtAuthenticationFilter, SecurityConfig
- infrastructure: `config/SwaggerConfig`, `config/EnvironmentValidationConfig`, `DataInitializer`

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

Skills live in `.agents/skills/<skill-name>/SKILL.md` inside this repository. The controller loads
`sdlc-orchestrator`; every subagent loads the skill of its own stage. Prompts handed to subagents
are written in English.

## 3. Artifacts

- `specs/<feature-id>/spec.md` - the specification; source of truth for scope.
- `specs/<feature-id>/reviews/spec-review-<attempt>.md` - spec review verdicts and findings.
- `specs/<feature-id>/reviews/code-review-<attempt>.md` - code review verdicts and findings.
- `docs/handoff/<feature-id>.md` - handoff document, written after code review passes.
- Branch: `feature/<feature-id>` from `origin/dev` (never the local `dev`, which can be stale).

Feature id is the tracker id in upper case, e.g. `RM-88`; without a tracker use `FEAT-<slug>`.
Review reports are kept forever - they are the decision trail. Revise a spec in place, but never
delete or rewrite a review report.

## 4. Subagent report contract

Every subagent ends its reply with exactly one `REPORT` block. The controller parses it and decides
the next step; prose above the block is for humans.

```
REPORT
feature_id: RM-88
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

- Never commit: `.env*`, secrets, tokens, dependency folders, build output, `*.tsbuildinfo`, logs,
  editor and OS junk, verification scratch directories.
- Never widen scope "while we are here". An unrelated refactor is its own feature.
- Spec and handoff documents are written in the language the human used for the request.
- Commit is local. Pushing, merging and opening pull requests require an explicit human order.

## 7. How to trigger

The human states the feature id and the request, for example:

```
Chạy SDLC cho RM-88: cho phép gộp bàn khi khách yêu cầu.
```

The controller agent then loads `sdlc-orchestrator` and runs the pipeline from stage 1.
