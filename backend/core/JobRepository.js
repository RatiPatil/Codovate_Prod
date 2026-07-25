const FirestoreRepository = require('./Repository');
const AppError = require('../utils/AppError');

const {
  mapDoc: mapDoc,
  mapDocs: mapDocs
} = require('../utils/firestoreMapper');

class JobRepository extends FirestoreRepository {
  constructor() { super('jobs'); }

  async create(data, userContext) {
    if (!data.title || !data.companyId || !data.employmentType) {
      throw new AppError('Job Title, Company ID, and Employment Type are required.', 400);
    }

    const firestoreData = {
      ...data,
      recordStatus: data.recordStatus || 'DRAFT' // Workflow: DRAFT -> PUBLISHED -> CLOSED
    };
    
    return await super.create(firestoreData, userContext);
  }

  async getMetrics(companyId = null) {
    try {
      let query = this.collection;
      if (companyId) query = query.where('companyId', '==', companyId);

      const [totalSnap, activeSnap, internshipSnap] = await Promise.all([
        query.count().get(),
        query.where('recordStatus', '==', 'PUBLISHED').count().get(),
        query.where('employmentType', '==', 'Internship').count().get()
      ]);

      return {
        total: mapDoc(totalSnap).count,
        active: mapDoc(activeSnap).count,
        internships: mapDoc(internshipSnap).count,
        jobs: mapDoc(totalSnap).count - mapDoc(internshipSnap).count
      };
    } catch (err) {
      throw new AppError('Failed to aggregate Job metrics', 500);
    }
  }

  async changeStatus(id, newStatus, userContext) {
    return await super.update(id, { recordStatus: newStatus }, userContext);
  }
}

module.exports = new JobRepository();
