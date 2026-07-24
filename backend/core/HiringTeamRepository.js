const FirestoreRepository = require('./Repository');
const AppError = require('../utils/AppError');

class HiringTeamRepository extends FirestoreRepository {
  constructor() { super('hiring_teams'); }

  async create(data, userContext) {
    if (!data.name || !data.companyId) {
      throw new AppError('Team Name and Company ID are required to create a Hiring Team.', 400);
    }

    const firestoreData = {
      ...data,
      recordStatus: data.recordStatus || 'ACTIVE'
    };
    
    return await super.create(firestoreData, userContext);
  }

  async getMetrics(companyId = null) {
    try {
      let query = this.collection;
      if (companyId) query = query.where('companyId', '==', companyId);

      const [totalSnap, activeSnap] = await Promise.all([
        query.count().get(),
        query.where('recordStatus', '==', 'ACTIVE').count().get()
      ]);

      return {
        total: totalSnap.data().count,
        active: activeSnap.data().count
      };
    } catch (err) {
      throw new AppError('Failed to aggregate Hiring Team metrics', 500);
    }
  }
}

module.exports = new HiringTeamRepository();
