# Permissions (stack-agnostic starter)

Optional. Installing the workflow does **not** change your security posture — adopt this only if you
want fewer permission prompts during autonomous runs. It's a starting allow-list plus the one rule that
causes most avoidable prompts.

Copy the relevant entries into your project's `.claude/settings.local.json` `permissions.allow` array,
then tune to your blast-radius tolerance. The list below is deliberately generic (no toolchain
assumptions) — add your stack's runner from the table at the bottom.

## The chained-command rule (most important)

Claude Code matches a whole shell expression against prefix wildcards as **one string**. So
`cd /path && <runner> test` does **not** match `Bash(cd:*)` or `Bash(<runner>:*)` — it only matches the
literal `Bash(cd /path && <runner> test)`, which isn't in your list. Consequences:

- **Never** write `cd /path && cmd` in a tool call. Split into two calls, or put it in a script.
- Use `git -C /abs/path <subcommand>` instead of `cd /path && git <subcommand>` — the whole invocation
  stays `git …` and matches `Bash(git:*)`.
- Wrap repeated multi-step checks in a `scripts/` helper that `cd`s internally; one `Bash(bash:*)`
  covers them all.

This single rule is why mature setups go from ~20 prompts/session to ~0.

## Generic starter allow-list

```json
{
  "permissions": {
    "allow": [
      "Bash(git:*)",
      "Bash(gh:*)",

      "Bash(ls:*)", "Bash(cat:*)", "Bash(head:*)", "Bash(tail:*)", "Bash(wc:*)",
      "Bash(pwd:*)", "Bash(which:*)", "Bash(tree:*)", "Bash(mkdir:*)", "Bash(touch:*)",
      "Bash(cp:*)", "Bash(mv:*)", "Bash(rm:*)",

      "Bash(grep:*)", "Bash(rg:*)", "Bash(find:*)", "Bash(sed:*)", "Bash(awk:*)",
      "Bash(cut:*)", "Bash(sort:*)", "Bash(uniq:*)", "Bash(diff:*)", "Bash(xargs:*)", "Bash(jq:*)",

      "Bash(env:*)", "Bash(printenv:*)", "Bash(date:*)", "Bash(basename:*)", "Bash(dirname:*)",
      "Bash(realpath:*)", "Bash(stat:*)", "Bash(file:*)", "Bash(tee:*)", "Bash(echo:*)", "Bash(printf:*)",

      "Bash(ps:*)", "Bash(kill:*)", "Bash(pkill:*)", "Bash(sleep:*)",
      "Bash(curl:*)",

      "Bash(bash:*)", "Bash(for:*)", "Bash(while:*)", "Bash(if:*)", "Bash(test:*)",

      "WebSearch",
      "WebFetch"
    ]
  }
}
```

Notes:
- `Bash(bash:*)` is the one that makes `bash scripts/<helper>.sh` and heredocs work without prompting —
  pair it with helper scripts to kill the chained-command problem.
- `Bash(rm:*)` is a calculated risk: scoped to the local tree, reversible via git for tracked files.
  Tighten to `Bash(rm -rf:*)` patterns or drop it if your blast-radius tolerance is lower.
- `git:*` covers worktree operations the heavy path relies on.

## Add your toolchain

Append the runner(s) your project actually uses (discovered in skill step 1):

| Stack | Add |
| ----- | --- |
| Bun / Node | `Bash(bun run:*)`, `Bash(bun test:*)`, `Bash(bunx:*)`, `Bash(npx:*)`, `Bash(node:*)`, `Bash(npm:*)`, `Bash(pnpm:*)` |
| Python | `Bash(python:*)`, `Bash(python3:*)`, `Bash(pip:*)`, `Bash(pytest:*)`, `Bash(ruff:*)`, `Bash(mypy:*)` |
| Rust | `Bash(cargo:*)`, `Bash(rustup:*)` |
| Go | `Bash(go:*)`, `Bash(gofmt:*)` |
| Docker | `Bash(docker:*)`, `Bash(docker compose:*)` |
| MCP/skills | your project's `mcp__*` tools; `Skill(update-config)` to let the agent propose settings diffs |

## Never wildcard these

| Don't add | Why |
| --------- | --- |
| `Bash(*)` | Approves anything — defeats the point |
| `Bash(sudo:*)` | Privilege escalation, out of scope for a coding agent |
| `Bash(ssh:*)` | Remote access — blast radius too large |
| `Bash(aws:*)`, `Bash(gcloud:*)`, `Bash(kubectl:*)` | Cloud infra — case-by-case, never blanket |
| `terraform apply:*`, prod-deploy commands | These are the workflow's **safety floor** — manual only |
| `psql:*` / `mysql:*` mutations | Read queries maybe; mutations should stay manual |

This list aligns with the workflow's safety floor: the irreversible/outward actions it refuses to do
autonomously are the same ones you should never wildcard.

## Feedback loop

If a run hits repeated prompts, note the offending commands and add a safe wildcard (read-only or
local-and-reversible → yes; mutates shared infra → no). Keep the committed `.claude/settings.json`
baseline in sync. A future enhancement (README → future work) automates this audit.
