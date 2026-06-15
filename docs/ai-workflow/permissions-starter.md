# Claude Code Permissions Starter Kit

**Purpose:** A drop-in `.claude/settings.local.json` starter plus rationale for every entry, designed to maximize agent autonomy on Next.js / TypeScript / Bun projects while keeping destructive blast radius local and reversible.

**How to use:**

1. Copy the "Full starter file" below into `.claude/settings.local.json` at the root of a new project.
2. Read the "Permission categories" section so you understand what each wildcard covers.
3. Keep a `docs/suggested-permissions-update.md` file (template at the bottom) where future waves log any new wildcards they need. This is the feedback loop.

**Why this matters:** In the your-project project, Wave 0 had ~5 prompts, Wave 4 had ~15–25 prompts (chained-command regression), Wave 5 onward had ~0 prompts. The delta was the allow list + helper scripts maturing. Starting a new project with the mature list saves ~20 prompts of setup friction.

---

## Full Starter File

Drop this into `.claude/settings.local.json`:

```json
{
  "permissions": {
    "allow": [
      "Bash(bun run:*)",
      "Bash(bun add:*)",
      "Bash(bun remove:*)",
      "Bash(bun test:*)",
      "Bash(bun install:*)",
      "Bash(bun -e:*)",
      "Bash(bunx:*)",
      "Bash(npx:*)",
      "Bash(node:*)",

      "Bash(git:*)",
      "Bash(git add:*)",
      "Bash(git commit:*)",
      "Bash(gh:*)",

      "Bash(ls:*)",
      "Bash(mkdir:*)",
      "Bash(rm:*)",
      "Bash(rmdir:*)",
      "Bash(cp:*)",
      "Bash(mv:*)",
      "Bash(touch:*)",
      "Bash(cat:*)",
      "Bash(head:*)",
      "Bash(tail:*)",
      "Bash(wc:*)",
      "Bash(which:*)",
      "Bash(pwd:*)",
      "Bash(cd:*)",
      "Bash(tree:*)",
      "Bash(open:*)",
      "Bash(echo:*)",
      "Bash(printf:*)",

      "Bash(grep:*)",
      "Bash(rg:*)",
      "Bash(find:*)",
      "Bash(sed:*)",
      "Bash(awk:*)",
      "Bash(tr:*)",
      "Bash(cut:*)",
      "Bash(sort:*)",
      "Bash(uniq:*)",
      "Bash(diff:*)",
      "Bash(xargs:*)",
      "Bash(jq:*)",

      "Bash(env:*)",
      "Bash(printenv:*)",
      "Bash(date:*)",
      "Bash(basename:*)",
      "Bash(dirname:*)",
      "Bash(realpath:*)",
      "Bash(stat:*)",
      "Bash(file:*)",
      "Bash(tee:*)",

      "Bash(pkill:*)",
      "Bash(kill:*)",
      "Bash(ps:*)",
      "Bash(sleep:*)",

      "Bash(md5:*)",
      "Bash(md5sum:*)",
      "Bash(shasum:*)",
      "Bash(sha256sum:*)",

      "Bash(curl:*)",

      "Bash(docker:*)",
      "Bash(docker compose:*)",
      "Bash(railway:*)",

      "Bash(bash:*)",
      "Bash(for:*)",
      "Bash(while:*)",
      "Bash(if:*)",
      "Bash(true:*)",
      "Bash(false:*)",
      "Bash(test:*)",

      "Bash(python3 -m json.tool)",
      "Bash(python3 -c ':*)",

      "WebSearch",
      "WebFetch",

      "mcp__shadcn__search_items_in_registries",
      "mcp__shadcn__list_items_in_registries",
      "mcp__shadcn__view_items_in_registries",
      "mcp__shadcn__get_item_examples_from_registries",
      "mcp__shadcn__get_add_command_for_items",
      "mcp__shadcn__get_audit_checklist",
      "mcp__shadcn__get_project_registries",

      "Skill(update-config)"
    ]
  }
}
```

---

## Permission Categories — What Each Entry Does and Why

### 1. Bun toolchain (9 entries)

