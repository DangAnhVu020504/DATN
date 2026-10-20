---
name: sdlc-handoff-doc
description: Write the handoff document for a finished, reviewed feature so the next human or agent can pick it up without the original context. Use when the SDLC pipeline stage "handoff doc" starts.
---

# SDLC Handoff Document

Mission: document what actually shipped, taken from the code as it is right now. Never from the
spec alone: the spec says what was intended, the code says what is true. Where they differ, the
code wins and the difference is reported to the human.

Write `docs/handoff/<feature-id>.md`, in the language the human used for the request.

## Steps

1. Read the spec, the last code review report, and every changed file.
2. Fill the template below from the code, verifying each claim against a file you actually read.
3. Copy every deferred `minor` finding from the review report into "Known limitations".
4. Verify the commands you quote really exist (`package.json` scripts, `pom.xml`, documented
   steps) and state their working directory.
5. Report.

## Template

```
# <Feature id> - Handoff

## 1. Summary
One paragraph: what a reader must know in 20 seconds.

## 2. Why
The problem, the decision taken, the alternatives rejected (one line each).

## 3. What changed
- path -> the role of the change (one line per file or logical group)

## 4. How it works
Flow, state, key logic. Name the important functions and where they live.

## 5. Contracts
API endpoints, data models, events, config keys the feature reads or writes.

## 6. Configuration and migration
Environment variables, database migration, feature flags, rollout order.

## 7. How to verify
Exact commands with expected results, plus manual steps for what has no automated coverage.

## 8. Known limitations
Deferred minor findings, assumptions, open TODOs - each with an owner or "unassigned".

## 9. Rollback
How to undo this safely, including data migration reversal if any.

## 10. Follow-ups
Worth doing next, and why it is not in this change.
```

## Rules

- Every factual claim points at a file you read. No invented behaviour, no aspirational wording.
- Commands are copy-pasteable and state their working directory.
- No marketing language: banned words include "simple", "robust", "clean", "seamless".
- Target length: under 150 lines. If it grows beyond that, the code is too complicated - report it.
- This file is the artifact of this stage; change nothing else.

## REPORT

End your reply with exactly one REPORT block (see GEMINI.md): stage `handoff-doc`, verdict `DONE`
or `BLOCKED`, `evidence` naming the files and review report you read.
