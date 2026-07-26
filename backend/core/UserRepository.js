const FirestoreRepository = require('./Repository');
const { admin, db, getAuth } = require('../config/firebase');
const AppError = require('../utils/AppError');
const AuditService = require('./AuditService');

const {
  mapDoc: mapDoc,
  mapDocs: mapDocs
} = require('../utils/firestoreMapper');

/**
 * UserRepository
 * Extends the generic FirestoreRepository to ensure sync with Firebase Auth.
 */
class UserRepository extends FirestoreRepository {
  constructor() {
    super('users');
  }

  /**
   * Create a user in Firebase Auth and Firestore concurrently
   */
  async create(data, userContext) {
    if (!data.email || !data.password) {
      throw new AppError('Email and Password are required for manual creation.', 400);
    }

    try {
      // 1. Create in Firebase Auth
      const authRecord = await getAuth().createUser({
        email: data.email,
        password: data.password,
        displayName: `${data.firstName || ''} ${data.lastName || ''}`.trim(),
        emailVerified: true // assuming admin creation is verified
      });

      // 2. Assign custom claims
      await getAuth().setCustomUserClaims(authRecord.uid, {
        role: data.role || 'user',
        orgId: data.orgId || null,
        deptId: data.deptId || null,
      });

      // 3. Create in Firestore using the exact Auth UID
      const firestoreData = {
        email: data.email,
        firstName: data.firstName || '',
        lastName: data.lastName || '',
        name: `${data.firstName || ''} ${data.lastName || ''}`.trim(),
        role: data.role || 'user',
        orgId: data.orgId || null,
        deptId: data.deptId || null,
        permissions: data.permissions || [],
      };

      return await super.create(firestoreData, userContext, authRecord.uid);
    } catch (err) {
      console.error('[UserRepository] Create failed:', err);
      // Clean up Auth if Firestore fails
      throw new AppError(err.message, 500);
    }
  }

  /**
   * Update user in Auth and Firestore
   */
  async update(id, data, userContext) {
    try {
      // 1. Update Firebase Auth if critical fields changed
      const authUpdates = {};
      let needsAuthUpdate = false;
      let needsClaimsUpdate = false;

      if (data.email) {
        authUpdates.email = data.email;
        needsAuthUpdate = true;
      }
      if (data.firstName || data.lastName) {
        authUpdates.displayName = `${data.firstName || ''} ${data.lastName || ''}`.trim();
        needsAuthUpdate = true;
      }
      if (data.password) {
        authUpdates.password = data.password;
        needsAuthUpdate = true;
      }

      if (needsAuthUpdate) {
        await getAuth().updateUser(id, authUpdates);
      }

      if (data.role || data.orgId || data.deptId) {
        const userRecord = await getAuth().getUser(id);
        const currentClaims = userRecord.customClaims || {};
        await getAuth().setCustomUserClaims(id, {
          ...currentClaims,
          role: data.role || currentClaims.role,
          orgId: data.orgId || currentClaims.orgId,
          deptId: data.deptId || currentClaims.deptId,
        });
      }

      // Clean up password before saving to Firestore
      const firestoreUpdate = { ...data };
      delete firestoreUpdate.password;

      // 2. Update Firestore (triggers audit/versioning)
      return await super.update(id, firestoreUpdate, userContext);
    } catch (err) {
      console.error('[UserRepository] Update failed:', err);
      throw new AppError(err.message, 500);
    }
  }

  /**
   * Special Lifecycle Actions
   */
  async changeLifecycle(id, status, userContext) {
    const validStatuses = ['ACTIVE', 'SUSPENDED', 'LOCKED', 'DISABLED'];
    if (!validStatuses.includes(status)) {
      throw new AppError('Invalid lifecycle status', 400);
    }

    try {
      if (status === 'SUSPENDED' || status === 'DISABLED' || status === 'LOCKED') {
        // Disable in Auth & Revoke tokens to force logout immediately
        await getAuth().updateUser(id, { disabled: true });
        await getAuth().revokeRefreshTokens(id);
      } else if (status === 'ACTIVE') {
        await getAuth().updateUser(id, { disabled: false });
      }

      // Update Firestore to trigger audit logs
      return await super.update(id, { recordStatus: status }, userContext);
    } catch (err) {
      console.error('[UserRepository] Lifecycle change failed:', err);
      throw new AppError(err.message, 500);
    }
  }

  /**
   * Fetch specific User Dashboard Metrics
   */
  async getMetrics() {
    try {
      const [
        totalSnap,
        onlineSnap,
        suspendedSnap,
        inactiveSnap
      ] = await Promise.all([
        this.collection.count().get(),
        this.collection.where('recordStatus', '==', 'ACTIVE').count().get(),
        this.collection.where('recordStatus', '==', 'SUSPENDED').count().get(),
        this.collection.where('recordStatus', '==', 'DISABLED').count().get(),
      ]);

      return {
        total: mapDoc(totalSnap).count,
        active: mapDoc(onlineSnap).count,
        suspended: mapDoc(suspendedSnap).count,
        inactive: mapDoc(inactiveSnap).count,
      };
    } catch (err) {
      throw new AppError('Failed to aggregate user metrics', 500);
    }
  }
}

module.exports = new UserRepository();
