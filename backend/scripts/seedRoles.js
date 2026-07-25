/**
 * ═══════════════════════════════════════════════════════════════
 *  CODOVATE RBAC — FIRESTORE ROLE & FEATURE FLAG SEEDER
 * ═══════════════════════════════════════════════════════════════
 * 
 * Seeds the `roles` and `featureFlags` collections in Firestore.
 * Safe to re-run — uses set() with merge to preserve existing data.
 * 
 * Usage:
 *   node backend/scripts/seedRoles.js
 *   node backend/scripts/seedRoles.js --dry-run    (preview only)
 *   node backend/scripts/seedRoles.js --force       (overwrite existing)
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const { db } = require('../config/firebase');
const { ROLE_DEFINITIONS, DEFAULT_FEATURE_FLAGS } = require('../config/roleDefinitions');

const {
  mapDoc: mapDoc,
  mapDocs: mapDocs
} = require('../utils/firestoreMapper');

const isDryRun = process.argv.includes('--dry-run');
const isForce = process.argv.includes('--force');

async function seedRoles() {
  console.log('\n═══════════════════════════════════════════════════');
  console.log('  CODOVATE RBAC — Firestore Seeder');
  console.log('═══════════════════════════════════════════════════\n');

  if (isDryRun) {
    console.log('🔍 DRY RUN MODE — No data will be written.\n');
  }

  const now = new Date();
  let rolesCreated = 0;
  let rolesSkipped = 0;
  let flagsCreated = 0;
  let flagsSkipped = 0;

  // ── Seed Roles ────────────────────────────────────────────
  console.log('📋 Seeding Roles...');
  for (const [roleId, roleDef] of Object.entries(ROLE_DEFINITIONS)) {
    const roleDoc = {
      roleId: roleDef.roleId,
      roleName: roleDef.roleName,
      description: roleDef.description,
      priority: roleDef.priority,
      isSystem: roleDef.isSystem,
      permissions: roleDef.permissions,
      updatedAt: now,
    };

    if (isDryRun) {
      console.log(`  ✅ [DRY] Would seed role: ${roleId} (${roleDef.permissions.length} permissions)`);
      rolesCreated++;
      continue;
    }

    const docRef = db.collection('roles').doc(roleId);
    const existing = await docRef.get();

    if (existing.exists && !isForce) {
      console.log(`  ⏭️  Skipped role: ${roleId} (already exists, use --force to overwrite)`);
      rolesSkipped++;
      continue;
    }

    roleDoc.createdAt = existing.exists ? (mapDoc(existing).createdAt || now) : now;
    await docRef.set(roleDoc, { merge: !isForce });
    console.log(`  ✅ Seeded role: ${roleId} (${roleDef.permissions.length} permissions)`);
    rolesCreated++;
  }

  // ── Seed Feature Flags ────────────────────────────────────
  console.log('\n🚩 Seeding Feature Flags...');
  for (const flag of DEFAULT_FEATURE_FLAGS) {
    const flagDoc = {
      key: flag.key,
      enabled: flag.enabled,
      description: flag.description,
      allowedRoles: flag.allowedRoles,
      updatedAt: now,
    };

    if (isDryRun) {
      console.log(`  ✅ [DRY] Would seed flag: ${flag.key} (enabled: ${flag.enabled})`);
      flagsCreated++;
      continue;
    }

    const docRef = db.collection('featureFlags').doc(flag.key);
    const existing = await docRef.get();

    if (existing.exists && !isForce) {
      console.log(`  ⏭️  Skipped flag: ${flag.key} (already exists, use --force to overwrite)`);
      flagsSkipped++;
      continue;
    }

    flagDoc.createdAt = existing.exists ? (mapDoc(existing).createdAt || now) : now;
    await docRef.set(flagDoc, { merge: !isForce });
    console.log(`  ✅ Seeded flag: ${flag.key} (enabled: ${flag.enabled})`);
    flagsCreated++;
  }

  // ── Summary ───────────────────────────────────────────────
  console.log('\n═══════════════════════════════════════════════════');
  console.log(`  Roles:   ${rolesCreated} created, ${rolesSkipped} skipped`);
  console.log(`  Flags:   ${flagsCreated} created, ${flagsSkipped} skipped`);
  console.log('═══════════════════════════════════════════════════\n');
}

seedRoles()
  .then(() => {
    console.log('✅ Seeding complete!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  });
