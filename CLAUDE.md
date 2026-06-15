# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
bun run dev          # Start development server
bun run build        # Production build (includes type checking)
bun run lint         # Check for lint/format errors (Biome)
bun run lint:fix     # Auto-fix lint/format issues
bun run format       # Format all files
npx tsc --noEmit     # Type check only (fast, no build)
bun test             # Run tests with coverage
bun test --watch     # Watch mode for TDD
```

## Self-Correction Workflow

This project uses strict TypeScript and Biome to create a feedback loop for AI-generated code:

1. **Write code** → 2. **Run checks** → 3. **Read errors** → 4. **Fix issues** → 5. **Repeat until clean**

### After writing or modifying code, always run:
```bash
bun run lint && npx tsc --noEmit
```

### Why this matters for AI development:
- **Type errors are precise**: `Type 'string | undefined' is not assignable to type 'string'` tells you exactly what's wrong
- **Catches bugs before runtime**: No need to run the app to find issues
- **Strict settings catch real bugs**:
  - `noUncheckedIndexedAccess`: Array access returns `T | undefined`, forcing null checks
  - `exactOptionalPropertyTypes`: Stricter optional property handling
  - `verbatimModuleSyntax`: Explicit type imports required

### Reading error output:
Errors include file path, line, and column: `src/app/page.tsx:15:3`
- Navigate directly to the problem
- The error message describes what's wrong
- Fix and re-run until all checks pass

## Testing

Tests are executable specifications and provide precise feedback for AI-generated code.

**Run tests after implementing features:**
```bash
bun test
```

**Why tests matter for AI development:**
- Test failures tell you exactly what's broken: test name, file:line, expected vs actual
- Tests define "done"—write them first when possible
- Fast execution (~10x faster than Jest) enables frequent runs
- Coverage reports (80% threshold) show gaps

**Test file conventions:**
- Feature slices: place tests in `tests/` subfolder (e.g., `src/features/projects/tests/service.test.ts`)
- Shared utilities: place tests next to source (e.g., `format.ts` → `format.test.ts`)
- Use `describe` and `it` blocks from `bun:test`
- React components: use `@testing-library/react` with `render`, `screen`, `userEvent`
- Mocked env: tests preload `test-env.ts` (dummy `DATABASE_URL` / `BETTER_AUTH_*`) so importing the
  DB/auth modules never throws. DB-touching tests mock the repository or `@/core/database/client`.

**Self-correction with tests:**
1. Write test defining expected behavior
2. Implement the feature
3. Run `bun test`
4. If test fails, read the diff (expected vs actual)
5. Fix and re-run until green

## Tech Stack

- Next.js 16 with App Router
- React 19
- TypeScript (strict mode)
- Tailwind CSS 4
- Biome for linting and formatting
- shadcn/ui for components
- Bun test runner with React Testing Library
- Better Auth (self-hosted email + password; sessions in Postgres)
- Drizzle ORM (type-safe database access)
- Railway (container hosting + managed Postgres)
- Docker (multi-stage build; Next.js standalone output)

## Vertical Slice Architecture

Features are organized as self-contained vertical slices in `src/features/`. Each slice owns its entire stack: data model, validation, database operations, business logic, and errors.

**Why vertical slices:**
- **Independence**: To understand "projects", read `src/features/projects/`. No hunting across layers.
- **Isolation**: Changes to one feature don't affect others. Easy to add, modify, or delete features.
- **Consistency**: Every feature follows the same structure, reducing cognitive load.
- **Testability**: Clear boundaries make unit testing straightforward.

### Feature Structure

```
src/features/{feature}/
├── models.ts      # Drizzle types (re-export from core/database/schema)
├── schemas.ts     # Zod validation schemas (API contracts)
├── repository.ts  # Database queries (isolated, no business logic)
├── service.ts     # Business logic (orchestrates repository + validation + logging)
├── errors.ts      # Custom error classes (explicit failure modes)
├── index.ts       # Public API (controls what other code can import)
└── tests/         # All tests for this feature
    ├── schemas.test.ts
    ├── errors.test.ts
    └── service.test.ts
