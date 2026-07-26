const FirestoreRepository = require('./Repository');
const { admin } = require('../config/firebase');
const AppError = require('../utils/AppError');
const UserRepository = require('./UserRepository');

const {
  mapDoc: mapDoc,
  mapDocs: mapDocs
} = require('../utils/firestoreMapper');

class MentorProfileRepository extends FirestoreRepository {
  constructor() { super('mentor_profiles'); }

  async create(data, userContext) {
    if (!data.email || !data.name) {
      throw new AppError('Name and Email are required.', 400);
    }

    let userId = data.userId;
    let authUser = null;

    if (!userId) {
      try {
        authUser = await getAuth().getUserByEmail(data.email);
        userId = authUser.uid;
      } catch (err) {
        if (err.code !== 'auth/user-not-found') throw err;
      }
    }

    if (!userId) {
      const newUser = await UserRepository.create({
        email: data.email,
        name: data.name,
        role: 'mentor', // Force role
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

  async getMetrics(collegeId = null) {
    try {
      let query = this.collection;
      if (collegeId) query = query.where('collegeId', '==', collegeId);

      const [totalSnap, activeSnap, industrySnap] = await Promise.all([
        query.count().get(),
        query.where('recordStatus', '==', 'ACTIVE').count().get(),
        query.where('mentorType', '==', 'Industry').count().get()
      ]);

      return {
        total: mapDoc(totalSnap).count,
        active: mapDoc(activeSnap).count,
        industry: mapDoc(industrySnap).count
      };
    } catch (err) {
      throw new AppError('Failed to aggregate mentor metrics', 500);
    }
  }

  async findManyWithUsers(query, userContext) {
    return await super.findMany(query, userContext);
  }
}

module.exports = new MentorProfileRepository();
