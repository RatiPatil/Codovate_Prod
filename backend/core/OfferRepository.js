const FirestoreRepository = require('./Repository');
const AppError = require('../utils/AppError');

const {
  mapDoc: mapDoc,
  mapDocs: mapDocs
} = require('../utils/firestoreMapper');

class OfferRepository extends FirestoreRepository {
  constructor() { super('offers'); }

  async create(data, userContext) {
    if (!data.applicationId || !data.studentId || !data.companyId || !data.jobId) {
      throw new AppError('Application ID, Student ID, Job ID, and Company ID are required.', 400);
    }

    const firestoreData = {
      ...data,
      recordStatus: data.recordStatus || 'DRAFT', // DRAFT -> PENDING_APPROVAL -> APPROVED -> RELEASED -> VIEWED -> ACCEPTED/REJECTED/WITHDRAWN
      timeline: [{ stage: data.recordStatus || 'DRAFT', date: new Date().toISOString(), by: userContext?.email || 'SYSTEM' }]
    };
    
    return await super.create(firestoreData, userContext);
  }

  async getMetrics(companyId = null, collegeId = null) {
    try {
      let query = this.collection;
      if (companyId) query = query.where('companyId', '==', companyId);
      // NOTE: College ID might need to be joined from the application/drive level if not stored on the offer. 
      // For enterprise scale, we assume collegeId is denormalized onto the offer document during creation.
      if (collegeId) query = query.where('collegeId', '==', collegeId);

      const [totalSnap, releasedSnap, acceptedSnap, rejectedSnap] = await Promise.all([
        query.count().get(),
        query.where('recordStatus', '==', 'RELEASED').count().get(),
        query.where('recordStatus', '==', 'ACCEPTED').count().get(),
        query.where('recordStatus', '==', 'REJECTED').count().get()
      ]);

      return {
        total: totalSnap.data().count,
        released: releasedSnap.data().count,
        accepted: acceptedSnap.data().count,
        rejected: rejectedSnap.data().count
      };
    } catch (err) {
      throw new AppError('Failed to aggregate Offer metrics', 500);
    }
  }

  async updateStatus(id, newStatus, userContext) {
    const docRef = this.collection.doc(id);
    const doc = await docRef.get();
    if (!doc.exists) throw new AppError('Offer not found', 404);

    const data = mapDoc(doc);
    const timeline = data.timeline || [];
    timeline.push({
      stage: newStatus,
      date: new Date().toISOString(),
      by: userContext?.email || 'SYSTEM'
    });

    return await super.update(id, { recordStatus: newStatus, timeline }, userContext);
  }
}

module.exports = new OfferRepository();
