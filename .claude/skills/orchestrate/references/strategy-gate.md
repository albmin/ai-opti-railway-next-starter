# Strategy Gate — classify before you spawn

The single highest-leverage step. Before spawning anything, decide **what kind of work this is** and
**how heavy the orchestration should be**. Cheap to do, expensive to skip. Output goes in the decision
log; you never ask the user to approve it.

## Two axes

### Axis 1 — Nature (the cognitive approach)

| Strategy | Means | Route |
| -------- | ----- | ----- |
| `EXPLORATION` | Pure discovery — "where is X", "how does Y work", map the area | `aw-explore` ×N, synthesize |
| `EXECUTION` | A concrete change or command whose shape is already clear | locate → `aw-execute` → verify |
| `HYBRID` | A change that first needs context/research | explore (+research) → plan → review → execute |
| `REFRAME` | The request as stated is suboptimal or mis-scoped | propose the better approach, **then do it** (log the swap) |

`REFRAME` does **not** mean "stop and ask". In autonomous mode you state the better approach in the
decision log and proceed with it. Only when the reframe would cross the safety floor (irreversible
outward action) do you skip-and-flag instead.

### Axis 2 — Size / shape (the orchestration weight)

| Size | Looks like | Path |
| ---- | ---------- | ---- |
| `LIGHT` | one coherent change, a bugfix, a question, a single punch-list item | **Light path** — shared context, no worktrees |
| `HEAVY` | a feature big enough that independent agents should write files **in parallel** | **Heavy path** — worktree slices + integration |

The deciding question for the size axis is: **"Would I want two or more agents writing different files
at the same time?"** If yes → HEAVY (they need worktree isolation and an integration phase). If the
work is one stream of edits, even a large-ish one → LIGHT.

You don't always know the size up front. A common shape is: run a LIGHT explore→plan first, read the
plan's **Slice map**, and let *that* decide LIGHT-execute vs HEAVY.

## The two axes compose

| Example request | Nature | Size | What runs |
| --------------- | ------ | ---- | --------- |
| "Where do we handle auth refresh?" | EXPLORATION | LIGHT | explore ×3 → answer |
| "Fix the off-by-one in pagination" | EXECUTION | LIGHT | explore → execute → test |
| "Should we use X or Y for rate limiting, then add it" | HYBRID | LIGHT→? | research+explore → plan → (slice map decides) |
| "Build the notifications feature (model, API, UI, jobs)" | HYBRID | HEAVY | explore → plan → heavy-path slices → integrate |
| "Run the test suite and fix the failures" | EXECUTION | LIGHT→? | run `<test>` → triage → execute (slice if many independent) |
| "Work through these 9 small cleanup items" | EXECUTION | LIGHT×N | punch-list batching |

## Pre-analysis depth (scaled by effort)

- **low/medium effort:** classify inline in a sentence or two. Don't spawn an agent for it.
- **high+ effort:** spawn one `aw-analyze` in *strategy mode* with the request (and plan file, if any)
  inlined. It returns the block below; you act on it.

### `aw-analyze` strategy-mode return block

```
Strategy:   EXPLORATION | EXECUTION | HYBRID | REFRAME
Size:       LIGHT | HEAVY | DECIDE-AFTER-PLAN
Goal:       <restated objective in plain terms>
Confidence: HIGH | MED | LOW
Rationale:  <2–3 sentences>
Plan:       <ordered list of agents to spawn and why>
Reframe:    <only if REFRAME — the better approach + why>
```

If `Confidence: LOW`, don't stall — pick the most defensible interpretation, log it, and proceed
(autonomous contract). The decision log is what makes a wrong guess cheap to catch later.

## Punch-list handling (size = LIGHT×N)

A list of mostly-independent small changes:

1. Parse the list into discrete items.
2. For each, note: independent? shares files with another item?
3. **Independent + disjoint files** → batch as parallel `aw-execute` agents (one message). Use
   worktrees only if two items would touch the same file.
4. **Sequential / interdependent** → run as light-path passes in order.
5. Track every item's status (done / partial / skipped + why) in the decision log. Keep going past a
   failing item; never let one failure halt the list.

## What the gate prevents

- Over-decomposing a one-line fix into a full wave.
- Spawning parallel writers in shared context (they clobber each other) — that's what HEAVY + worktrees
  is for.
- Running a command blindly when discovery would reframe the task.
- Burning a strong model + many agents on low-effort work (effort scaling).
