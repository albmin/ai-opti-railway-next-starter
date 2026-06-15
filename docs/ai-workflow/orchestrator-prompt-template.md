# Claude Code Orchestrator Prompt Template

**Purpose:** A reusable, self-contained prompt template for executing a multi-agent wave of work in a fresh Claude Code session. Derived from the `wave-{2..8}-orchestrator-prompt.md` files in `your-project/plans/implementation/`, which have proven the 5-phase protocol across 8 waves.

**Why this template exists:** Waves 1 and 2 of your-project hit integration failures that were preventable with upfront planning. The protocol was codified, then refined through 6 more waves. Wave 5+ saw ~0 permission prompts and zero structural integration failures. This template exports those lessons to any project using Claude Code for multi-agent orchestration.

**How to use:**

1. Copy this file into your new project as `plans/implementation/wave-N-orchestrator-prompt.md` (or wherever you track waves).
2. Search for every `{{placeholder}}` and replace with your specifics.
3. Paste everything between the outer ``` fences into a fresh Claude Code session.
4. Remove this header before committing.

---

```
You are the orchestrator for Wave {{N}} of the {{PROJECT_NAME}} implementation
plan. The project is at {{ABSOLUTE_PROJECT_PATH}} on the `{{BASE_BRANCH}}` branch.
{{PREVIOUS_WAVES_STATUS}}. Your job is to execute the five-phase multi-agent
protocol: pre-flight, infrastructure setup, dispatch, integration, and
deliverables.

Wave {{N}} builds {{ONE_SENTENCE_WAVE_GOAL}}. By the end of Wave {{N}}, {{USER_VISIBLE_OUTCOME}}.

{{WAVE_CONTEXT_PARAGRAPH}}
  — what already exists
  — what Wave N produces
  — why it matters in the overall plan

=============================================================================
MANDATORY READING (do this BEFORE anything else, in parallel where possible)
=============================================================================

Read these files. Do not skip any of them. They are not optional.

Project context:
  - CLAUDE.md — especially any sections called out as non-negotiable
  - {{PROJECT_PLAN_FILE}} — look for "Wave {{N}}" and any "Multi-Agent" section
  - docs/phase-summaries/wave-0-*.md through wave-{{N-1}}-*.md (if they exist)

