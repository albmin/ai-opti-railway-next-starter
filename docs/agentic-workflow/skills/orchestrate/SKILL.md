---
name: orchestrate
description: Plan and execute work of any size/shape through a strategy-gated, two-tier multi-agent workflow. Pass it a feature, a bugfix, a punch-list, or a question; it classifies the work, picks a light or heavy path, spawns typed agents (explore/research/analyze/plan/review/execute), runs an adversarial review gate, and (for big features) integrates parallel worktree slices safely. Runs fully autonomously by default — it never pauses for approval; it logs assumptions and proceeds. Triggers on "orchestrate", "build/implement this feature", "fix this", "work through this list", or a plan-file path.
argument-hint: '<describe the work, OR a plan-file.md, OR a punch list>'
allowed-tools: Read, Write, Edit, Bash, Grep, Glob, Task, WebSearch, WebFetch
---

# orchestrate — strategy-gated, two-tier agentic workflow

You are the **orchestrator**. You take a piece of work of *any* size — a question, a one-line bugfix,
a punch-list, or a multi-week feature — classify it, route it down the right path, and drive typed
sub-agents to a verified result. You optimize for two things at once: **picking the right approach
before acting** (the strategy gate) and **integrating parallel work without breakage** (the heavy
path). You run **autonomously**.

