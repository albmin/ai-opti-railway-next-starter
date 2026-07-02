# Agent Contracts — what each typed agent returns

Sub-agents run in isolated context windows. They cannot see each other, prior conversation, or
`@`-references — **you must inline everything they need**. In return, each agent gives back a *strict,
predictable shape* so you can synthesize and route without re-reading their work. This file is the
index of those shapes; the authoritative copy lives in each agent's own file under `agents/`.

## The agents

| Agent | Tools (least-privilege) | Writes? | Returns |
| ----- | ----------------------- | ------- | ------- |
| `aw-explore` | Glob, Grep, Read | no | key files, patterns, connections, **one-line answer** |
| `aw-research` | WebSearch, WebFetch, Read | no | **bottom line**, findings, options table, sources |
| `aw-analyze` | Read | no | summary, patterns, deps, risks, **recommended direction** (or strategy block) |
| `aw-plan` | Read, Glob, Grep | no | files, ordered steps, tests, risks, **slice map** |
| `aw-review` | Read, Grep, Glob | no | **verdict** PASS/NEEDS_WORK/BLOCK + critical/important/minor |
| `aw-execute` | Read, Write, Edit, Glob, Grep, Bash | **yes** | files changed, verification, **surprises/concerns**, status signal |

## The fields you route on

- **`aw-explore` → "one-line answer"**: the fast path. Read it first; dive into the table only if you
  need detail.
- **`aw-plan` → "slice map"**: decides LIGHT vs HEAVY. ≥2 independent file-owning slices ⇒ heavy path.
- **`aw-review` → "verdict"**: PASS ⇒ proceed · NEEDS_WORK ⇒ close the gap, re-plan, retry (bounded) ·
  BLOCK ⇒ (autonomous) log + proceed under safest assumption + flag at the end.
- **`aw-execute` → "surprises / concerns"**: the most important field in the whole system on the heavy
  path. Read every slice's concerns *before* the integration build; each is a prediction of where
  integration breaks. Audit other slices for the same concern.
- **`aw-execute` → status signal**: `✅ COMPLETE` / `⚠️ PARTIAL` / `❌ BLOCKED` — drives whether you
  integrate the slice, retry it, or skip-and-flag.

## Inlining checklist (before every spawn)

- [ ] Is the prompt self-contained — would a stranger with only this prompt understand the task?
- [ ] Did I inline the actual content of any file/finding I referenced (no `@refs`, no "see above")?
- [ ] Are file paths usable by the agent (absolute, or clearly relative to repo root)?
- [ ] For heavy-path writers: did I include the full shared preamble + the slice's owned files?
- [ ] Is the most critical instruction near the top of the prompt?

## Fallback when a custom agent isn't installed

These agents live in `agents/aw-*.md` and must be copied into a project's `.claude/agents/` (the
`install.sh` does this). If a project doesn't have them, spawn `general-purpose` instead and inline the
relevant `aw-*` agent file's instructions + report contract into the prompt. Note the fallback in the
decision log. The contracts above still apply — they're enforced by the prompt, not the agent type.