Failure-mode catalog (read every post-mortem before any wave):
  - docs/post-mortems/*.md — these are your "don't repeat these mistakes" list
  - Pay special attention to any post-mortem mentioning:
    * mock.module cross-file bleed
    * bundler / node: API leaks into client code
    * timestamp/unit drift between server and client
    * schema/type drift between agents
    * worktree tool config conflicts (biome, tsc)

Concrete patterns you will leverage from existing code:
  {{LIST_KEY_REFERENCE_FILES}}
  — for each, note what the agent will learn from reading it

Existing shared infrastructure (use, don't duplicate):
  {{LIST_OF_HELPERS_THAT_ALREADY_EXIST}}
  e.g., scripts/agent/verify.sh, src/shared/testing/render-with-providers,
        globalThis.__realFeatures preload, etc.

=============================================================================
PHASE A — PRE-FLIGHT INTEGRATION ANALYSIS
=============================================================================

This phase is REQUIRED. Skipping it causes integration failures. Spend 5–10
minutes thinking before dispatching anything.

Run baseline verification first to confirm the base branch is green:
  bash scripts/agent/verify.sh all
Expect {{EXPECTED_TEST_COUNT}} tests passing and {{EXPECTED_LINT_CLEAN_COUNT}}
files lint clean. If baseline is red, stop and fix before proceeding.

Then write a one-page pre-flight note (in your scratchpad — not committed)
enumerating the cross-cutting risks for Wave {{N}} specifically.

Cross-cutting risks to predict before dispatching agents:

  1. **Shared module contracts.** Which files do multiple agents import from?
     (Usually feature index files, shared test utilities, shared types.) For
     each, confirm the contract is stable and documented in the preamble.

  2. **Test-mock patterns.** Agents writing tests that mock the same module
     will clobber each other unless you use a shared seed pattern (e.g.,
     globalThis.__realFeatures spread). Pick the pattern, put it in the
     preamble as MUST, never should.

  3. **Client/server boundary.** If your project has a Next.js client/server
     split, which modules are safe to import on each side? Agents who blow
     this produce bundler errors at integration time. Preamble must state:
     "Client components MUST NOT import from @/features/X (which pulls in
     @/core/logging which uses node:async_hooks). Use @/features/X/models
     or @/features/X/schemas instead."

  4. **Unit drift.** Timestamps in milliseconds vs seconds. Lat/lng string vs
     number. Color hex vs RGB array. If two agents pick differently, nothing
     renders and there's no error. Name the canonical unit in the preamble.

  5. **Error handling conventions.** When an agent hits an external failure
     (a 503, a parse error, a missing record), does it retry, skip, or fail
     the batch? Pick one pattern and put it in the preamble.

  6. **Idempotency.** If the agent's code runs twice on the same input, what
     happens? (Duplicate rows? No-op? Upsert?) Spell this out.

  7. **Dependencies not yet installed.** Which packages does each agent need?
     Phase B installs them once on main so agents start with a good base.

  8. **Shared test infrastructure.** What preload patterns, test helpers, or
     global setup do agents need? Build in Phase B, not by each agent.

  9. **Style conventions that Biome/ESLint will enforce.** List them in the
     preamble explicitly so agents don't waste cycles on lint fixes:
     - No `any`, no console.log, no .forEach, no default exports (except pages)
     - All type imports use `import type { ... }`
     - Zod from `zod/v4` (or whatever your project uses)
     - Strict mode null handling

 10. **Command structure / permission friction.** Remind the agent that
     chaining commands across tool prefixes (`cd /path && bun run lint`)
     prompts the user every time. Use helper scripts or absolute paths.

Write down YOUR pre-flight note covering these risks (and any Wave {{N}}-
specific ones) BEFORE moving to Phase B. This is the single highest-leverage
step in the whole workflow.

=============================================================================
PHASE B — INTEGRATION INFRASTRUCTURE SETUP
=============================================================================

For every risk identified in Phase A, build the shared scaffolding IN THE
BASE BRANCH and commit BEFORE dispatching agents. Concretely:

B.1 — Install shared dependencies
  bun add {{new dep 1}} {{new dep 2}}
  bun add -d {{new dev dep}}
  Commit: "chore(deps): add {{deps}} for wave {{N}}"

B.2 — Scaffold shared utilities or test helpers
  For each cross-cutting concern from Phase A, create the file on main with
  a minimal correct implementation and at least one unit test. Agents will
  import from these files from day one.

  Examples (pick the ones that match your wave):
    - src/shared/types/{{name}}.ts — shared type that multiple slices use
    - src/shared/testing/{{helper}}.ts — test utility that prevents mock bleed
    - src/shared/utils/{{helper}}.ts — runtime helper (e.g., unit converters)
    - src/{{feature}}/index.ts — stub export signatures so dependent slices compile

B.3 — Add package.json scripts for runnable entry points
  Every new runnable (script, scraper, migration, cron entry) gets a
  package.json script line so agents invoke them via `bun run X`, which is
  already approved by `Bash(bun run:*)`.

B.4 — Verify the scaffold compiles and passes baseline
  bash scripts/agent/verify.sh all
  Test count must not drop. Lint must be clean. If either fails, fix before
  dispatching agents.

B.5 — Commit Phase B work to the base branch
  Single conventional commit. HEREDOC body listing what scaffolds were
  added and why. This commit MUST land before any agent dispatches — agents
  will rebase off it.

=============================================================================
PHASE C — DISPATCH PARALLEL WORKTREE AGENTS
=============================================================================

C.1 — Create tasks for every agent + one integration task
  Create N+1 tasks via TaskCreate:
    - "Agent {{N}}A: {{name}}"
    - "Agent {{N}}B: {{name}}"
    - "Agent {{N}}C: {{name}}"
    ...
    - "Integrate Wave {{N}} worktrees into main"
  Set the integration task as blockedBy the agent tasks.

C.2 — Dispatch all agents in ONE message
  Single assistant turn with multiple Agent tool calls. Each uses:
    subagent_type: "general-purpose"
    isolation: "worktree"
  Mark each task as in_progress when dispatching.

C.3 — Each agent prompt = shared preamble + slice-specific section
  The shared preamble is the contract. Every MUST in the preamble becomes
  a non-negotiable rule for the agent. If you're not sure whether to use
  "should" or "MUST," use MUST — ambiguity causes integration failures.

-----------------------------------------------------------------------------
SHARED PREAMBLE (paste into each agent prompt, then append slice details)
-----------------------------------------------------------------------------
You are executing a slice of Wave {{N}} of the {{PROJECT_NAME}} implementation.
You are running in an isolated git worktree. Branch is already created.
Working directory is a clean copy of the base branch. Do not touch files
outside your assigned scope.

Before writing any code, read:
  - CLAUDE.md — style rules, commit workflow, lint/typecheck/test discipline
  - {{PROJECT_PLAN_FILE}} — Wave {{N}} section
  - Shared infrastructure created in Phase B:
    {{LIST_PHASE_B_FILES}}
  - Reference implementations from prior waves:
    {{LIST_REFERENCE_FILES}}

STEP 0 — verify your worktree base BEFORE writing any code:
  git log -1 --oneline             # confirm base commit
  pwd                              # confirm you're in a worktree
  ls {{PHASE_B_FILE_1}}            # confirm scaffolds exist
  ls {{PHASE_B_FILE_2}}
All must succeed. If any fails, stop and tell the orchestrator.

NON-NEGOTIABLE RULES (copy from your project's CLAUDE.md + Phase A concerns):

  1. {{architectural constraint — e.g., feature slice boundaries}}
  2. {{import discipline — e.g., client vs server imports}}
  3. {{test infrastructure — how to mock without cross-file bleed}}
  4. {{unit conventions — e.g., timestamps in ms not seconds}}
  5. {{error handling pattern — retry/skip/fail}}
  6. {{idempotency contract}}
  7. Biome/lint rules: no `any`, no console.log, no .forEach, no default
     exports in non-page files. Use `import type { ... }` for type-only.
  8. {{Zod version — e.g., import from zod/v4 not zod}}
  9. Commands: never chain across tool prefixes. Use `bash scripts/agent/
     verify.sh`, `git -C /absolute/path subcommand`, absolute paths for tsc.
 10. After finishing, run in the worktree:
       bash scripts/agent/verify.sh all
     All checks must pass. If any fails, fix and re-run until green.
 11. Commit your work to the worktree branch with a conventional commit
     message using a HEREDOC body. Include Co-Authored-By trailer.
 12. Do NOT push. Do NOT merge. Do NOT touch main. Just commit on your
     worktree branch and return a summary.

Report back in your final message:
  - List of files created/modified
  - Test counts before → after
  - Any new exports to shared modules (orchestrator will audit)
  - Any surprises, deferred items, or warnings for the orchestrator
    (**this section is critical** — the orchestrator will act on warnings
    BEFORE running the integration test suite)
-----------------------------------------------------------------------------

AGENT {{N}}A — {{slice name}}
-----------------------------------------------------------------------------
[paste shared preamble above]

Your scope: {{list of files you own}}

Your task: {{specific deliverable}}

{{detailed behavior spec — what the code should do, what it should not do,
where it sits in the architecture, what it imports from}}

Tests:
  - {{test file path}}
  - {{fixtures or mocks needed}}
  - Coverage target: {{specific assertions}}

Watch out for:
  - {{slice-specific gotchas that the orchestrator predicts}}
-----------------------------------------------------------------------------

AGENT {{N}}B — {{slice name}}
-----------------------------------------------------------------------------
[paste shared preamble above]

Your scope: ...

{{repeat structure for each agent}}

-----------------------------------------------------------------------------

=============================================================================
PHASE D — INTEGRATION
=============================================================================

When agents return:

D.1 — Read EVERY "surprises / concerns" section FIRST.
  This is the most important step in the integration phase. Integration
  failures repeatedly come from skipping this step and running tests
  without auditing the warnings.

  For each warning:
    - Audit the OTHER agents' work for the same concern
    - If an agent says "I added helper X to shared/Y", check if any other
      agent's code would benefit (and verify no collision)
    - If an agent says "I worked around Z; you may hit it at integration,"
      treat that as a prediction to act on BEFORE running tests

D.2 — Predict cross-cutting issues for this wave
  Common failure modes:
    - Two agents both adding to the same shared file (filename or
      function name collision)
    - One agent added an export another agent named differently
    - Test fixtures with conflicting paths
    - New env var that doesn't match existing env schema shape
  Fix at integration, and add prevention back to next wave's Phase B
  in your failure-mode catalog.

D.3 — Apply changes via per-file checkout (not merge)
  For each agent worktree, identify changed files:
    git -C {{PROJECT_ROOT}} diff main..worktree-agent-XXX --name-status
  Then apply each file:
    git -C {{PROJECT_ROOT}} checkout worktree-agent-XXX -- <file1> <file2>...
  Stage all agents' changes alongside each other on main. Do NOT use
  `git merge` — per-file checkout gives a clean stage to squash.

D.4 — Run full verification on main
  bash scripts/agent/verify.sh all
  Read failures carefully:
    - Trivial (one-line type patch) → fix in place
    - Structural (two agents wrote conflicting helpers) → fix at root,
      AND add prevention to next wave's failure-mode catalog

D.5 — Keep worktrees alive until main is verified clean
  Agents' worktrees are your rollback path. Don't remove them until the
  integration commit is good and tests pass.

D.6 — Squash commit on main
  Single conventional commit covering all agents' work, with a detailed
  HEREDOC body that lists files changed grouped by agent. Include the
  Co-Authored-By trailer.

D.7 — Clean up worktrees AFTER the integration commit lands
  git -C {{PROJECT_ROOT}} worktree remove .claude/worktrees/agent-...
  git -C {{PROJECT_ROOT}} branch -D worktree-agent-...
  Do this for every agent.

=============================================================================
PHASE E — POST-PHASE DELIVERABLES
=============================================================================

Three deliverable files MUST be written before declaring the wave done.
Skipping any of them leaves debt that compounds across waves.

E.1 — Phase summary
  Write docs/phase-summaries/wave-{{N}}-{{name}}.md following the format of
  prior summaries:
    - What was built (grouped by agent)
    - Verification results (lint, typecheck, test counts)
    - Smoke-test results (manually verify the user-visible behavior works)
    - Manual/human actions required (env vars, DB migrations, etc.)
    - Known issues / deferred items
    - Suggested next steps

E.2 — Permission audit (DO IT FOR REAL)
  Read .claude/settings.local.json directly. Look for new exact-string
  entries at the bottom of the `allow` array. For each:
    - Can it be replaced by a wildcard?
    - Is the command safe to wildcard?
    - Is it already covered?
  Document findings in docs/suggested-permissions-update.md as a new
  "Wave {{N}}" section. Even if the answer is "None — all existing
  permissions were sufficient," you MUST first read the file to verify.
  Do NOT write that line from memory.
  Optionally invoke the update-config skill to apply wildcards.

E.3 — Post-mortem (only if integration required more than a trivial fix)
  If Phase D required a structural fix or shared infrastructure change,
  write docs/post-mortems/wave-{{N}}-{{topic}}.md:
    - Timeline
    - What went wrong
    - Root causes
    - Impact
    - What we changed (process + code)
    - Lessons (added to the failure-mode catalog)
  Then UPDATE the failure-mode catalog in your implementation plan.

E.4 — Commit the docs
  Single commit: `docs: Wave {{N}} phase summary, permission audit[, post-mortem]`
  HEREDOC body listing files changed.

E.5 — Mark all tasks completed
  TaskUpdate integration + agent tasks as completed.

E.6 — Final report to user
  Brief summary including:
    - Number of slices shipped
    - Test count delta (prior → now)
    - Manual verification results
    - What's unblocked for the next wave

=============================================================================
GOTCHAS FROM PRIOR WAVES (read before starting)
=============================================================================

This section is where you list your project's recurring failure modes. Every
wave, if something goes wrong, capture it here so future waves don't repeat
it.

Examples from your-project (remove, replace with your own):

From Wave 2:
  - mock.module is process-global in Bun. Test A mocking @/features/X
    with a subset broke Test B that imported the full @/features/X.
    Fix: globalThis.__realFeatures preload pattern in testing-library.ts.

From Wave 3:
  - Agent warnings were read-but-ignored. Integration failed on the exact
    concerns the agent flagged. Fix: Phase D.1 now says "read warnings first,
    audit other agents' work for the same concern."

From Wave 4:
  - `cd /path && command` chains caused ~15 permission prompts.
    Fix: helper scripts under scripts/agent/ that do cd internally.

From Wave 5:
  - Timestamps on the wire were Unix seconds; client code stored ms.
    Deck.gl TripsLayer rendered nothing (off by 1000x factor).
    Fix: preamble now names the canonical unit as MUST.

=============================================================================
EXECUTION ORDER SUMMARY
=============================================================================

1. MANDATORY READING (CLAUDE.md, plan, post-mortems, summaries, patterns)
2. PHASE A: pre-flight note in scratchpad (5–10 min)
3. PHASE B: install deps + scaffold shared infrastructure + commit to main
4. PHASE C: TaskCreate N+1 tasks, dispatch agents in parallel (single msg)
5. PHASE D: integrate (read warnings first, apply files, verify, squash)
6. PHASE E: phase summary + permission audit + (maybe) post-mortem +
   commit docs + mark tasks complete + final report

Begin with the mandatory reading. Do NOT skip Phase A or Phase B.
```

---

## Template Customization Checklist

Before using this in a new project, fill in:

- [ ] `{{PROJECT_NAME}}` — human-readable project name
- [ ] `{{ABSOLUTE_PROJECT_PATH}}` — e.g., `/Users/eric/code/my-app`
- [ ] `{{BASE_BRANCH}}` — usually `main`
- [ ] `{{N}}` — the wave number
- [ ] `{{PROJECT_PLAN_FILE}}` — where your implementation plan lives
- [ ] `{{PREVIOUS_WAVES_STATUS}}` — which waves are already done
- [ ] `{{ONE_SENTENCE_WAVE_GOAL}}` — what this wave delivers
- [ ] `{{USER_VISIBLE_OUTCOME}}` — what the user will see when done
- [ ] `{{WAVE_CONTEXT_PARAGRAPH}}` — what exists, what's new, why it matters
- [ ] `{{LIST_KEY_REFERENCE_FILES}}` — files agents should read for patterns
- [ ] `{{LIST_OF_HELPERS_THAT_ALREADY_EXIST}}` — pre-existing shared infra
- [ ] `{{EXPECTED_TEST_COUNT}}` — baseline test count
- [ ] `{{EXPECTED_LINT_CLEAN_COUNT}}` — baseline file count
- [ ] `{{PHASE_B_FILE_N}}` — files created in Phase B
- [ ] `{{LIST_REFERENCE_FILES}}` — per-agent reading list
- [ ] Agent sections — one per slice, with scope, behavior, tests, gotchas

---

## Adapting to Non-TypeScript Projects

The 5-phase protocol is language-agnostic. Swap:

- `bun run` → your language's runner (`cargo`, `go`, `pnpm`, `pip`, etc.)
- `bunx biome` → your linter
- `npx tsc --noEmit` → your typechecker (`cargo check`, `go vet`, `mypy`, etc.)
- `bun test` → your test runner
- `import type { ... }` rule → your language's equivalent

The integration-as-a-concern principle (Phase A + Phase B) stays the same: predict the cross-cutting risks, build the shared scaffolding, then dispatch.

---

## Anti-Patterns (things this template specifically avoids)

1. **"Write code first, integrate later."** Agents in isolation cannot see each other's work. Without Phase A + B, integration failures are guaranteed.

2. **"Ship preamble as guidelines, not contract."** "Should use the logging helper" → half the agents do, half don't, now you have two logging styles. Use MUST.

3. **"Single big agent does everything."** Loses parallelism, no worktree isolation, one failure poisons everything.

4. **"Skip the permission audit because it feels fine."** Friction compounds across waves. A 10-minute audit saves an hour later.

5. **"Remove worktrees before verifying integration."** Rollback path is gone. Keep them until main is green.

6. **"Chain commands to save tool calls."** Save the user's time (permission prompts) over Claude's (tool-call overhead). Use helper scripts.
