import { Pool } from "pg";
import fs from "fs";
import path from "path";

const connectionString =
  process.env.DATABASE_URL ||
  "postgresql://postgres.frrepturpyarhdfxufey:[YOUR-PASSWORD]@aws-1-ap-south-1.pooler.supabase.com:5432/postgres";

// Create a single shared PostgreSQL pool
export const db = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false,
  },
  max: 10,
  idleTimeoutMillis: 30000,
});

let isInitialized = false;

// Auto-run initial schema migration if tables don't exist yet
export async function initPostgresDatabase() {
  if (isInitialized) return;
  try {
    const client = await db.connect();
    try {
      const migrationPath = path.join(process.cwd(), "supabase", "migrations", "001_initial_schema.sql");
      if (fs.existsSync(migrationPath)) {
        const sql = fs.readFileSync(migrationPath, "utf-8");
        await client.query(sql);
      }

      // Create movie_files table for storing video binaries directly in PostgreSQL
      await client.query(`
        CREATE TABLE IF NOT EXISTS movie_files (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          movie_id UUID REFERENCES movies(id) ON DELETE CASCADE,
          filename TEXT NOT NULL,
          mime_type TEXT NOT NULL DEFAULT 'video/mp4',
          file_data BYTEA NOT NULL,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
      `);

      isInitialized = true;
    } finally {
      client.release();
    }
  } catch (err) {
    console.warn("PostgreSQL connection notice (verify DATABASE_URL password):", (err as Error).message);
  }
}
