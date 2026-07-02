# Architecture & Design

How `agentic-workflow` is put together, why, and the trade-offs behind each decision.

## The problem it solves

Multi-agent coding fails in two different places, and most workflows only defend one of them:

1. **Wrong approach, confidently executed.** The orchestrator parallelizes before it understands the
   task — running a command that didn't need running, exploring with the wrong decomposition, or
   building the wrong thing.
2. **Right work, broken integration.** Independent agents each produce correct code in isolation, but
   it doesn't compose — unit drift, mock cross-talk, import-boundary leaks, two agents editing the
   same shared file with different assumptions.

This workflow defends both: a **strategy gate** for (1) and an **integration protocol** for (2).

## Lineage — merging two systems

| Source | Strength inherited | Weakness fixed here |
| ------ | ------------------ | ------------------- |
| Wave/integration protocol (`docs/ai-workflow/`) | Worktree isolation, pre-flight risk analysis, scaffold-first, careful per-file integration, deliverable/learning discipline | Treated *everything* as a heavy wave; one generic agent; permission/command friction |
| Orchestrate skill | Strategy pre-analysis; typed specialist agents; adversarial review with verdict loop; skill ergonomics | No parallel-write isolation; no integration phase; hardcoded to one stack; non-portable (depended on an uninstalled plugin) |

The merge keeps the integration discipline as the **heavy path**, adds the strategy gate as the
**front door**, replaces the single generic agent with **typed agents**, and adds the **review gate**
as a quality bar — then makes the whole thing autonomous, stack-agnostic, and effort-aware.

## The two-tier model

```
                         ┌─────────────────────────┐
   work of any shape  →  │  0. learn the project   │  read CLAUDE.md, detect commands
                         │  1. strategy gate       │  nature × size  → route
                         └───────────┬─────────────┘
                    ┌────────────────┴────────────────┐
              LIGHT │                                  │ HEAVY
       ┌────────────▼───────────┐         ┌────────────▼─────────────────────┐
       │ shared-context agents  │         │ pre-flight risks → scaffold first │
       │ explore→plan→review→   │         │ → parallel worktree slices        │
       │ execute→verify         │         │ → read warnings → integrate       │
       └────────────┬───────────┘         └────────────┬─────────────────────┘
                    └───────────────┬──────────────────┘
                          ┌─────────▼──────────┐
                          │  review gate +     │  PASS / NEEDS_WORK / BLOCK
                          │  verify + summary  │  decision log + run summary
                          └────────────────────┘
```

The **size axis** is the pivotal call. The deciding question is literally: *"do I want two or more
agents writing different files at the same time?"* If yes, you need physical isolation (worktrees) and
an integration phase — the heavy path. If no — even for a fairly large single stream of edits — the
light path is simpler and safer. The `aw-plan` agent's **slice map** is what surfaces this: ≥2
independent file-owning slices ⇒ heavy.

## Why typed agents (vs one general-purpose agent)

Three concrete payoffs:

1. **Safety via least privilege.** A read-only `aw-explore`/`aw-review` literally cannot write. Only
   `aw-execute` can edit. Fewer ways for a misfire to mutate the repo.
2. **Reliable synthesis.** Each agent returns a strict, predictable report shape, so the orchestrator
   routes on known fields (`aw-plan`'s slice map, `aw-review`'s verdict, `aw-execute`'s
   surprises/concerns) instead of re-reading prose.
3. **Cheap model tiering.** Because roles are separated, you *can* (optionally) run I/O-bound roles on
   a cheaper tier and reasoning-bound roles on the strongest tier — without coupling that choice to the
   task. It's off by default (`model: inherit`) so the default stays a single knob.

## Design decisions (and the inputs that drove them)

- **Plain skills + agents, no plugin.** Chosen for transparency and zero-ceremony portability: install
  is "copy two folders" (or `install.sh`). A `plugin.json` is *not required* for skills/agents to
  function — it's only a packaging/distribution manifest. We can add a plugin wrapper later if
  one-command multi-repo distribution becomes worth the ceremony.
- **Fully autonomous, never gate.** Built to run inside an autonomous harness. No approval prompts;
  ambiguity is resolved by choosing + logging; blockers are surfaced at the end, not mid-run. The one
  carve-out is the **safety floor** — destructive/irreversible *outward* actions (force-push, prod
  deploy, data/secret deletion, mass external sends) are skipped-and-flagged, not performed
  unattended. This is a *refusal to act*, not a *pause to ask*, so it stays consistent with autonomy.
- **Stack-agnostic, learn at runtime.** Instead of baking in a toolchain, step 1 derives the project's
  real `lint/typecheck/test/build` commands from `CLAUDE.md` + package scripts. This is what makes one
  copy work across Next.js+Vercel+Supabase, Next.js+Railway, or anything else. (Optional per-stack
  "flavors" are noted as future work — see the README.)
- **Effort-aware, model-tier-optional.** The active reasoning-effort level scales *how much* the
  workflow does (agent count, research, review iterations). Model tiering — *which* model each role
  uses — is a separate, opt-in knob, default off. These were deliberately kept orthogonal so one
  doesn't silently change the other.

## The decision log (auditability)

Because the workflow never stops to ask, the **decision log** is how a human (or the driving harness)
reconstructs *why* it did what it did. Every non-trivial run writes `.agentic-workflow/runs/<slug>.md`
with the strategy chosen, every assumption made, every blocker skipped, and the final verification
result. On the heavy path, a structural integration fix also produces a short post-mortem whose lesson
folds into the next run's pre-flight risk list — the same compounding-learning loop the original wave
protocol used.

## What's intentionally *not* here

- **No approval gates / interactive prompts** — by design (autonomy).
- **No batch/data-processing mode** — orthogonal to code integration; deferred (README → future work).
- **No stack-specific flavors yet** — generic-at-runtime instead; flavors deferred.
- **No plugin manifest** — plain skills/agents chosen for portability.
