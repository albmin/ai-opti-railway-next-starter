import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { env } from "@/core/config/env";

import * as schema from "./schema";

/**
 * PostgreSQL connection for Drizzle ORM.
 *
 * Tuned for a long-lived container (Railway) rather than serverless: one process
 * owns a small connection pool, so prepared statements stay enabled and we connect
 * directly over Railway's private network (no transaction pooler required).
 */
const client = postgres(env.DATABASE_URL, {
  max: 10, // connections per container — mind the total when running replicas
  idle_timeout: 20, // seconds before an idle connection is released
  connect_timeout: 10, // seconds to wait when opening a new connection
});

/**
 * Drizzle database client with typed schema.
 */
export const db = drizzle(client, { schema });

export type Database = typeof db;
