const FirestoreRepository = require('./Repository');
const AppError = require('../utils/AppError');

class CompanyRepository extends FirestoreRepository {
  constructor() { super('companies'); }

  async create(data, userContext) {
    if (!data.name || !data.industry) {
      throw new AppError('Company Name and Industry are required.', 400);
    }

    const firestoreData = {
      ...data,
      recordStatus: data.recordStatus || 'ACTIVE'
    };
    
    return await super.create(firestoreData, userContext);
  }

  async getMetrics() {
    try {
      const query = this.collection;

      const [totalSnap, activeSnap, startupSnap, mncSnap] = await Promise.all([
        query.count().get(),
        query.where('recordStatus', '==', 'ACTIVE').count().get(),
        query.where('companyType', '==', 'Startup').count().get(),
        query.where('companyType', '==', 'MNC').count().get()
      ]);

      return {
        total: totalSnap.data().count,
        active: activeSnap.data().count,
        startups: startupSnap.data().count,
        mncs: mncSnap.data().count
      };
    } catch (err) {
      throw new AppError('Failed to aggregate Company metrics', 500);
    }
  }
}

module.exports = new CompanyRepository();