```

### File Responsibilities

| File | Purpose | Imports From |
|------|---------|--------------|
| `models.ts` | Re-exports table from `core/database/schema`, defines `Project` and `NewProject` types | `core/database/schema` |
| `schemas.ts` | Zod schemas for input validation (`CreateProjectSchema`, `UpdateProjectSchema`) | `zod/v4` |
| `errors.ts` | Feature-specific errors with `code` and `statusCode` for API responses | Nothing (self-contained) |
| `repository.ts` | Pure database operations (`findById`, `create`, `update`, `delete`) | `core/database/client`, `models.ts` |
| `service.ts` | Business logic, access control, logging. Calls repository, never touches db directly | `repository.ts`, `errors.ts`, `core/logging` |
| `index.ts` | Public exports. Exposes service functions and types, hides repository | All feature files |

### Creating a New Feature

1. **Copy an existing feature** (e.g., `projects/`) as a template
2. **Define the schema** in `core/database/schema.ts` (table definition)
3. **Update `models.ts`** to re-export the table and infer types
4. **Create Zod schemas** for input validation
5. **Define error classes** for failure modes
6. **Implement repository** with database operations
7. **Implement service** with business logic and logging
8. **Export public API** from `index.ts`
9. **Write tests** in `tests/` subfolder

### Key Patterns

**Repository vs Service separation:**
```typescript
// repository.ts - Pure database operations, no business logic
export async function findById(id: string): Promise<Project | undefined> {
  const results = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
  return results[0];
}

// service.ts - Business logic, access control, logging
export async function getProject(id: string, userId: string | null): Promise<Project> {
  logger.info({ projectId: id }, "project.get_started");
  const project = await repository.findById(id);
  if (!project) throw new ProjectNotFoundError(id);
  if (!project.isPublic && project.ownerId !== userId) throw new ProjectAccessDeniedError(id);
  logger.info({ projectId: id }, "project.get_completed");
  return project;
}
```

**Error classes with HTTP semantics:**
```typescript
export class ProjectNotFoundError extends ProjectError {
  constructor(id: string) {
    super(`Project not found: ${id}`, "PROJECT_NOT_FOUND", 404);
  }
}
```

**Public API via index.ts:**
```typescript
// Export types and schemas
export type { Project, NewProject } from "./models";
export { CreateProjectSchema, UpdateProjectSchema } from "./schemas";

// Export errors
export { ProjectNotFoundError, ProjectAccessDeniedError } from "./errors";

// Export service functions (NOT repository - keep it internal)
export { createProject, getProject, updateProject, deleteProject } from "./service";
```

## Database Commands

```bash
bun run db:generate       # Generate migrations from schema changes
bun run db:migrate        # Apply migrations with drizzle-kit (local/dev)
bun run db:migrate:deploy # Apply migrations via the programmatic migrator (Railway preDeployCommand)
bun run db:push           # Push schema directly (dev only)
bun run db:studio         # Open Drizzle Studio GUI
```

## Database, Auth & Deployment (Railway)

This template runs as a long-lived container on **Railway** with **Better Auth** (self-hosted) and a
**Railway-managed Postgres**. There is no external auth provider — users, sessions, and accounts live
in your own database.

**Key files:**
- `src/core/config/env.ts` - Validated env vars via lazy getters (importing never throws; the Dockerfile passes build-only placeholders for modules that construct a client at import)
- `src/core/database/schema.ts` - App tables; re-exports the Better Auth tables
- `src/core/database/auth-schema.ts` - Better Auth tables (`user`, `session`, `account`, `verification`)
- `src/core/database/client.ts` - Drizzle + postgres-js client (pooled for a persistent container)
- `src/core/auth/server.ts` - Better Auth server instance (email+password, Drizzle adapter, `nextCookies`)
- `src/core/auth/client.ts` - Better Auth browser client (`useSession`, `signIn`, `signOut`)
- `src/app/api/auth/[...all]/route.ts` - Better Auth catch-all handler (`toNextJsHandler`)
- `src/proxy.ts` - Next.js 16 proxy: optimistic cookie gate for `/dashboard` (replaces middleware.ts)
- `src/features/auth/` - Shared auth actions (`signOut`) and hooks (`useUser`)
- `scripts/migrate.ts` - Programmatic Drizzle migrator (Railway `preDeployCommand`)
- `Dockerfile`, `.dockerignore`, `railway.json`, `next.config.ts` (`output: "standalone"`) - build & deploy config

**Auth patterns:**

1. **Server-side session**: `await auth.api.getSession({ headers: await headers() })` in layouts,
   server actions, and route handlers. Returns `{ user, session } | null`.

2. **Cookies in server actions** are set automatically by the `nextCookies()` plugin (MUST be the LAST
   plugin in the array). Sign-in/sign-up use `auth.api.signInEmail` / `auth.api.signUpEmail`.

3. **Client session**: `useSession()` from `@/core/auth/client`, wrapped by `useUser()` in
   `src/features/auth/hooks.ts`.

4. **User ids are `text`** (Better Auth default), not uuid. Foreign keys to users (e.g.
   `projects.ownerId`) are `text` referencing `user.id`.

5. **Server Actions with `useActionState`** (React 19): actions take `(prevState, formData)`.

6. **Auth route groups**: `(auth)` and `(dashboard)` layouts handle redirects. Check auth in the
   layout, not each page. The proxy is only an optimistic cookie check.

**Deployment (Railway):**

1. **Build**: Railway auto-detects the root `Dockerfile` (`build.builder: "DOCKERFILE"` in
   `railway.json`). Multi-stage Bun build → Next.js standalone → runs `bun server.js` bound to `0.0.0.0:$PORT`.

2. **Database**: add a Postgres service, then add a Reference Variable on the app service:
   `DATABASE_URL=${{Postgres.DATABASE_URL}}` (private networking via `*.railway.internal`). The
   persistent container uses a real connection pool — no transaction pooler / `prepare:false`.

3. **Migrations on deploy**: `railway.json` sets `deploy.preDeployCommand: "bun scripts/migrate.ts"`
   (invoked directly — the runtime image's package.json is Next's minimal standalone one). It runs the
   programmatic migrator (drizzle-orm only — no drizzle-kit in the runtime image) before new traffic
   shifts. Always `bun run db:generate` and commit new migrations. Locally use `bun run db:migrate:deploy`.

4. **Healthcheck**: `deploy.healthcheckPath: "/api/health"` (always-200 endpoint).

5. **Required env**: `DATABASE_URL`, `BETTER_AUTH_SECRET` (`openssl rand -base64 32`), `BETTER_AUTH_URL`
   (the public service domain). See `.env.example`.

**Local Docker parity:**
```bash
docker build -t app .
docker run -p 3000:3000 \
  -e DATABASE_URL=postgresql://... \
  -e BETTER_AUTH_SECRET=$(openssl rand -base64 32) \
  -e BETTER_AUTH_URL=http://localhost:3000 \
  app
