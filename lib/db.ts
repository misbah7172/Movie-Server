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
      isInitialized = true;
    } finally {
      client.release();
    }
  } catch (err) {
    console.warn("PostgreSQL connection notice (verify DATABASE_URL password):", (err as Error).message);
  }
}
