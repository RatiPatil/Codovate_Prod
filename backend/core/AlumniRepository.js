const FirestoreRepository = require('./Repository');
const AppError = require('../utils/AppError');

class AlumniRepository extends FirestoreRepository {
  constructor() { super('alumni'); }

  async createOrUpdate(studentId, data, userContext) {
    if (!studentId) throw new AppError('Student ID is required.', 400);

    const existing = await this.collection.where('studentId', '==', studentId).limit(1).get();
    if (!existing.empty) {
      const docId = existing.docs[0].id;
      return await super.update(docId, data, userContext);
    }

    const firestoreData = {
      studentId,
      ...data,
      recordStatus: 'ACTIVE',
      promotedAt: new Date().toISOString()
    };
    
    return await super.create(firestoreData, userContext);
  }
}

module.exports = new AlumniRepository();