```

## shadcn/ui Components

Components are copied into `src/components/ui/` - you can read and modify them directly.

**Add new components:**
```bash
bunx shadcn@canary add <component-name>
```

**Examples:**
```bash
bunx shadcn@canary add button
bunx shadcn@canary add dialog alert-dialog
```

**After adding components, run `bun run lint:fix`** to format them to match our style.

**Component locations:**
- `src/components/ui/` - shadcn primitives (button, dialog, etc.)
- `src/components/` - app-level components (theme-provider, theme-toggle)
- `src/shared/components/` - custom shared components
- `src/lib/utils.ts` - `cn()` utility for merging Tailwind classes

## Code Style

- 2-space indentation, 100 char line width, double quotes
- Use named exports (default exports only for Next.js pages/layouts/config files)
- Use `type` imports/exports for type-only references
- Use `const` over `let` when possible
- Path aliases: `@/*`, `@/core/*`, `@/features/*`, `@/shared/*` map to `./src/*`

## Rules That Will Fail Checks

**Errors (must fix):**
- Unused imports, variables, or parameters
- Using `==` instead of `===`
- Using `let` when value never changes (use `const`)
- Missing `type` keyword on type-only imports/exports
- Using `dangerouslySetInnerHTML` or `eval()`
- Missing braces on if/else statements

**Warnings (should fix):**
- Using `console.log` (remove or use structured logger; CLI scripts use `process.stdout.write`)
- Using `any` type (add proper types)
- Default exports in non-Next.js files (use named exports)
- Using `.forEach()` (use `for...of` loop instead)
- Overly complex functions

## Logging

Use `getLogger("domain.component")` and the `action_state` message pattern:
```typescript
const logger = getLogger("communities.service");
logger.info({ communityId }, "community.create_started");
logger.info({ communityId }, "community.create_completed");
logger.error({ communityId, error }, "community.create_failed");
```
States: `_started`, `_completed`, `_failed`. This makes logs grep-able and traceable. Logs are JSON on
stdout — Railway ingests them directly.

## Zod v4

Import from `zod/v4`, not `zod`:
```typescript
import { z } from "zod/v4";
```
`z.record` requires two args: `z.record(z.string(), z.unknown())` not `z.record(z.unknown())`.

## AI Workflow Toolkit

Reusable Claude Code orchestration assets live in `docs/ai-workflow/`:
- `orchestrator-prompt-template.md` - 5-phase multi-agent wave protocol (pre-flight → infra → dispatch → integrate → deliverables)
- `autonomous-owner-prompt.md` - autonomous product/engineering owner prompt
- `permissions-starter.md` - rationale for the committed `.claude/settings.json` allow-list (incl. Docker/Railway)
- `permissions-audit-template.md` - template for logging permission prompts per phase

The committed `.claude/settings.json` is the shared permission baseline for this template.
