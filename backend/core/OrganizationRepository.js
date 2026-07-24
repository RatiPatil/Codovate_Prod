const FirestoreRepository = require('./Repository');
const { db } = require('../config/firebase');
const AppError = require('../utils/AppError');

/**
 * OrganizationRepository
 * Extends the generic FirestoreRepository to handle organization-specific domain logic.
 */
class OrganizationRepository extends FirestoreRepository {
  constructor() {
    super('organizations');
  }

  /**
   * Override create to ensure organization code uniqueness
   */
  async create(data, userContext) {
    if (!data.name || !data.type) {
      throw new AppError('Organization Name and Type are required.', 400);
    }

    // Check code uniqueness if provided
    if (data.code) {
      const existing = await this.collection.where('code', '==', data.code).limit(1).get();
      if (!existing.empty) {
        throw new AppError(`Organization with code ${data.code} already exists.`, 409);
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
   * Override update to ensure code uniqueness
   */
  async update(id, data, userContext) {
    if (data.code) {
      const existing = await this.collection.where('code', '==', data.code).limit(2).get();
      existing.forEach(doc => {
        if (doc.id !== id) {
          throw new AppError(`Organization with code ${data.code} already exists.`, 409);
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
      throw new AppError('Invalid lifecycle status for organization', 400);
    }

    // Update Firestore to trigger audit logs
    return await super.update(id, { recordStatus: status }, userContext);
  }

  /**
   * Fetch Dashboard Metrics for Organizations
   */
  async getMetrics() {
    try {
      const [
        totalSnap,
        activeSnap,
        collegesSnap,
        companiesSnap,
        archivedSnap
      ] = await Promise.all([
        this.collection.count().get(),
        this.collection.where('recordStatus', '==', 'ACTIVE').count().get(),
        this.collection.where('type', '==', 'college').count().get(),
        this.collection.where('type', '==', 'company').count().get(),
        this.collection.where('recordStatus', '==', 'ARCHIVED').count().get(),
      ]);

      return {
        total: totalSnap.data().count,
        active: activeSnap.data().count,
        colleges: collegesSnap.data().count,
        companies: companiesSnap.data().count,
        archived: archivedSnap.data().count,
      };
    } catch (err) {
      throw new AppError('Failed to aggregate organization metrics', 500);
    }
  }
}

module.exports = new OrganizationRepository();
