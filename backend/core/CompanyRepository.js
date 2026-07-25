const FirestoreRepository = require('./Repository');
const AppError = require('../utils/AppError');

const {
  mapDoc: mapDoc,
  mapDocs: mapDocs
} = require('../utils/firestoreMapper');

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
        total: mapDoc(totalSnap).count,
        active: mapDoc(activeSnap).count,
        startups: mapDoc(startupSnap).count,
        mncs: mapDoc(mncSnap).count
      };
    } catch (err) {
      throw new AppError('Failed to aggregate Company metrics', 500);
    }
  }
}

module.exports = new CompanyRepository();
