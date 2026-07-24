const FirestoreRepository = require('./Repository');
const AppError = require('../utils/AppError');

class DriveRegistrationRepository extends FirestoreRepository {
  constructor() { super('drive_registrations'); }

  async create(data, userContext) {
    if (!data.driveId || !data.jobId || !data.studentId || !data.collegeId) {
      throw new AppError('Drive ID, Job ID, Student ID, and College ID are required for registration.', 400);
    }

    const firestoreData = {
      ...data,
      recordStatus: data.recordStatus || 'REGISTERED',
      appliedAt: new Date().toISOString()
    };
    
    return await super.create(firestoreData, userContext);
  }

  async getMetrics(driveId) {
    try {
      const query = this.collection.where('driveId', '==', driveId);

      const [totalSnap, shortlistedSnap, offeredSnap] = await Promise.all([
        query.count().get(),
        query.where('recordStatus', '==', 'SHORTLISTED').count().get(),
        query.where('recordStatus', '==', 'OFFERED').count().get()
      ]);

      return {
        total: totalSnap.data().count,
        shortlisted: shortlistedSnap.data().count,
        offered: offeredSnap.data().count
      };
    } catch (err) {
      throw new AppError('Failed to aggregate Registration metrics', 500);
    }
  }

  async bulkUpdateStatus(registrationIds, newStatus, userContext) {
    if (!Array.isArray(registrationIds) || registrationIds.length === 0) {
      throw new AppError('No registrations provided', 400);
    }
    const batch = this.db.batch();
    const timestamp = new Date().toISOString();

    for (const id of registrationIds) {
      const ref = this.collection.doc(id);
      batch.update(ref, {
        recordStatus: newStatus,
        updatedAt: timestamp,
        lastModifiedBy: userContext?.email || 'SYSTEM'
      });
    }

    await batch.commit();
    // Audit log should ideally be dispatched here for bulk operation
    return { success: true, count: registrationIds.length };
  }
}

module.exports = new DriveRegistrationRepository();
