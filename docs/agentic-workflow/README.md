# agentic-workflow

A portable, autonomous, multi-agent coding workflow you can drop into any project (new or existing).
Pass it work of **any size or shape** — a question, a one-line bugfix, a punch-list, or a multi-week
feature — and it classifies the work, picks the right execution path, drives typed sub-agents, reviews
its own output, and (for big features) integrates parallel work safely.

It is delivered as **plain Claude Code skills + agents** — no plugin, no marketplace. Copy two folders
into a project's `.claude/` (or run `install.sh`) and it's live.

---

## Why this exists

This unifies two workflows that were each strong on one side and weak on the other:

- A **wave/integration protocol** (the predecessor wave prompts this evolved from) — excellent at *integrating
  parallel code into `main` without breakage* (worktrees, pre-flight risk analysis, shared
  scaffolding, careful merge), but it treated *every* task as a heavy wave and used one generic agent.
- An **orchestrate skill** — excellent at *thinking before acting* (strategy pre-analysis, typed
  specialist agents, adversarial review with a verdict loop), but it had no parallel-write isolation,
  no integration discipline, and was hardcoded to one project's stack.

`agentic-workflow` keeps the integration discipline of the first and grafts on the strategy gate,
typed agents, and review loop of the second — then makes the whole thing **autonomous, stack-agnostic,
and effort-aware** so it can run unattended inside a harness like OpenClaw.

See `docs/architecture.md` for the full design and the trade-offs behind each decision.

---

## Core ideas (60 seconds)

- **Strategy gate first.** Every request is classified on two axes — *nature*
  (explore / execute / hybrid / reframe) and *size* (light vs heavy) — before any agent spawns. This
  stops a one-line fix from becoming a full wave, and stops a big feature from being crammed into one
  serial agent.
- **Two paths.** *Light* = shared-context typed agents for bugfixes/small changes/questions. *Heavy* =
  isolated git-worktree slices + an integration phase for features with parallel writers.
- **Typed, least-privilege agents.** `aw-explore`, `aw-research`, `aw-analyze`, `aw-plan`, `aw-review`,
  `aw-execute` — each with only the tools it needs and a strict report contract.
- **Adversarial review gate.** A real `PASS / NEEDS_WORK / BLOCK` verdict loop (bounded iterations)
  before code is executed or integrated.
- **Autonomous by default.** It never pauses for approval — it logs assumptions and proceeds, surfaces
  blockers at the end, and refuses only genuinely destructive/irreversible outward actions.
- **Stack-agnostic.** It learns the project's real lint/typecheck/test/build commands from
  `CLAUDE.md` + package scripts. Nothing is hardcoded to a framework or host.
- **Effort-aware.** It scales agent count and review depth to the active reasoning-effort level.

---

## What's in the box

```
agentic-workflow/
├── README.md                       # this file
├── autonomous-owner-prompt.md      # hand-the-reins autonomous roadmap+build kickoff
├── install.sh                      # copy skills + agents into a target project's .claude/
├── docs/
│   ├── architecture.md             # design, the two-tier model, how the two source systems merged
│   ├── usage.md                    # detailed invocation guide + the three worked examples
│   └── permissions.md              # generic, stack-agnostic permissions starter + the chained-command rule
├── skills/
│   └── orchestrate/
│       ├── SKILL.md                # the entry skill (strategy gate → route → review → verify)
│       └── references/
│           ├── strategy-gate.md    # classification + routing decision tree
│           ├── heavy-path-protocol.md  # worktree slices + integration protocol
│           ├── agent-contracts.md  # what each agent returns and how to read it
│           └── cheatsheet.md       # one-screen quick reference
└── agents/
    ├── aw-explore.md   aw-research.md   aw-analyze.md
    ├── aw-plan.md      aw-review.md     aw-execute.md
```

---

## Install

From inside a target project (anywhere the `agentic-workflow/` folder is reachable):

```bash
bash agentic-workflow/install.sh            # installs into ./.claude
bash agentic-workflow/install.sh /path/to/other-project
```

