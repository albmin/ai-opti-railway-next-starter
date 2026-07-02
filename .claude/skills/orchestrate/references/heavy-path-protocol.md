# Heavy-Path Protocol — parallel worktree slices + safe integration

Use this when the plan's **Slice map** shows ≥2 independent file-owning slices that should be written
in parallel. The hard part of parallel code is **integration**, so this protocol front-loads
integration risk (Phases A–B) before any agent writes a line, and audits agent warnings before merging
(Phase D). Lineage: this is the battle-tested "wave" protocol, adapted to run autonomously, derive its
commands from the project, and use typed agents + a review gate.

Throughout: **autonomous contract applies** — no approval gates, log assumptions, surface blockers at
the end, honor the safety floor. `<lint>/<typecheck>/<test>/<build>` are the project's real commands,
discovered in skill step 1.

---

## Phase A — Pre-flight integration analysis (REQUIRED)

Skipping this is the #1 cause of integration failure. Before dispatching, write a short pre-flight note
(into the decision log) predicting the cross-cutting risks for *this* feature:

1. **Shared module contracts** — which files will multiple slices import from? Confirm the interface is
   stable and documented in the preamble before anyone writes.
2. **Test-mock patterns** — slices that mock the same module can clobber each other. Pick one pattern;
   put it in the preamble as a MUST.
3. **Client/server boundary** — which modules are safe to import on each side? Name the rule explicitly
   (e.g. "client components must import from `…/models`, not the service barrel").
4. **Unit / shape drift** — timestamps ms vs s, ids string vs number, money cents vs float. Name the
   canonical choice. Two slices guessing differently renders nothing, with no error.
5. **Error & idempotency conventions** — on external failure: retry / skip / fail-batch? On re-run:
   no-op / upsert / duplicate? Pick one each.
6. **New dependencies** — which packages does each slice need? Install them once in Phase B.
7. **Style rules the linter enforces** — list them so slices don't waste cycles (derive from CLAUDE.md).

Then run the baseline: `<test>` and `<lint>` must be green on the base branch. If red, fix first.

Effort scales depth: at low/medium, a tight note covering the obvious risks; at high/xhigh, spawn an
`aw-analyze` to enumerate cross-slice risks and an `aw-review` on the plan's slice map.

## Phase B — Build the shared scaffolding FIRST (on the base branch)

For every risk in Phase A, build the shared thing **before** slices start, so they import a stable
contract from day one:

- `B.1` Install shared deps (one commit).
- `B.2` Create shared types / test helpers / runtime utils / **stub export signatures** so dependent
  slices compile against a real interface. Minimal correct implementation + at least one test each.
- `B.3` Add a script entry for every new runnable so agents invoke it via the project's runner (which
  is already permission-allowed) instead of ad-hoc commands.
- `B.4` Verify the scaffold: `<lint> <typecheck> <test>` green; test count must not drop.
- `B.5` Commit the scaffold to the base branch with a conventional message. **This commit must land
  before any slice dispatches** — slices branch off it.

## Phase C — Dispatch parallel worktree slices

`C.1` Create the slices from the plan's Slice map. Each owns a disjoint set of files.

`C.2` Spawn **all** slices in ONE message — one `Task` per slice:
```
Task({ subagent_type: 'aw-execute', description: 'Slice 2A: <name>', isolation: 'worktree',
       prompt: <SHARED PREAMBLE> + <SLICE SPEC> })
```

`C.3` Every prompt = **shared preamble** (the contract — every MUST is non-negotiable) + a
slice-specific section. When unsure whether to write "should" or "MUST", write MUST.

### Shared preamble (paste into every slice, then append its spec)

```
You are implementing ONE slice of <feature> in an isolated git worktree on a branch already created
off the scaffold commit. Work only in your worktree; touch only your assigned files.

Before writing: read CLAUDE.md (rules/commands), and the Phase B scaffold files: <list>.
STEP 0 — verify your base: `git -C <worktree> log -1 --oneline`; `pwd`; confirm scaffold files exist.
  If any check fails, stop and report it — do not write against a bad base.

NON-NEGOTIABLE (from Phase A):
  1. <shared contract rule>
  2. <client/server import rule>
  3. <test-mock pattern>
  4. <canonical units/shapes>
  5. <error + idempotency convention>
  6. <project style rules: derive from CLAUDE.md>
  7. Commands: never `cd /path && cmd`. Use `git -C <abs>` and absolute paths.
  8. When done: run <lint> <typecheck> <test> in your worktree; fix until green.
  9. Commit to your worktree branch (conventional message). Do NOT push/merge/touch the base branch.

Return the aw-execute report contract, with a thorough "Surprises / concerns" section.
```

`C.4` Slice spec per agent: the files it owns, the exact deliverable/behavior, the tests to add, and
slice-specific gotchas you predicted.

## Phase D — Integration (where discipline pays off)

`D.1` **Read every slice's "Surprises / concerns" section FIRST** — before running anything. For each
warning, audit the *other* slices for the same concern (collisions, differently-named shared exports,
conflicting fixtures, env-shape mismatches). Warnings are predictions to act on, not notes to skim.

`D.2` Predict cross-slice issues: two slices adding to the same shared file; an export one slice
created and another referenced by a different name; fixture path clashes; env var not matching the
schema. Resolve these *before* the build.

`D.3` Apply changes **per file**, not via merge — gives a clean stage to squash:
```
git -C <root> diff <base>..<slice-branch> --name-status   # see what the slice changed
git -C <root> checkout <slice-branch> -- <file1> <file2> … # stage each slice's files onto base
```

`D.4` Run full verification on the base branch: `<lint> <typecheck> <test>` (+ `<build>`). Triage:
trivial (one-line type patch) → fix in place; structural (two slices wrote conflicting helpers) → fix
at the root and record the lesson in the post-mortem.

`D.5` Optionally spawn `aw-review` on the integrated diff (an integration-lens reviewer) before
committing. Route on its verdict per the skill's review gate.

`D.6` Keep all worktrees alive until the base branch is verified green — they are your rollback path.

`D.7` Squash-commit the integrated work on the base branch (conventional message; body lists files by
slice). Then remove worktrees and delete slice branches.

## Phase E — Deliverables

- **Run summary** (always): what each slice built, verification numbers, assumptions, any skipped/
  blocked items, what's unblocked next. Append to `.agentic-workflow/runs/<slug>.md`.
- **Post-mortem** (only if Phase D needed a structural fix): timeline, root cause, the fix, and the
  prevention to fold into the next run's Phase A risk list. This is how the workflow compounds.
- **Permission note** (optional): if the run hit repeated permission prompts, note the missing
  wildcards (see `docs/permissions.md`).

## Anti-patterns this protocol exists to prevent

- "Write code first, integrate later" — isolated slices can't see each other; without A+B, collisions
  are guaranteed.
- "Preamble as guidelines, not contract" — half the slices follow a "should", half don't → two styles.
- "One big agent does everything" — loses parallelism and worktree isolation; one failure poisons all.
- "Run the integration build before reading the warnings" — the warnings predicted the exact failure.
- "Remove worktrees before the base branch is green" — you just deleted your rollback path.
