# Suggested Permissions Updates

Track Claude Code permission prompts here. Append a section per implementation phase/wave and keep the
committed baseline (`.claude/settings.json`) in sync. See `permissions-starter.md` for the rationale
behind each wildcard.

## Prompt Count Tracker

Cumulative count of manual approvals per phase (orchestrator self-reports; the harness doesn't expose
approval history programmatically, so counts are recollection-based).

| Phase | Approx. prompts | Dominant cause | Status |
| ----- | --------------: | -------------- | ------ |
|       |                 |                |        |

## Phase &lt;N&gt;: &lt;name&gt;

Date: YYYY-MM-DD

### Audit method

How you inspected the allow-list — read `.claude/settings.json` directly (not from memory) and compared
against the previous snapshot.

### Commands that triggered permission prompts

| Command | Context | Suggested pattern |
| ------- | ------- | ----------------- |
|         |         |                   |

### Recommended additions to `.claude/settings.json`

```json
[]
```

### Rationale

- `pattern` — one line on why it is safe to wildcard (read-only? local-only? reversible via git?).

---

> Tip: prefer `bash scripts/...` helpers and `git -C /abs/path ...` over chained `cd /path && cmd`
> commands — compound expressions are matched as a single string and won't hit your prefix wildcards.
