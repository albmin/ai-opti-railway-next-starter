# syntax=docker/dockerfile:1
#
# Multi-stage build for Railway (and any Docker host).
# Uses Bun to match the repo toolchain; the runner ships Next.js standalone output.
# Debian-slim base (glibc) avoids musl native-module pitfalls.

FROM oven/bun:1.3.10-slim AS base

# ----------------------------------------------------------------------------
# deps: install all dependencies (incl. dev) needed to build
# ----------------------------------------------------------------------------
FROM base AS deps
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# ----------------------------------------------------------------------------
# builder: produce the Next.js standalone server
# ----------------------------------------------------------------------------
FROM base AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Build with placeholder env so `next build` can import modules that construct a
# client at load time (the Drizzle client and the Better Auth instance). These are
# set only for this RUN — never persisted into the image — and Railway injects the
# real values at runtime.
RUN DATABASE_URL="postgresql://build:build@localhost:5432/build" \
    BETTER_AUTH_SECRET="build-time-placeholder-not-used-at-runtime" \
    BETTER_AUTH_URL="http://localhost:3000" \
    bun run build

# ----------------------------------------------------------------------------
# runner: minimal production image
# ----------------------------------------------------------------------------
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
# Next standalone server reads PORT (injected by Railway) and HOSTNAME.
ENV HOSTNAME=0.0.0.0

# Next.js standalone output (includes a traced node_modules for the server).
COPY --from=builder /app/public ./public
COPY --from=builder --chown=bun:bun /app/.next/standalone ./
COPY --from=builder --chown=bun:bun /app/.next/static ./.next/static

# Migrations + programmatic migrator for the Railway preDeployCommand.
# drizzle-orm and postgres are runtime-dependency-free, so copying just these
# two packages is enough for `bun run scripts/migrate.ts` to resolve.
# (If the migrator ever needs more, copy a full production node_modules instead.)
COPY --from=builder --chown=bun:bun /app/drizzle ./drizzle
COPY --from=builder --chown=bun:bun /app/scripts ./scripts
COPY --from=builder /app/node_modules/drizzle-orm ./node_modules/drizzle-orm
COPY --from=builder /app/node_modules/postgres ./node_modules/postgres

USER bun
EXPOSE 3000
CMD ["bun", "server.js"]
