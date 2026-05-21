// Seed script — creates demo admin and member users
import { createRequire } from "module";
import pg from "pg";
import bcrypt from "bcryptjs";

const { Pool } = pg;

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}

const pool = new Pool({ connectionString: DATABASE_URL });

async function seed() {
  const client = await pool.connect();
  try {
    // Check if users already exist
    const existing = await client.query("SELECT COUNT(*) FROM users");
    if (parseInt(existing.rows[0].count) > 0) {
      console.log("Database already seeded, skipping.");
      return;
    }

    const adminHash = await bcrypt.hash("Admin123!", 10);
    const memberHash = await bcrypt.hash("Member123!", 10);

    await client.query(
      `INSERT INTO users (name, email, password_hash, role) VALUES
       ('Admin User', 'admin@example.com', $1, 'admin'),
       ('Member User', 'member@example.com', $2, 'member')`,
      [adminHash, memberHash]
    );

    console.log("✓ Seeded demo users:");
    console.log("  Admin:  admin@example.com  / Admin123!");
    console.log("  Member: member@example.com / Member123!");
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch((err) => {
  console.error("Seed failed:", err.message);
  process.exit(1);
});
