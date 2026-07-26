const FirestoreRepository = require('./Repository');
const AppError = require('../utils/AppError');

const {
  mapDoc: mapDoc,
  mapDocs: mapDocs
} = require('../utils/firestoreMapper');

class PlacementDriveRepository extends FirestoreRepository {
  constructor() { super('placement_drives'); }

  async create(data, userContext) {
    if (!data.title || !data.collegeId || !data.jobId || !data.companyId) {
      throw new AppError('Title, College ID, Job ID, and Company ID are required to create a Drive.', 400);
    }

    const firestoreData = {
      ...data,
      recordStatus: data.recordStatus || 'DRAFT' // Strict Workflow: DRAFT -> PENDING_APPROVAL -> APPROVED -> REGISTRATION_OPEN...
    };
    
    return await super.create(firestoreData, userContext);
  }

  async changeWorkflow(id, newStatus, userContext) {
    return await super.update(id, { recordStatus: newStatus }, userContext);
  }

  async getMetrics(collegeId = null) {
    try {
      let query = this.collection;
      if (collegeId) query = query.where('collegeId', '==', collegeId);

      const [totalSnap, draftSnap, activeSnap, completedSnap] = await Promise.all([
        query.count().get(),
        query.where('recordStatus', '==', 'DRAFT').count().get(),
        query.where('recordStatus', '==', 'REGISTRATION_OPEN').count().get(),
        query.where('recordStatus', '==', 'COMPLETED').count().get()
      ]);

      return {
        total: totalSnap.data().count,
        drafts: draftSnap.data().count,
        active: activeSnap.data().count,
        completed: completedSnap.data().count
      };
    } catch (err) {
      throw new AppError('Failed to aggregate Placement Drive metrics', 500);
    }
  }
}

module.exports = new PlacementDriveRepository();
