# Next.js AI Coding Starter

Production-ready Next.js SaaS starter optimized for AI-assisted development with Bun, Better Auth, Railway, and strict TypeScript.

## Stack

| Technology | Choice | AI Agent Benefit |
|------------|--------|------------------|
| Runtime | Bun | Faster iteration cycles |
| Framework | Next.js 16 | Predictable file conventions |
| Linting | Biome | 10-25x faster feedback loop |
| Type Safety | TS strict | Unambiguous errors, types as docs |
| Database | Drizzle ORM | Can't write invalid queries |
| Auth | Better Auth | Self-hosted, typed, sessions in Postgres |
| Validation | Zod | Structured errors, self-documenting |
| Logging | Pino | Machine-readable debugging context |
| Testing | Bun test | 10x faster than Jest |
| UI | shadcn/ui | Agent can read/modify components |
| Hosting | Railway | Container deploy + managed Postgres |
| Build | Docker | Reproducible multi-stage standalone image |

## Quick Start

```bash
# Install dependencies
bun install

# Set up environment
cp .env.example .env
# Edit .env: DATABASE_URL, BETTER_AUTH_SECRET (openssl rand -base64 32), BETTER_AUTH_URL

# Apply database migrations (Better Auth + app tables)
bun run db:migrate:deploy

# Start development server
bun run dev
```

Need a local Postgres? `docker run -d --name pg -e POSTGRES_PASSWORD=postgres -p 5432:5432 postgres:17`

## Commands

```bash
bun run dev               # Start development server
bun run build             # Production build
bun run lint              # Check for lint/format errors
bun run lint:fix          # Auto-fix lint/format issues
bun test                  # Run tests with coverage
bun run db:generate       # Generate migrations from schema changes
bun run db:migrate:deploy # Apply migrations locally (Railway runs scripts/migrate.ts on deploy)
bun run db:studio         # Open Drizzle Studio GUI
```

## Architecture

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Auth pages (login, register)
│   ├── (dashboard)/       # Protected pages
│   └── api/
│       ├── auth/[...all]/ # Better Auth catch-all handler
│       ├── health/        # Liveness / readiness / db checks
│       └── projects/      # Example REST API
├── core/                   # Shared infrastructure
│   ├── auth/              # Better Auth server + browser client
│   ├── config/            # Environment validation (lazy)
│   ├── database/          # Drizzle client, schema, auth-schema
│   └── logging/           # Pino structured logging
├── features/              # Vertical slices
│   ├── auth/              # Auth actions & hooks
│   └── projects/          # Example feature slice
├── shared/                # Cross-feature utilities
└── proxy.ts               # Next.js 16 proxy (optimistic /dashboard gate)
scripts/migrate.ts         # Programmatic Drizzle migrator (Railway preDeploy)
Dockerfile, railway.json   # Build & deploy config
```

## Deployment (Railway)

1. Create a Railway project and add a **PostgreSQL** service.
2. Add this repo as a service — Railway auto-detects the root `Dockerfile` (config in `railway.json`).
3. On the app service, add a Reference Variable `DATABASE_URL=${{Postgres.DATABASE_URL}}` (private
   networking), plus `BETTER_AUTH_SECRET` and `BETTER_AUTH_URL` (your service's public domain).
4. Deploy. `preDeployCommand` runs migrations; the `/api/health` healthcheck gates traffic.

Verify the image locally:

```bash
docker build -t app .
docker run -p 3000:3000 \
  -e DATABASE_URL=postgresql://... \
  -e BETTER_AUTH_SECRET=$(openssl rand -base64 32) \
  -e BETTER_AUTH_URL=http://localhost:3000 \
  app
```

## Environment Variables

```bash
# Database (Railway Postgres — use the reference variable in production)
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/postgres

# Better Auth
BETTER_AUTH_SECRET=replace-with-a-long-random-secret   # openssl rand -base64 32
BETTER_AUTH_URL=http://localhost:3000                  # public domain on Railway
```

## AI Workflow Toolkit

This template ships **agentic-workflow** — a strategy-gated, two-tier multi-agent coding workflow —
pre-installed as a Claude Code skill. Invoke it with `/orchestrate <describe the work>` (a feature, a
bugfix, a punch-list, or a question); it classifies the work, spawns typed agents, runs an adversarial
review gate, and for large features integrates parallel worktree slices safely.

- **Live on clone (no setup):** the skill in [`.claude/skills/orchestrate/`](.claude/skills/orchestrate/)
  and its six typed agents in [`.claude/agents/`](.claude/agents/) (`aw-*.md`).
- **Docs & portable installer:** [`docs/agentic-workflow/`](docs/agentic-workflow/) — architecture, a
  usage guide with worked examples, a stack-agnostic permissions starter, and `install.sh` to add the
  workflow to another project.
- **Hand-the-reins autonomous mode:** [`docs/agentic-workflow/autonomous-owner-prompt.md`](docs/agentic-workflow/autonomous-owner-prompt.md)
  — for when you want the agent to set its own roadmap and build it (e.g. to spend leftover session
  budget productively) rather than hand it a defined task.

## License

MIT
