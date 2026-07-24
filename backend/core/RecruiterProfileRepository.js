const FirestoreRepository = require('./Repository');
const { admin } = require('../config/firebase');
const AppError = require('../utils/AppError');
const UserRepository = require('./UserRepository');

class RecruiterProfileRepository extends FirestoreRepository {
  constructor() { super('recruiter_profiles'); }

  async create(data, userContext) {
    if (!data.email || !data.name || !data.companyId) {
      throw new AppError('Name, Email, and Company ID are required.', 400);
    }

    let userId = data.userId;
    let authUser = null;

    if (!userId) {
      try {
        authUser = await admin.auth().getUserByEmail(data.email);
        userId = authUser.uid;
      } catch (err) {
        if (err.code !== 'auth/user-not-found') throw err;
      }
    }

    if (!userId) {
      const newUser = await UserRepository.create({
        email: data.email,
        name: data.name,
        role: 'company_admin', // Force role to company_admin or recruiter if available. We will map to company_admin so they have company access.
        orgId: data.orgId || null
      }, userContext);
      userId = newUser.id;
    }

    const firestoreData = {
      ...data,
      userId,
      recordStatus: data.recordStatus || 'ACTIVE'
    };
    
    return await super.update(userId, firestoreData, userContext);
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
      throw new AppError('Failed to aggregate Recruiter metrics', 500);
    }
  }

  async findManyWithUsers(query, userContext) {
    return await super.findMany(query, userContext);
  }
}

module.exports = new RecruiterProfileRepository();
