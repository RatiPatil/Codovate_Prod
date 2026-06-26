/**
 * CODOVATE — Admin Account Seeder
 * Creates 3-tier admin accounts in Firestore
 *
 * Run: node seed-admins.js
 */

const bcrypt = require('bcryptjs');
const { db } = require('./config/firebase');
require('dotenv').config();

const ADMINS = [
  {
    id: 'super_admin_001',
    name: 'Ratikant Patil',
    email: 'superadmin@codovate.com',
    password: 'Super@Admin#2026',
    role: 'super_admin',
    description: 'Full system access — all modules'
  },
  {
    id: 'college_admin_001',
    name: 'SVERI College Admin',
    email: 'college@codovate.com',
    password: 'College@Admin#2026',
    role: 'college_admin',
    college_id: 'sveri_pandharpur',
    college_name: 'SVERI College of Engineering, Pandharpur',
    description: 'Access restricted to SVERI college data only'
  },
  {
    id: 'company_admin_001',
    name: 'Company Recruiter Admin',
    email: 'company@codovate.com',
    password: 'Company@Admin#2026',
    role: 'company_admin',
    company_id: 'tcs_001',
    company_name: 'TCS',
    description: 'Access restricted to jobs, internships, applicants only'
  },
];

async function seedAdmins() {
  console.log('\n🚀 CODOVATE — Seeding Admin Accounts...\n');
  console.log('='.repeat(55));

  for (const admin of ADMINS) {
    try {
      // Check if already exists
      const existing = await db.collection('users').doc(admin.id).get();
      if (existing.exists) {
        console.log(`⚠️  [SKIP] ${admin.email} already exists`);
        continue;
      }

      const hash = await bcrypt.hash(admin.password, 12);

      const userData = {
        id: admin.id,
        name: admin.name,
        email: admin.email.toLowerCase(),
        password_hash: hash,
        role: admin.role,
        is_active: true,
        is_verified: true,
        onboarding_done: true,
        auth_provider: 'email',
        created_at: new Date(),
        // Role-specific fields
        ...(admin.college_id && { college_id: admin.college_id, college_name: admin.college_name }),
        ...(admin.company_id && { company_id: admin.company_id, company_name: admin.company_name }),
      };

      await db.collection('users').doc(admin.id).set(userData);

      console.log(`\n✅ Created: ${admin.role.toUpperCase()}`);
      console.log(`   Email    : ${admin.email}`);
      console.log(`   Password : ${admin.password}`);
      console.log(`   Access   : ${admin.description}`);
    } catch (err) {
      console.error(`❌ Failed to create ${admin.email}:`, err.message);
    }
  }

  console.log('\n' + '='.repeat(55));
  console.log('\n🎉 Admin seeding complete!\n');
  console.log('📋 CREDENTIALS SUMMARY:');
  console.log('─'.repeat(55));

  ADMINS.forEach(a => {
    console.log(`\n  🔑 ${a.role.toUpperCase()}`);
    console.log(`     URL      : http://localhost:5173/admin-login`);
    console.log(`     Email    : ${a.email}`);
    console.log(`     Password : ${a.password}`);
    console.log(`     Access   : ${a.description}`);
  });

  console.log('\n' + '─'.repeat(55));
  process.exit(0);
}

seedAdmins().catch(err => {
  console.error('Fatal seeding error:', err);
  process.exit(1);
});
