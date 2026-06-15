/**
 * Programmatic Drizzle migrator.
 *
 * Runs as the Railway `preDeployCommand` (see railway.json) before a new deploy
 * serves traffic. Depends only on `drizzle-orm` + `postgres` (both runtime deps),
 * so it works inside the slim production image without `drizzle-kit`.
 *
 * Local use: `bun run db:migrate:deploy` with DATABASE_URL set.
 */
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

const databaseUrl = process.env["DATABASE_URL"];
if (!databaseUrl) {
  throw new Error("DATABASE_URL is required to run migrations");
}

// A dedicated single-use connection — never the app pool.
const sql = postgres(databaseUrl, { max: 1 });

try {
  process.stdout.write("Running database migrations...\n");
  await migrate(drizzle(sql), { migrationsFolder: "drizzle/migrations" });
  process.stdout.write("Migrations complete.\n");
} finally {
  await sql.end();
}
