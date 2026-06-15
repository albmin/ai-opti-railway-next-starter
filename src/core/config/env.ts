/**
 * Environment configuration with lazy, validated access.
 *
 * Each value is validated on first access (via getters), not at module import, so
 * importing this module never throws. Modules that construct a client at import
 * (the DB client, the Better Auth instance) still read these values eagerly — the
 * Dockerfile passes build-only placeholders so `next build` can evaluate them.
 */

function getRequiredEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function getOptionalEnv(key: string, defaultValue: string): string {
  return process.env[key] ?? defaultValue;
}

export const env = {
  // App config
  get NODE_ENV() {
    return getOptionalEnv("NODE_ENV", "development");
  },
  get LOG_LEVEL() {
    return getOptionalEnv("LOG_LEVEL", "info");
  },
  get APP_NAME() {
    return getOptionalEnv("APP_NAME", "ai-opti-nextjs-starter");
  },

  // Database (Railway Postgres) — required
  get DATABASE_URL() {
    return getRequiredEnv("DATABASE_URL");
  },

  // Better Auth — secret required; URL defaults to localhost for dev
  get BETTER_AUTH_SECRET() {
    return getRequiredEnv("BETTER_AUTH_SECRET");
  },
  get BETTER_AUTH_URL() {
    return getOptionalEnv("BETTER_AUTH_URL", "http://localhost:3000");
  },
} as const;

export type Env = typeof env;