It copies `skills/orchestrate` → `<project>/.claude/skills/` and `agents/aw-*.md` →
`<project>/.claude/agents/`. It is idempotent and never touches your `settings.json`. To adopt the
permission allow-list, see `docs/permissions.md` (kept separate so installing the workflow never
changes your security posture without you opting in).

> Prefer not to run a script? Just copy those two folders by hand — that's all "install" is.

---

## Invoke

Once installed, invoke the skill and hand it the work. The argument is free-form:

```
/orchestrate <describe the work, OR a plan-file.md path, OR a punch list>
```

It also auto-triggers on natural phrasing ("orchestrate…", "build this feature", "fix this bug",
"work through these items"). In an autonomous harness (OpenClaw), you pass the same free-form work
string as the prompt; the workflow runs end-to-end without prompting, writes a decision log to
`.agentic-workflow/runs/<slug>.md`, verifies, commits, and returns a run summary.

### What to pass for different sizes/shapes

| You have… | Pass it… | It routes to… |
| --------- | -------- | ------------- |
| A big feature | a paragraph of intent (or a plan file) | explore → plan → **heavy path** (worktree slices) → integrate |
| A small bugfix | the symptom + where you've seen it | explore → execute → verify (**light path**) |
| A punch-list | a markdown list of independent items | **light path**, batched (parallel if disjoint) |
| A question | "where/how does X work?" | parallel `aw-explore` → synthesized answer |
| A "should we…?" | the decision + constraints | `aw-research` + `aw-explore` → `aw-plan` |

Full walkthroughs of the three primary shapes (feature / bugfix / punch-list) are in `docs/usage.md`.

---

## Optional: model tiering (default OFF)

By default every agent uses `model: inherit` — the same model and reasoning-effort as the run. This is
deliberate: one knob (your `/effort` + model choice) controls the whole workflow.

To trade cost/speed for money, opt in by editing the `model:` field in any `agents/aw-*.md`. A common
profile:

| Role | Suggested tier (if opting in) | Why |
| ---- | ----------------------------- | --- |
| `aw-explore`, `aw-research`, `aw-execute` | a faster/cheaper tier | I/O- and edit-bound |
| `aw-analyze`, `aw-plan`, `aw-review` | the strongest tier | reasoning-bound |

Effort-awareness stays on regardless — the workflow still scales *how much* it does to the active
effort level.

---

## Future improvements (intentionally out of scope for now)

- **Stack flavors.** Today the workflow is generic and learns each project's commands at runtime. A
  future enhancement: optional "flavors" (e.g. `nextjs-vercel-supabase`, `nextjs-railway`) selected by
  a small project profile, so the workflow can pre-load stack-specific conventions, deploy steps, and
  gotchas instead of re-deriving them.
- **Batch/data pattern.** A dedicated mode for processing hundreds–thousands of independent items
  (classification, enrichment, migration) in waves of agents with cost/time modeling. Valuable but
  orthogonal to code integration; deferred until needed.
- **Permission feedback loop.** Auto-audit the run for repeated permission prompts and propose
  allow-list additions (see `docs/permissions.md`).

---

## Autonomous owner mode (`autonomous-owner-prompt.md`)

`/orchestrate` executes work you *hand it*. The companion `autonomous-owner-prompt.md` is for when you
want to **hand the reins over** — the agent inspects the repo, sets its own 3-month roadmap, and starts
building it, unattended. Use it to spend leftover session budget/quota productively, or to kick off a
greenfield repo where the work isn't enumerated yet. It can delegate each concrete task it identifies to
`/orchestrate`. See that file for the full "when to use it" guidance and the prompt itself.

## Relationship to the predecessor `docs/ai-workflow/`

This toolkit is the evolution of the earlier `docs/ai-workflow/` prompt templates (a wave/integration
protocol, an autonomous-owner prompt, and a permissions starter). In this template those predecessors
have been **replaced** by this directory — their capabilities are fully subsumed here: the wave protocol
lives on as the heavy path in `skills/orchestrate/references/heavy-path-protocol.md`, the permissions
starter as `docs/permissions.md`, and the autonomous-owner prompt as `autonomous-owner-prompt.md`. This
is the workflow new projects should adopt.
