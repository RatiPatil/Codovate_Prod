const FirestoreRepository = require('./Repository');
const { admin } = require('../config/firebase');
const AppError = require('../utils/AppError');
const UserRepository = require('./UserRepository');

const {
  mapDoc: mapDoc,
  mapDocs: mapDocs
} = require('../utils/firestoreMapper');

class FacultyProfileRepository extends FirestoreRepository {
  constructor() { super('faculty_profiles'); }

  async create(data, userContext) {
    if (!data.email || !data.name || !data.collegeId) {
      throw new AppError('Name, Email, and College ID are required.', 400);
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
        role: 'faculty', // Force role
        orgId: data.orgId || null
      }, userContext);
      userId = newUser.id;
    }

    if (data.employeeId) {
      const existing = await this.collection.where('employeeId', '==', data.employeeId).limit(1).get();
      if (!existing.empty && existing.docs[0].id !== userId) {
        throw new AppError(`Faculty with Employee ID ${data.employeeId} already exists.`, 409);
      }
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

      const [totalSnap, activeSnap] = await Promise.all([
        query.count().get(),
        query.where('recordStatus', '==', 'ACTIVE').count().get()
      ]);

      return {
        total: totalSnap.data().count,
        active: activeSnap.data().count
      };
    } catch (err) {
      throw new AppError('Failed to aggregate faculty metrics', 500);
    }
  }

  async findManyWithUsers(query, userContext) {
    return await super.findMany(query, userContext);
  }
}

module.exports = new FacultyProfileRepository();
