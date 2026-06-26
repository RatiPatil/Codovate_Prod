const pool = require("./config/db");

async function runMigrations() {
  try {
    console.log("Starting migrations...");

    // 1. Resume URL
    await pool.query(`ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS resume_url TEXT;`);
    console.log("Added resume_url to student_profiles.");

    // 2. Teams
    await pool.query(`
      CREATE TABLE IF NOT EXISTS teams (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(255) NOT NULL,
        join_code VARCHAR(50) UNIQUE NOT NULL,
        opportunity_id UUID REFERENCES opportunities(id) ON DELETE CASCADE,
        created_by UUID REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("Created teams table.");

    await pool.query(`
      CREATE TABLE IF NOT EXISTS team_members (
        team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (team_id, user_id)
      );
    `);
    console.log("Created team_members table.");

    // 3. Mentors
    await pool.query(`
      CREATE TABLE IF NOT EXISTS mentors (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
        expertise TEXT[] NOT NULL,
        bio TEXT,
        hourly_rate DECIMAL(10, 2) DEFAULT 0.00,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("Created mentors table.");

    await pool.query(`
      CREATE TABLE IF NOT EXISTS mentor_bookings (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        mentor_id UUID REFERENCES mentors(id) ON DELETE CASCADE,
        student_id UUID REFERENCES users(id) ON DELETE CASCADE,
        scheduled_time TIMESTAMP NOT NULL,
        status VARCHAR(50) DEFAULT 'Pending',
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("Created mentor_bookings table.");

    // Insert dummy mentors for testing
    // Get existing admins or users to make mentors
    const users = await pool.query("SELECT id FROM users LIMIT 2");
    if (users.rows.length > 0) {
      for (const u of users.rows) {
        await pool.query(`
          INSERT INTO mentors (user_id, expertise, bio) 
          VALUES ($1, $2, $3)
          ON CONFLICT (user_id) DO NOTHING
        `, [u.id, ['React', 'Node.js', 'System Design'], 'Experienced Software Engineer']);
      }
      console.log("Inserted dummy mentors.");
    }

    console.log("✅ Migrations complete!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Migration failed:", err);
    process.exit(1);
  }
}

runMigrations();
