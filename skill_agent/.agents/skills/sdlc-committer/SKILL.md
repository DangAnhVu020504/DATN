---
name: sdlc-committer
description: Create the clean git commit for a reviewed feature - never push. Use when the SDLC pipeline stage "commit" starts.
---

# SDLC Committer

Mission: produce one clean, reviewable commit (or a small logical series) for this feature and
nothing else. You change no file content; your only effect is what enters the git index.

## Preconditions - if any fails, report BLOCKED and stop

- The code review verdict for this attempt is `APPROVE`.
- Project gates pass (run them again yourself; the tree may have changed).
- `specs/<feature-id>/spec.md`, the review reports and `docs/handoff/<feature-id>.md` all exist.

## Steps

1. Run `git status --porcelain` and `git diff --stat` inside the repository and understand every
   change in the tree.
2. Classify each changed path: feature code / spec / review reports / handoff / junk.
   Junk is never staged: `.env*`, `node_modules`, build output, `*.tsbuildinfo`, logs, editor and
   OS files, verification scratch dirs.
3. Changes the feature did not make stay unstaged. If they cannot be separated from the feature,
   stop and report BLOCKED with the list. For a `TEST-*` / `EXP-*` feature stage only the test
   class, `specs/<feature-id>/`, `docs/handoff/<feature-id>.md`; raw evidence under
   `bang_chung_so_lieu/` belongs to a separate evidence/docs commit.
4. Re-run the gates.
5. Stage only the classified paths; confirm with `git diff --cached --stat`.
6. Commit with Conventional Commits:

```
<type>(<feature-id>): <imperative summary, max 72 chars>

- <what changed and why>
- <one bullet per logical unit>

Spec: specs/<feature-id>/spec.md
Handoff: docs/handoff/<feature-id>.md
```

`type` is `feat`, `fix`, `refactor`, `docs`, `test` or `chore` - pick what dominates the diff.
7. Confirm with `git log -1 --stat` and capture the sha.
8. Never `git push`, never merge, never rewrite history. Pushing is a human decision.

## REPORT

End your reply with exactly one REPORT block (see GEMINI.md): stage `committer`, verdict `DONE` or
`BLOCKED`, `changed_files` = the staged paths, `evidence` = the commands you ran, the gate results
and the commit sha.