| Entry                 | Purpose                                                                                                                                     | Added when                           |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| `Bash(bun run:*)`     | Runs any script from `package.json` (dev, build, lint, test, db:migrate, scraper:all, etc.)                                                 | Wave 0 — project init                |
| `Bash(bun add:*)`     | Install production or dev dependencies                                                                                                      | Wave 0                               |
| `Bash(bun remove:*)`  | Remove dependencies                                                                                                                         | Wave 0                               |
| `Bash(bun test:*)`    | Run the test suite (with optional args like `--watch` or a path filter)                                                                     | Wave 0                               |
| `Bash(bun install:*)` | Install from lockfile                                                                                                                       | Wave 0                               |
| `Bash(bun -e:*)`      | Run inline TypeScript expressions (useful for parsing JSON in shell pipelines: `curl ... \| bun -e 'const d = ...; console.log(d.length)'`) | Wave 2 — smoke testing API endpoints |
| `Bash(bunx:*)`        | Run one-off binaries from npm (biome, shadcn add, etc.)                                                                                     | Wave 0                               |
| `Bash(npx:*)`         | Same for npm-registered binaries that aren't Bun-native (e.g., `tsc --noEmit`)                                                              | Wave 0                               |
| `Bash(node:*)`        | Escape hatch for any Node-specific script                                                                                                   | Wave 0                               |

**Rationale:** These cover 95% of Bun / Node / TypeScript workflows. `bun run:*` alone handles anything in `package.json`, so adding new scripts there (instead of inline commands) is the single most effective way to stay permission-free.

### 2. Git + GitHub (4 entries)

| Entry                | Purpose                                                                               | Added when |
| -------------------- | ------------------------------------------------------------------------------------- | ---------- |
| `Bash(git:*)`        | All git operations: status, diff, log, add, commit, branch, checkout, worktree, reset | Wave 0     |
| `Bash(git add:*)`    | Explicit alias for readability in the allow list                                      | Wave 0     |
| `Bash(git commit:*)` | Explicit alias                                                                        | Wave 0     |
| `Bash(gh:*)`         | GitHub CLI — PR creation, issue management, workflow triggers                         | Wave 0     |

**Rationale:** `git:*` covers everything. `gh:*` is for any GitHub API interaction. Use `git -C /absolute/path` in agent worktrees rather than `cd /path && git ...` — the `-C` flag keeps the whole invocation as `git ...` which matches the wildcard.

### 3. File manipulation basics (15 entries)