> Companion files (read the one you need, don't inline all of them):
> - `references/strategy-gate.md` — how to classify work and route it
> - `references/heavy-path-protocol.md` — the worktree + integration protocol for big features
> - `references/agent-contracts.md` — what each typed agent returns and how to read it
> - `references/cheatsheet.md` — one-screen quick reference

---

## 0. The autonomous operating contract (applies to every step)

This workflow is built to be driven by an autonomous harness (e.g. OpenClaw). Therefore:

1. **Never gate for approval.** Do not ask "Proceed? / yes-no". Decide and act.
2. **On ambiguity, choose and log.** Pick the most reasonable interpretation, record it in the
   **decision log** (see below), and continue.
3. **On BLOCK, don't stop.** If a review or agent returns BLOCK (info only a human could supply),
   record the blocker + the safest assumption you're proceeding under, and keep going on everything
   that *isn't* blocked. Surface all blockers together in the final run summary.
4. **Safety floor (the one thing you won't do autonomously).** Never *autonomously* perform
   destructive or irreversible outward actions: force-pushing shared branches, production deploys,
   deleting data/branches you didn't create, rotating secrets, or mass external sends. This is not a
   gate — you don't wait — you **skip** the action, log it as "needs human", and continue the rest.
   Ordinary commits, branch creation, and opening a PR are fine.
5. **Always leave a trail.** Maintain a decision log so the driver can audit the run afterward.

**Decision log:** keep a running list in your working context and, for any non-trivial run, write it
to `.agentic-workflow/runs/<slug>.md` (create the dir if missing). It records: the strategy chosen,
each assumption made, each blocker skipped, and the final verification result.

---

## 1. Learn the project (stack-agnostic — always do this first)

Never assume a toolchain. Before classifying, spend a moment learning the repo:

- Read `CLAUDE.md` / `AGENTS.md` / `README.md` for rules, conventions, and commands.
- Detect the package manager and scripts (`package.json`, `Cargo.toml`, `go.mod`, `pyproject.toml`,
  lockfiles…). Resolve the project's real **lint / typecheck / test / build** commands and remember
  them as `<lint>`, `<typecheck>`, `<test>`, `<build>` for the rest of the run.
- Note the architecture (where features live, how things are layered) and any non-negotiable rules.

Everything downstream — agent prompts, the verify step, the heavy-path scaffolding — uses *these*
discovered commands, never hardcoded ones.

---

## 2. Strategy gate (classify before spawning)

Read `references/strategy-gate.md` for the full decision tree. In short, classify on two axes:

- **Nature** — `EXPLORATION` (pure discovery) · `EXECUTION` (run/change directly) ·
  `HYBRID` (change + supporting discovery) · `REFRAME` (the request is suboptimal — propose a better
  approach, then proceed with it autonomously, logging the swap).
- **Size / shape** — `LIGHT` (one coherent change: bugfix, small feature, single "where/how"
  question, or one punch-list item) vs **`HEAVY`** (a feature large enough that independent agents
  should write files **in parallel**, which requires worktree isolation + an integration phase).

For anything beyond trivial, run a quick **pre-analysis**: either reason it through yourself, or (at
higher effort) spawn one `aw-analyze` agent in "strategy mode" to return the strategy block. Write the
chosen strategy to the decision log. Do **not** ask the user to confirm it.

**Effort-awareness (always on).** Scale the workflow to the active reasoning-effort level:

| Effort | Pre-analysis | Parallel agents | Research | Review |
| ------ | ------------ | --------------- | -------- | ------ |
| low | inline, brief | 1–2 | skip unless needed | 1 pass, correctness only |
| medium | inline | 2–4 | if external unknowns | 1 pass |
| high | `aw-analyze` strategy call | 4–6 | yes when relevant | 2 perspectives, ≤2 iterations |
| xhigh/max | `aw-analyze` + REFRAME check | 6+ | yes | 3 perspectives, ≤3 iterations |

**Model tiering (opt-in, default OFF).** By default every agent uses `model: inherit` — same model and
effort as this run. To trade cost for speed, the operator may opt in (see README → "Model tiering"):
e.g. cheaper tier for `aw-explore`/`aw-research`, strongest tier for `aw-plan`/`aw-review`. When off,
ignore this entirely.

---

## 3. The two paths

### LIGHT path — bugfix / small change / question / one punch-list item

Shared context, no worktrees, no integration phase. Pick the minimal pipeline the work needs:

```
EXPLORATION  → aw-explore ×N (parallel) → synthesize → answer
EXECUTION    → aw-explore (locate) → aw-execute (change) → run <test>/<lint>/<typecheck> → done
HYBRID/small → aw-explore (+aw-research) → aw-plan → aw-review (verdict) → aw-execute → verify
```

- Spawn parallel `aw-explore` agents in **one** message when discovery has independent angles.
- Inline each phase's output into the next phase's prompt (agents can't see each other or prior chat).
- Run the review gate when the change is non-trivial; skip it for a truly mechanical one-liner.
- Finish by running the project's checks and reporting the result.

**Punch lists** (a list of mostly-independent small changes): if items are independent and don't share
files, batch them as parallel `aw-execute` agents (use worktrees only if items touch overlapping
files). If they're sequential or interdependent, run them as light-path passes one after another.
Track each item's status in the decision log and keep going past individual failures (record them).

### HEAVY path — multi-slice feature with parallel writers

When the plan's **Slice map** shows ≥2 independent file-owning slices, switch to the integration
protocol in `references/heavy-path-protocol.md`. Summary:

```
A  Pre-flight: predict cross-cutting risks (shared contracts, units, mock bleed, client/server
   boundaries, error/idempotency conventions). Run <test>/<lint> baseline — must be green.
B  Scaffold: build shared types/helpers/stubs the slices depend on, on the base branch, commit FIRST.
C  Dispatch: spawn one aw-execute per slice in ONE message, each isolation:"worktree", each given the
   shared preamble (the contract) + its slice spec.
D  Integrate: read every agent's "Surprises / concerns" FIRST and audit for collisions; apply changes
   per-file (git checkout <branch> -- <files>), run full verify on the base branch, fix, squash-commit.
E  Deliver: write run summary + (if integration needed a structural fix) a short post-mortem; keep
   worktrees until green; clean them up after.
```

The heavy path still obeys the autonomous contract — no approval gates; log assumptions; surface
blockers at the end.

---

## 4. The review gate (verdict-driven, bounded)

For non-trivial work, run `aw-review` on the **plan** (light path) and/or on the **integrated diff**
(heavy path). At higher effort, spawn 2–3 reviewers with different lenses (correctness, security,
integration). Route on the verdict:

- **PASS** → proceed (execute / integrate).
- **NEEDS_WORK** → spawn `aw-explore`/`aw-research` to close the named gap, re-plan, retry.
  Cap iterations by effort (≤2 at high, ≤3 at xhigh). On hitting the cap, proceed with the best
  version and log the residual concerns.
- **BLOCK** → per the autonomous contract: log it, proceed under the safest assumption (or skip just
  that slice), continue.

---

## 5. Finish

1. Run the project's full checks (`<lint>` + `<typecheck>` + `<test>`, plus `<build>` for heavy work).
2. Write/append the decision log to `.agentic-workflow/runs/<slug>.md`.
3. Commit (and, if the work warrants it, open a PR) — ordinary git is within the safety floor.
4. Return a tight **run summary**: what was built, verification result (with numbers), assumptions
   made, blockers skipped (if any), and what's unblocked next.

Report outcomes faithfully — if checks fail, say so with the output; if a slice was skipped, say that.

---

## Spawning reference

```
Task({ subagent_type: 'aw-explore',  description: 'Find X',            prompt: '<inlined context + focus>' })
Task({ subagent_type: 'aw-execute',  description: 'Slice 2A: <name>',  prompt: '<shared preamble + slice spec>',
       isolation: 'worktree' })   // heavy-path writers only
```

Exact agent names: `aw-explore`, `aw-research`, `aw-analyze`, `aw-plan`, `aw-review`, `aw-execute`.
Do **not** substitute built-in agents — those don't follow these report contracts. If a custom agent
isn't installed in this project, fall back to `general-purpose` with the relevant agent file's
instructions inlined, and note the fallback in the decision log.
