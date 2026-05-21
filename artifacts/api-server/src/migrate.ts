import { pool } from "@workspace/db";
import { logger } from "./lib/logger";

export async function runMigrations() {
  const client = await pool.connect();
  try {
    logger.info("Running database migrations...");

    await client.query(`
      CREATE TABLE IF NOT EXISTS "users" (
        "id" serial PRIMARY KEY,
        "name" text NOT NULL,
        "email" text NOT NULL UNIQUE,
        "password_hash" text NOT NULL,
        "role" text NOT NULL DEFAULT 'member',
        "created_at" timestamp NOT NULL DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS "projects" (
        "id" serial PRIMARY KEY,
        "title" text NOT NULL,
        "description" text,
        "status" text NOT NULL DEFAULT 'active',
        "created_by_id" integer NOT NULL REFERENCES "users"("id"),
        "created_at" timestamp NOT NULL DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS "project_members" (
        "id" serial PRIMARY KEY,
        "project_id" integer NOT NULL REFERENCES "projects"("id") ON DELETE CASCADE,
        "user_id" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "joined_at" timestamp NOT NULL DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS "tasks" (
        "id" serial PRIMARY KEY,
        "title" text NOT NULL,
        "description" text,
        "status" text NOT NULL DEFAULT 'todo',
        "priority" text NOT NULL DEFAULT 'medium',
        "due_date" date,
        "project_id" integer NOT NULL REFERENCES "projects"("id") ON DELETE CASCADE,
        "assigned_to_id" integer REFERENCES "users"("id") ON DELETE SET NULL,
        "created_by_id" integer NOT NULL REFERENCES "users"("id"),
        "created_at" timestamp NOT NULL DEFAULT now()
      );
    `);

    logger.info("Database migrations completed successfully");
  } catch (err) {
    logger.error({ err }, "Database migration failed");
    throw err;
  } finally {
    client.release();
  }
}