| Entry                                                                   | Purpose                                                                | Added when      |
| ----------------------------------------------------------------------- | ---------------------------------------------------------------------- | --------------- |
| `ls`, `mkdir`, `rm`, `rmdir`, `cp`, `mv`, `touch`, `cd`, `tree`, `open` | Standard filesystem operations                                         | Wave 0          |
| `cat`, `head`, `tail`, `wc`                                             | Reading files (prefer `Read` tool, these are for shell pipelines)      | Wave 0          |
| `which`, `pwd`                                                          | Environment introspection                                              | Wave 0          |
| `echo`, `printf`                                                        | Shell output (`printf` added Wave 2 — `echo:*` doesn't match `printf`) | Wave 0 + Wave 2 |

**Rationale:** File manipulation is table stakes. `rm:*` is a calculated risk — scoped to the project tree, local filesystem only, reversible via git for tracked files. If you're doing security-sensitive work and want tighter scoping, replace `Bash(rm:*)` with `Bash(rm -rf:*)` or `Bash(rm:./*)` but expect more prompts.

### 4. Text processing (12 entries)

| Entry                     | Purpose                                              | Added when |
| ------------------------- | ---------------------------------------------------- | ---------- |
| `grep`, `rg`              | Search (prefer the `Grep` tool, these are fallbacks) | Wave 0     |
| `find`                    | File search (prefer `Glob` tool)                     | Wave 0     |
| `sed`, `awk`, `tr`, `cut` | Line editing in pipelines                            | Wave 0     |
| `sort`, `uniq`, `diff`    | Sorting/diffing                                      | Wave 0     |
| `xargs`, `jq`             | Pipeline plumbing and JSON extraction                | Wave 0     |

**Rationale:** These are for shell one-liners that the dedicated Claude Code tools (Read, Edit, Grep, Glob) can't do elegantly. Prefer the tools; use these as escape hatches. `jq` is especially common for parsing curl output in smoke tests.

### 5. Environment + introspection (9 entries)

| Entry                             | Purpose                              | Added when |
| --------------------------------- | ------------------------------------ | ---------- |
| `env`, `printenv`                 | Read environment variables           | Wave 0     |
| `date`                            | Timestamps (e.g., for log filenames) | Wave 0     |
| `basename`, `dirname`, `realpath` | Path manipulation                    | Wave 0     |
| `stat`, `file`                    | File metadata                        | Wave 0     |
| `tee`                             | Dual-write to file and stdout        | Wave 0     |

**Rationale:** Read-only introspection. Zero risk.

### 6. Process management (4 entries)

| Entry           | Purpose                                                                                     | Added when |
| --------------- | ------------------------------------------------------------------------------------------- | ---------- |
| `Bash(pkill:*)` | Kill processes by name (essential for cleaning up background dev servers after smoke tests) | Wave 2     |
| `Bash(kill:*)`  | Kill processes by PID                                                                       | Wave 2     |
| `Bash(ps:*)`    | List processes                                                                              | Wave 2     |
| `Bash(sleep:*)` | Wait for a process to start (e.g., `sleep 8 && curl http://localhost:3000`)                 | Wave 2     |

**Rationale:** Added when smoke testing needed to start/kill dev servers. Mildly destructive (kills processes) but scoped to the local machine. Tighter alternative: `Bash(pkill -f bun:*)` + `Bash(pkill -f next:*)` — but the wildcards are simpler and the blast radius is limited to your own process table.

### 7. Checksums (4 entries)

| Entry                                  | Purpose                                          | Added when                                                        |
| -------------------------------------- | ------------------------------------------------ | ----------------------------------------------------------------- |
| `md5`, `md5sum`, `shasum`, `sha256sum` | File integrity checks and byte-level comparisons | Wave 3 — verifying worktree files against main during integration |

**Rationale:** Useful for debugging "did this file actually change?" during multi-agent integration. Low risk, read-only.

### 8. HTTP (1 entry)

| Entry          | Purpose                                           | Added when |
| -------------- | ------------------------------------------------- | ---------- |
| `Bash(curl:*)` | Smoke test API endpoints, probe external services | Wave 0     |

**Rationale:** Essential for verifying the dev server is up or probing third-party APIs. Low risk.

### 9. Shell control flow (7 entries)

| Entry                                         | Purpose                                                                                                               | Added when |
| --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | ---------- |
| `Bash(bash:*)`                                | Run a shell script or heredoc. This is the wildcard that makes `bash scripts/agent/verify.sh` work without prompting. | Wave 0     |
| `for`, `while`, `if`, `true`, `false`, `test` | Shell control-flow builtins for one-line scripts like `for f in a b c; do ... done`                                   | Wave 3     |

**Rationale:** `bash:*` is the critical one. It covers any heredoc and any `bash script.sh` invocation. Pairs with helper scripts under `scripts/agent/*.sh` to eliminate the chained-command problem (see orchestrator template, Phase B).

### 10. Python escape hatches (2 entries)

| Entry                        | Purpose                                         | Added when |
| ---------------------------- | ----------------------------------------------- | ---------- |
| `Bash(python3 -m json.tool)` | Pretty-print JSON on stdin                      | Wave 0     |
| `Bash(python3 -c ':*)`       | Run inline Python — rarely needed, escape hatch | Wave 0     |

**Rationale:** Sometimes `jq` isn't enough. Keep narrow.

### 11. Web tools (2 entries)

| Entry       | Purpose                                                             |
| ----------- | ------------------------------------------------------------------- |
| `WebSearch` | Search the web for documentation, release notes, Stack Overflow     |
| `WebFetch`  | Fetch and parse a specific URL (e.g., the Next.js 16 upgrade guide) |

### 12. MCP servers (7 entries)

| Entry            | Purpose                                                         |
| ---------------- | --------------------------------------------------------------- |
| `mcp__shadcn__*` | All shadcn MCP tools for finding, inspecting, adding components |

**Add any project-specific MCP servers here too.** Attio, Gmail, Slack, Linear, etc.

### 13. Skills (1 entry)

| Entry                  | Purpose                                                                           |
| ---------------------- | --------------------------------------------------------------------------------- |
| `Skill(update-config)` | Allows Claude to propose updates to settings.json without prompting for each diff |

---

## The Chained-Command Rule (Most Important)

Claude Code matches compound shell expressions (`A && B && C`) as a single string against prefix wildcards. So `cd /path && bun run lint` does **not** match `Bash(cd:*)` or `Bash(bun run:*)` — it only matches `Bash(cd /path && bun run lint)`, which isn't in your allow list.

**Consequences:**

- Never write `cd /path && command` in a tool call. Ever.
- Separate into two tool calls, OR put the operation in a script under `scripts/agent/`.
- Use `git -C /absolute/path subcommand` instead of `cd /path && git subcommand`.

**Helper scripts you should create on day one (copy from your-project):**

```
scripts/agent/
├── README.md              # index of what each script does
├── verify.sh              # lint + typecheck + test, with flags: all/lint/lint-fix/typecheck/test
├── test-single.sh         # bun test <path>
├── test-multi.sh          # bun test <path1> <path2> ...
├── smoke-dev.sh           # start dev server, curl /, kill server
└── verify-db-setup.ts     # DB connection check (project-specific)
```

All scripts do their own `cd` internally. Every invocation matches `Bash(bash:*)` — zero prompts.

---

## Feedback Loop — `docs/suggested-permissions-update.md`

Every implementation phase (or "wave") should end with a permission audit:

1. **Read `.claude/settings.local.json` directly.** Not from memory. Concrete inspection.
2. **Look for new exact-string entries at the bottom of the `allow` array.** Those are one-off approvals granted during the session.
3. **For each one-off:**
   - Can it be replaced by a wildcard? (e.g., `Bash(printf:*)` instead of `Bash(printf "exact string")`)
   - Is the command safe to wildcard? (Read-only or scoped to local machine = yes. Mutates shared infrastructure = no.)
   - Is it already covered by an existing wildcard? (If yes, remove the redundant one-off.)
4. **Document findings in `docs/suggested-permissions-update.md`.** Append, don't overwrite.
5. **Optionally invoke the `update-config` skill** to apply the changes.

**Template for the audit file:**

````markdown
# Suggested Permissions Updates

Commands that triggered permission prompts during development. Append to this file at the end of each phase/wave.

## Prompt Count Tracker

| Phase   | Approx. prompts | Dominant cause | Status |
| ------- | --------------: | -------------- | ------ |
| Phase 0 |              ~? |                |        |

## Phase 0: <Name>

Date: YYYY-MM-DD

### Audit method

Describe how you inspected the file (which tool, what you compared against).

### Commands that triggered permission prompts

| Command           | Context    | Suggested Permission Pattern |
| ----------------- | ---------- | ---------------------------- |
| `example command` | why it ran | `Bash(example:*)`            |

### Recommended additions to .claude/settings.local.json

```json
["Bash(example:*)"]
```
````

### Rationale for each

- `example:*` — one-line reason, including any safety notes

```

---

## What NOT to add (common mistakes)

| Bad entry | Why |
|---|---|
| `Bash(*)` | Defeats the point — approves anything |
| `Bash(sudo:*)` | Privilege escalation, out of scope for a coding agent |
| `Bash(ssh:*)` | Remote access, blast radius too large |
| `Bash(aws:*)` or `Bash(gcloud:*)` | Cloud infrastructure — case-by-case, never wildcard |
| `Bash(sudo:*)` (repeat) | Never — listed once above is enough. |
| `Bash(psql:*)` or `Bash(mysql:*)` | Case-by-case. Read queries OK, mutating queries should require confirmation. |

---

## Project-specific additions

Some wildcards only make sense in certain projects. Track them in a `project-permissions.md` section in the audit file:

- **Python projects:** `Bash(pip:*)`, `Bash(python:*)`, `Bash(pytest:*)`, `Bash(ruff:*)`, `Bash(mypy:*)`
- **Rust projects:** `Bash(cargo:*)`, `Bash(rustup:*)`
- **Go projects:** `Bash(go:*)`, `Bash(gofmt:*)`
- **Kubernetes:** `Bash(kubectl:*)` — but carefully; never for destructive verbs
- **Terraform:** `Bash(terraform plan:*)` + `Bash(terraform validate:*)`, but NEVER `terraform apply:*` (always manual approval)
- **Docker / Railway (this template):** `Bash(docker:*)` + `Bash(docker compose:*)` for building/running the production image locally; `Bash(railway:*)` for the Railway CLI (deploys, `railway logs`, `railway variables`, `railway run`). Scoped to local + your Railway account; safe for a deploy-on-Railway template.

---

## Final note on safety vs. friction

The allow list is a judgment call about **your** project, **your** blast radius, and **your** tolerance for rework. The starter above is tuned for:
- Single-developer projects
- Local development (not shared infrastructure)
- Git-tracked source code (so destructive changes are recoverable)
- Non-production scripts only

If you're working on production infrastructure, shared databases, or team-owned systems, tighten the list. If you're experimenting alone on throwaway code, you can loosen it further.

When in doubt, narrow first, expand as needed via the feedback loop.
```
