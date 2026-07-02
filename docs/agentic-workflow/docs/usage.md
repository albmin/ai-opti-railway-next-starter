# Usage Guide

How to invoke the workflow and — concretely — what happens for the three shapes of work you'll throw at
it most: a **huge feature buildout**, a **small bugfix**, and a **punch-list of changes**.

## Invocation

```
/orchestrate <free-form work>
```

The argument can be:
- a sentence/paragraph describing intent ("build the notifications feature"),
- a path to a plan/spec file ("`/orchestrate docs/plans/notifications.md`"),
- a markdown punch-list, or
- a question ("where do we handle token refresh?").

In an autonomous harness (OpenClaw), pass the same string as the run prompt. The workflow executes
end-to-end with **no prompts**, writes a decision log to `.agentic-workflow/runs/<slug>.md`, runs the
project's checks, commits, and returns a run summary. It only declines (skips + flags) genuinely
destructive/irreversible outward actions — see the safety floor in `skills/orchestrate/SKILL.md`.

### What makes a run effective (inputs that help)

You don't need much, but these sharpen results:
- **The goal, not the steps.** "Users should get an email + in-app toast when a load is booked" beats
  "add a row to notifications and call sendEmail".
- **Any hard constraints.** "must work offline", "no new dependencies", "keep the existing API shape".
- **Where you've seen it** (for bugs): the symptom, a repro, a file or screen if you know it.
- **A plan/spec file** if you already have one — the workflow will audit and execute it rather than
  re-deriving.

The workflow fills the rest by reading `CLAUDE.md`, detecting the stack, and exploring the code.

---

## Example 1 — Huge feature buildout (→ heavy path)

**You pass:**
```
/orchestrate Build end-to-end "saved searches": users can save a load-search with filters,
see a list of their saved searches, get a daily email digest of new matches, and one-click
re-run a saved search. Include the data model, API, UI, and the digest job.
```

**What happens:**

1. **Learn the project** — reads `CLAUDE.md`, finds the package manager and the real
   `lint/typecheck/test/build` commands, notes the feature-slice architecture.
2. **Strategy gate** — nature `HYBRID`, size `DECIDE-AFTER-PLAN`. At high effort it spawns one
   `aw-analyze` strategy call, then `aw-explore` ×4 in parallel (existing search code, data layer,
   email/job infra, UI patterns).
3. **Plan** — `aw-plan` produces a file-level plan whose **slice map** shows four independent,
   file-owning slices: `model+migration`, `API endpoints`, `UI`, `digest job`. ≥2 independent slices ⇒
   **heavy path**.
4. **Pre-flight (Phase A)** — predicts cross-cutting risks: the shared `SavedSearch` type and the
   filter-serialization format both slices touch; timestamp units for "new since"; the job/API sharing
   a query helper. Confirms a green baseline.
5. **Scaffold first (Phase B)** — creates the shared `SavedSearch` type, the filter (de)serialize
   helper, and stub export signatures, **commits them to the base branch** so every slice compiles
   against a stable contract.
6. **Dispatch (Phase C)** — spawns four `aw-execute` agents in one message, each `isolation:"worktree"`,
   each with the shared preamble (the non-negotiable contract) + its slice spec. They work in parallel,
   verify in their worktrees, and commit to their slice branches.
7. **Integrate (Phase D)** — reads every slice's **"surprises/concerns" first** (e.g. "I exported
   `parseFilters`; the API slice may have its own"), audits for collisions, applies changes per-file,
   runs full `lint/typecheck/test/build`, fixes a trivial type mismatch, squash-commits.
8. **Review + finish** — an integration-lens `aw-review` passes; writes the run summary + a one-paragraph
   post-mortem (the duplicate-helper near-miss → folded into next run's pre-flight list); opens a PR.

**You get back:** a single squashed commit / PR, green checks with before→after test counts, the
decision log, and "what's unblocked next".

---

## Example 2 — Small bugfix (→ light path)

**You pass:**
```
/orchestrate Bug: the load-search results show prices ~1000x too high since last week.
Probably a units thing in the price formatter or the API mapper.
```

**What happens:**

1. **Learn the project** (commands, conventions).
2. **Strategy gate** — nature `EXECUTION`, size `LIGHT`. No worktrees, no integration phase.
3. **Locate** — one or two `aw-explore` agents trace the price path: API mapper → DTO → formatter.
   One-line answer: "API now returns cents; formatter still divides as if dollars."
4. **Execute** — `aw-execute` makes the minimal fix in the mapper (the canonical place), matches
   surrounding style, adds/updates a unit test pinning cents→display.
5. **Verify** — runs `<test>` (the relevant file) + `<lint>` + `<typecheck>`; green.
6. **Finish** — commits with a conventional message; short run summary noting the root cause and the
   test that now guards it. (Review gate is light or skipped for a change this mechanical.)

**You get back:** a focused commit, a regression test, and a one-paragraph explanation of the actual
cause (not just the symptom).

---

## Example 3 — Punch-list of changes (→ light path, batched)

**You pass:**
```
/orchestrate Work through these:
- Rename `useUserData` → `useUser` and update call sites
- Add empty-state copy to the saved-searches list
- Fix the typo in the footer ("Recieve" → "Receive")
- Bump the request timeout from 10s to 30s in the API client
- Add aria-labels to the icon buttons in the toolbar
```

**What happens:**

1. **Learn the project**, then **parse the list** into 5 discrete items.
2. **Strategy gate** — each item is `EXECUTION` / `LIGHT`. The orchestrator checks independence and
   file overlap: the rename touches many call sites (its own slice); the others are disjoint and tiny.
3. **Batch** — independent, disjoint items run as **parallel `aw-execute` agents** in one message; the
   rename runs on its own (it spans many files). Items that *did* share a file would be serialized or
   worktree-isolated; here they don't.
4. **Per-item verification** — each agent runs the relevant checks. The workflow tracks each item's
   status in the decision log and **keeps going past any single failure** (e.g. if the aria-label item
   hit a flaky test, it's recorded, not fatal).
5. **Finish** — one commit (or one per logical group), a status table for all five items
   (done / partial / skipped + why), and the run summary.

**You get back:** a checklist resolved in parallel, with a clear per-item status — including honest
reporting on anything that didn't land.

---

## Reading the output

Every run ends with a **run summary** and a **decision log** (`.agentic-workflow/runs/<slug>.md`). The
log is the audit trail for an unattended run: the strategy it chose, each assumption it made when the
request was ambiguous, any blockers it skipped (and the safest assumption it proceeded under), and the
final verification numbers. If something came out wrong, the log tells you *where the workflow guessed*
— which is exactly where to correct it and re-run.

## Tuning a run

- **Effort** — set via your `/effort` (or harness equivalent). Higher effort ⇒ more parallel agents,
  more research, more review iterations/perspectives. This is the main dial.
- **Model tiering** — off by default; opt in per role by editing `model:` in `agents/aw-*.md`
  (see README → "Model tiering").
- **Force a path** — you can hint in the prompt ("just answer, don't change anything" → exploration;
  "this is a big feature, expect parallel slices" → heavy), but the strategy gate will usually classify
  correctly on its own.
