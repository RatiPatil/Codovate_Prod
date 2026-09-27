/**
 * dashboardService.js — Firebase/Firestore implementation
 *
 * Replaces the PostgreSQL-based dashboard service.
 * All data is read from Firestore collections that are already
 * written by the other Firestore-native route files.
 *
 * Collections used:
 *   users, profiles, userGoals, userPreferences, achievements,
 *   roadmaps, userRoadmaps, enrollments, courses, applications,
 *   notifications, resumes, portfolios, certificates,
 *   placementReadiness, dashboard
 */

const { db, FieldValue } = require('../config/firebase');

/**
 * Helper: safely get documents from a collection with a where clause.
 * Returns an array (empty on error).
 */
async function safeDocs(collection, field, value, opts = {}) {
  try {
    let q = db.collection(collection).where(field, '==', value);
    if (opts.orderBy) q = q.orderBy(opts.orderBy, opts.dir || 'desc');
    if (opts.limit) q = q.limit(opts.limit);
    const snap = await q.get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (err) {
    console.warn(`[dashboardService] safeDocs(${collection}) warn:`, err.message);
    return [];
  }
}

/**
 * Helper: safely get a single document by ID.
 * Returns null on error/not-found.
 */
async function safeDoc(collection, id) {
  try {
    const doc = await db.collection(collection).doc(id).get();
    return doc.exists ? { id: doc.id, ...doc.data() } : null;
  } catch (err) {
    console.warn(`[dashboardService] safeDoc(${collection}/${id}) warn:`, err.message);
    return null;
  }
}

/**
 * Sync (or create) the dashboard snapshot document for a user.
 * Aggregates data from Firestore collections and writes to
 * the `dashboard` collection under the user's UID.
 *
 * Called by route files after mutations that affect the dashboard.
 * Does NOT throw — failures are logged and swallowed so they
 * never break the calling request.
 */
async function syncDashboard(uid) {
  if (!uid) return;

  try {
    const [
      user,
      profile,
      goals,
      preferences,
      achievements,
      roadmaps,
      learning,
      applications,
      notifications,
      resumes,
      portfolios,
      certificates,
      placementReadiness
    ] = await Promise.all([
      safeDoc('users', uid),
      safeDoc('profiles', uid),
      safeDoc('userGoals', uid),
      safeDoc('userPreferences', uid),
      safeDocs('achievements', 'uid', uid,      { orderBy: 'achievementDate', dir: 'desc', limit: 20 }),
      safeDocs('userRoadmaps', 'uid', uid,      { orderBy: 'createdAt', dir: 'desc', limit: 10 }),
      safeDocs('enrollments', 'uid', uid,       { orderBy: 'updatedAt', dir: 'desc', limit: 10 }),
      safeDocs('applications', 'applicantId', uid, { orderBy: 'createdAt', dir: 'desc', limit: 10 }),
      safeDocs('notifications', 'uid', uid,     { orderBy: 'createdAt', dir: 'desc', limit: 20 }),
      safeDocs('resumes', 'ownerUid', uid,      { orderBy: 'updatedAt', dir: 'desc', limit: 10 }),
      safeDocs('portfolios', 'ownerUid', uid,   { orderBy: 'updatedAt', dir: 'desc' }),
      safeDocs('certificates', 'ownerUid', uid, { orderBy: 'createdAt', dir: 'desc' }),
      safeDoc('placementReadiness', uid)
    ]);

    const dashboardData = {
      uid,
      user,
      profile,
      goals,
      preferences,
      achievements,
      roadmap: roadmaps,
      learning,
      applications,
      notifications,
      resumes,
      portfolio: portfolios,
      certificates,
      placementReadiness,
      syncedAt: FieldValue.serverTimestamp(),
      generatedAt: new Date().toISOString()
    };

    await db.collection('dashboard').doc(uid).set(dashboardData, { merge: true });

    return dashboardData;
  } catch (err) {
    console.error('[dashboardService] syncDashboard error:', err.message);
    // Never throw — callers treat this as fire-and-forget
  }
}

/**
 * Sync placement readiness score to Firestore.
 * Replaces the PostgreSQL placement_readiness upsert.
 */
async function syncPlacementReadiness(uid, data = {}) {
  try {
    const score = data.score ?? null;
    const details = data.details ?? {};
    const improvements = data.improvements ?? [];

    await db.collection('placementReadiness').doc(uid).set({
      uid,
      score,
      details,
      improvements,
      calculatedAt: FieldValue.serverTimestamp()
    }, { merge: true });

    return true;
  } catch (err) {
    console.error('[dashboardService] syncPlacementReadiness error:', err.message);
    return false;
  }
}

/**
 * Get full dashboard data for a user.
 * Returns the Firestore dashboard document if it exists,
 * otherwise triggers a sync first.
 */
async function getDashboardData(uid) {
  try {
    const doc = await db.collection('dashboard').doc(uid).get();
    if (doc.exists) {
      return { id: doc.id, ...doc.data() };
    }
    // First-time: generate it
    return await syncDashboard(uid);
  } catch (err) {
    console.error('[dashboardService] getDashboardData error:', err.message);
    return { uid, generatedAt: new Date().toISOString() };
  }
}

async function getDashboard(uid) {
  return getDashboardData(uid);
}

module.exports = {
  syncDashboard,
  syncPlacementReadiness,
  getDashboardData,
  getDashboard
};
