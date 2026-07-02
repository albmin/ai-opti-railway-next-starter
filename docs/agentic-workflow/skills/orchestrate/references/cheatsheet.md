# Orchestrate — Cheatsheet (one screen)

## Flow
```
Learn project (commands/rules)  →  Strategy gate (nature × size)  →  LIGHT or HEAVY  →  Review gate  →  Verify + run summary
                                            │
                                            └─ autonomous throughout: never gate, log assumptions, surface blockers at end
```

## Strategy gate
```
Nature: EXPLORATION | EXECUTION | HYBRID | REFRAME
Size:   LIGHT (one stream of edits)  |  HEAVY (parallel writers ⇒ worktrees + integration)
Decider for size: "Do I want 2+ agents writing different files at once?"  yes → HEAVY
```

## Agents (exact names)
```
aw-explore  find code (read-only)      aw-plan     design + slice map (read-only)
aw-research web knowledge (read-only)  aw-review   verdict PASS/NEEDS_WORK/BLOCK (read-only)
aw-analyze  synthesize / strategy      aw-execute  write code + verify + commit (worktree on heavy)
```

## Light path
```
EXPLORATION  → aw-explore ×N ∥ → answer
EXECUTION    → aw-explore → aw-execute → verify
HYBRID       → aw-explore (+aw-research) → aw-plan → aw-review → aw-execute → verify
PUNCH LIST   → independent+disjoint files: parallel aw-execute · else sequential light passes
```

## Heavy path (see heavy-path-protocol.md)
```
A pre-flight risks + green baseline   B scaffold shared contracts, commit FIRST
C dispatch aw-execute ×slices (isolation:"worktree", shared preamble = contract) in ONE msg
D read "surprises/concerns" FIRST → per-file checkout → full verify → squash   E run summary (+post-mortem if structural fix)
```

## Review verdicts
```
PASS → proceed   NEEDS_WORK → close gap, re-plan, retry (≤2 high / ≤3 xhigh)   BLOCK → log + safest assumption + proceed
```

## Effort scaling
```
low: 1–2 agents, no research, 1 review   ·   high: 4–6, research, 2 lenses ≤2 iters
xhigh/max: 6+, REFRAME check, 3 lenses ≤3 iters
```

## Knobs
```
Model tiering: OFF by default (model: inherit). Opt-in per role in agents/aw-*.md.
Commands: ALWAYS derived from the project (<lint> <typecheck> <test> <build>) — never hardcoded.
Safety floor: never autonomously force-push / prod-deploy / delete data / rotate secrets → skip + flag.
Decision log: .agentic-workflow/runs/<slug>.md
```

## Rules
```
1 inline ALL context — @refs & prior chat do NOT reach sub-agents
2 spawn parallel agents in ONE message
3 sub-agents can't talk to each other — synthesis happens after they return
4 use exact aw-* names (fallback: general-purpose + inlined instructions)
5 never gate; log assumptions; surface blockers in the run summary
```
