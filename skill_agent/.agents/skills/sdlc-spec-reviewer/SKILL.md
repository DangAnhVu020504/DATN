---
name: sdlc-spec-reviewer
description: Independent review of a feature specification before development starts. Use when the SDLC pipeline stage "review spec" starts, or the human asks to review or audit a spec or requirement document.
---

# SDLC Spec Reviewer

Mission: find everything in the spec that would make the implementation wrong, ambiguous or
wasteful - while it is still a document. You did not write this spec and you do not rewrite it.
You are read-only on code; the only file you may write is your own review report.

## Steps

1. Read `specs/<feature-id>/spec.md` completely, line by line.
2. Read `GEMINI.md` and explore the code the spec touches. Verify every reuse claim and every API
   or data assumption against what the repository actually contains.
3. Run the checklist below. Record every finding with a `spec.md:<line>` reference.
4. Write `specs/<feature-id>/reviews/spec-review-<attempt>.md` with the verdict, the findings, and
   the checks you performed.
5. Finish with the REPORT block.

## Checklist

Correctness and completeness
- Is the goal unambiguous? Could two competent readers implement two different things?
- Does every FR have an AC, and does every AC map to an FR?
- Are error paths, empty states, loading states and permission cases covered?
- Are the data and API contracts complete: fields, types, nullability, error codes, pagination?

Testability
- Can each AC be verified without interpretation? If not, it is a finding, not a preference.

Scope and feasibility
- Scope creep: anything asked for beyond the stated problem.
- Hidden assumptions about existing behaviour; anything that contradicts the current code.
- Missing migration, config, or rollout steps when data or environment changes.
- YAGNI: planned work nobody needs today.

Reuse and architecture
- Does the reuse plan point at real, existing building blocks (with paths)?
- Would the plan create a near-duplicate of an existing component, service, hook or util?

Writing quality
- Contradictions between sections, undefined terms, one requirement stated twice with different
  wording, missing numbers or limits where behaviour depends on them.

## Severity and verdict

Use the severities defined in `GEMINI.md`. Verdict rule, mechanical: any `blocker` or `major`
finding means `CHANGES_REQUESTED`; only `minor` and `note` means `APPROVE`. Never reject for
taste, never approve an untestable AC.

## Review report file

```
# Spec review - <feature-id> - attempt <n>

Verdict: APPROVE | CHANGES_REQUESTED
Checks performed:
- ...
Findings:
- [blocker] spec.md:42 - <problem> - fix: <required change>
Open questions for the human:
- ...
```

Then end your reply with the REPORT block: stage `spec-reviewer`, verdict matching the file.
