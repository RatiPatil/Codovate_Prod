const FirestoreRepository = require('./Repository');
const { db } = require('../config/firebase');
const AppError = require('../utils/AppError');

/**
 * CollegeRepository
 * Extends the generic FirestoreRepository to handle college-specific domain logic.
 */
class CollegeRepository extends FirestoreRepository {
  constructor() {
    super('colleges');
  }

  /**
   * Override create to ensure AICTE Code uniqueness
   */
  async create(data, userContext) {
    if (!data.name || !data.orgId) {
      throw new AppError('College Name and Organization ID are required.', 400);
    }

    // Check AICTE code uniqueness if provided
    if (data.aicteCode) {
      const existing = await this.collection.where('aicteCode', '==', data.aicteCode).limit(1).get();
      if (!existing.empty) {
        throw new AppError(`College with AICTE Code ${data.aicteCode} already exists.`, 409);
      }
    }

    // Default status
    const firestoreData = {
      ...data,
      recordStatus: data.recordStatus || 'ACTIVE'
    };

    return await super.create(firestoreData, userContext);
  }

  /**
   * Override update to ensure AICTE code uniqueness
   */
  async update(id, data, userContext) {
    if (data.aicteCode) {
      const existing = await this.collection.where('aicteCode', '==', data.aicteCode).limit(2).get();
      existing.forEach(doc => {
        if (doc.id !== id) {
          throw new AppError(`College with AICTE Code ${data.aicteCode} already exists.`, 409);
        }
      });
    }

    return await super.update(id, data, userContext);
  }

  /**
   * Special Lifecycle Actions
   */
  async changeLifecycle(id, status, userContext) {
    const validStatuses = ['ACTIVE', 'ARCHIVED', 'SUSPENDED'];
    if (!validStatuses.includes(status)) {
      throw new AppError('Invalid lifecycle status for college', 400);
    }

    // Update Firestore to trigger audit logs
    return await super.update(id, { recordStatus: status }, userContext);
  }

  /**
   * Fetch Dashboard Metrics for Colleges
   */
  async getMetrics() {
    try {
      const [
        totalSnap,
        activeSnap,
        autonomousSnap,
        archivedSnap
      ] = await Promise.all([
        this.collection.count().get(),
        this.collection.where('recordStatus', '==', 'ACTIVE').count().get(),
        this.collection.where('autonomousStatus', '==', true).count().get(),
        this.collection.where('recordStatus', '==', 'ARCHIVED').count().get(),
      ]);

      return {
        total: totalSnap.data().count,
        active: activeSnap.data().count,
        autonomous: autonomousSnap.data().count,
        archived: archivedSnap.data().count,
      };
    } catch (err) {
      throw new AppError('Failed to aggregate college metrics', 500);
    }
  }
}

module.exports = new CollegeRepository();
