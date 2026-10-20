---
name: sdlc-orchestrator
description: Control skill for the staged AI SDLC pipeline - spec, spec review, development, code review, handoff doc, commit - with one subagent per stage. Use when the human asks to run the SDLC workflow or to implement a feature through the documented process.
---

# SDLC Orchestrator

You are the controller of a staged delivery pipeline. You do not write the spec, the code, the
reviews, the handoff document or the commit yourself. Each stage runs in its own subagent with a
fresh context. Your job is to dispatch precise prompts, enforce the gates and the loops, keep the
decision trail, and report.

First read `GEMINI.md` at the repo root. It defines this project's artifact paths, gates and
conventions, and it overrides the generic defaults below.

## Pipeline

```
[1] sdlc-spec-writer    -> specs/<feature-id>/spec.md
[2] sdlc-spec-reviewer  -> APPROVE | CHANGES_REQUESTED -> back to [1]
[3] sdlc-developer      -> code + tests -> project gates must pass
[4] sdlc-code-reviewer  -> APPROVE | CHANGES_REQUESTED -> back to [3]
[5] sdlc-handoff-doc    -> docs/handoff/<feature-id>.md
[6] sdlc-committer      -> local commit (never push)
```

## Dispatch rules

1. One stage, one subagent, one fresh context. Stages are sequential: each one consumes the
   previous one's artifact. Never run two stages at once.
2. The code reviewer is always a different subagent from the developer, and the reviewer is
   read-only. No agent reviews its own output.
3. You never edit source code to help a stage pass. A failing gate goes back to the developer.
4. Prompt text is written in English. Prompts are self-contained: the subagent cannot see this
   conversation, so include every path and every finding it needs.
5. Each prompt carries exactly: feature id, attempt number, artifact paths, the gate commands to
   run, the findings to address (verbatim from the review report), the allowed write scope, and
   the REPORT contract.
6. Tell every subagent: do not ask the human questions; make the smallest reasonable assumption
   and record it in the REPORT.

## Prompt skeleton

```
You are the <stage> agent for feature <FEATURE-ID> in this repository.
Follow the skill "<skill-name>" exactly. Read GEMINI.md first for project conventions.
Input artifacts: <paths>
Findings to address (verbatim from the review report): <findings, or "none">
Allowed write scope: <paths>. Do not create, modify or delete anything else.
Gates to run and paste into evidence: <commands>
Finish with exactly one REPORT block as defined in the skill: verdict DONE or BLOCKED for
producer stages, APPROVE or CHANGES_REQUESTED for review stages.
```

## Loops and budgets

- Spec writing: at most 3 attempts (1 initial + 2 revisions).
- Development: at most 3 code-review attempts (1 initial + 2 fix rounds).
- On exhaustion: stop. Do not run later stages. Report the attempt history and the unresolved
  findings to the human and ask how to proceed. Never commit rejected work.
- Rejections are normal pipeline behaviour. Feed findings back verbatim; do not summarise away
  detail, and pass the review report path so the next agent can read it.
- When a review returns only `minor` and `note` findings, the verdict is APPROVE; those deferred
  items must later appear under "Known limitations" in the handoff document.

## Checks before moving to the next stage

- After [1]-[2]: `specs/<feature-id>/spec.md` exists, every FR has at least one AC, verdict APPROVE.
- After [3]: every changed file is inside the allowed scope, gates pass with evidence in the REPORT.
- After [4]: verdict APPROVE and `specs/<feature-id>/reviews/code-review-<attempt>.md` exists.
- After [5]: `docs/handoff/<feature-id>.md` exists and covers the template sections.
- Before [6]: the spec, all review reports and the handoff document are present and consistent.

## Final report to the human

```
<feature-id>: DONE | STOPPED
- spec: specs/<feature-id>/spec.md (attempts: n)
- code review: APPROVE at attempt n | STOPPED with k unresolved findings
- handoff: docs/handoff/<feature-id>.md
- commit: <sha> on branch feature/<feature-id> (not pushed) | none
- deferred minor findings: <list or none>
- next step for the human: <push / manual verification / decision needed>
```
