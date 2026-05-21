import bcrypt from "bcryptjs";
import pg from "pg";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL required");
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function seed() {
  const adminHash = await bcrypt.hash("Admin123!", 10);
  const memberHash = await bcrypt.hash("Member123!", 10);

  // Upsert users
  await pool.query(`
    INSERT INTO users (name, email, password_hash, role, created_at)
    VALUES 
      ('Admin User', 'admin@example.com', $1, 'admin', NOW()),
      ('Alice Member', 'member@example.com', $2, 'member', NOW()),
      ('Bob Member', 'bob@example.com', $2, 'member', NOW())
    ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, role = EXCLUDED.role
  `, [adminHash, memberHash]);

  // Get user IDs
  const { rows: users } = await pool.query("SELECT id, email FROM users ORDER BY id");
  const admin = users.find((u: { email: string }) => u.email === "admin@example.com");
  const alice = users.find((u: { email: string }) => u.email === "member@example.com");
  const bob = users.find((u: { email: string }) => u.email === "bob@example.com");

  // Create projects
  const { rows: p1rows } = await pool.query(`
    INSERT INTO projects (title, description, status, created_by_id, created_at)
    VALUES ('Website Redesign', 'Redesign the company website with new branding and improved UX.', 'active', $1, NOW() - interval '10 days')
    ON CONFLICT DO NOTHING RETURNING id
  `, [admin.id]);

  const { rows: p2rows } = await pool.query(`
    INSERT INTO projects (title, description, status, created_by_id, created_at)
    VALUES ('Mobile App v2', 'Launch version 2 of the mobile app with new features and bug fixes.', 'active', $1, NOW() - interval '5 days')
    ON CONFLICT DO NOTHING RETURNING id
  `, [admin.id]);

  // Get project IDs (handle case where they already exist)
  const { rows: projects } = await pool.query("SELECT id FROM projects ORDER BY id LIMIT 2");
  const proj1Id = projects[0]?.id;
  const proj2Id = projects[1]?.id;

  if (!proj1Id || !proj2Id) {
    console.log("Projects already seeded, skipping...");
    await pool.end();
    return;
  }

  // Add members to projects
  await pool.query(`
    INSERT INTO project_members (project_id, user_id, joined_at)
    VALUES ($1, $2, NOW()), ($1, $3, NOW()), ($4, $2, NOW())
    ON CONFLICT DO NOTHING
  `, [proj1Id, alice.id, bob.id, proj2Id]);

  // Create tasks for project 1
  const now = new Date();
  const past = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
  const future1 = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const future2 = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

  await pool.query(`
    INSERT INTO tasks (title, description, status, priority, due_date, project_id, assigned_to_id, created_by_id, created_at)
    VALUES
      ('Design new homepage mockup', 'Create wireframes and high-fidelity mockups for the homepage redesign.', 'completed', 'high', $1, $2, $3, $4, NOW() - interval '9 days'),
      ('Update navigation structure', 'Refactor the site navigation to improve user flow.', 'in_progress', 'medium', $5, $2, $3, $4, NOW() - interval '7 days'),
      ('Write content for About page', 'Draft and review all copy for the About Us section.', 'todo', 'low', $6, $2, $7, $4, NOW() - interval '6 days'),
      ('SEO audit and optimization', 'Run full SEO audit and implement recommended improvements.', 'todo', 'high', $1, $2, $3, $4, NOW() - interval '5 days'),
      ('Performance testing', 'Load test the new design before launch.', 'todo', 'medium', null, $2, $7, $4, NOW() - interval '4 days')
  `, [past.toISOString().split('T')[0], proj1Id, alice.id, admin.id, future1.toISOString().split('T')[0], future2.toISOString().split('T')[0], bob.id]);

  // Create tasks for project 2
  await pool.query(`
    INSERT INTO tasks (title, description, status, priority, due_date, project_id, assigned_to_id, created_by_id, created_at)
    VALUES
      ('Implement push notifications', 'Add push notification support for iOS and Android.', 'in_progress', 'high', $1, $2, $3, $4, NOW() - interval '4 days'),
      ('Fix login screen bug', 'Users on older Android devices cannot log in.', 'completed', 'high', $5, $2, $3, $4, NOW() - interval '3 days'),
      ('Add dark mode support', 'Implement system-aware dark mode across all screens.', 'todo', 'medium', $1, $2, null, $4, NOW() - interval '2 days'),
      ('Update onboarding flow', 'Redesign the 3-step onboarding with new illustrations.', 'todo', 'low', $6, $2, $3, $4, NOW() - interval '1 day')
  `, [past.toISOString().split('T')[0], proj2Id, alice.id, admin.id, future1.toISOString().split('T')[0], future2.toISOString().split('T')[0]]);

  console.log("Database seeded successfully!");
  await pool.end();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
