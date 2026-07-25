const FirestoreRepository = require('./Repository');
const AppError = require('../utils/AppError');

class ApplicationRepository extends FirestoreRepository {
  constructor() { super('applications'); }

  async create(data, userContext) {
    if (!data.jobId || !data.studentId || !data.companyId) {
      throw new AppError('Job ID, Student ID, and Company ID are required.', 400);
    }

    const firestoreData = {
      ...data,
      recordStatus: data.recordStatus || 'SUBMITTED', // ATS Stages
      appliedAt: new Date().toISOString(),
      timeline: [{ stage: 'SUBMITTED', date: new Date().toISOString(), by: userContext?.email || 'SYSTEM' }]
    };
    
    return await super.create(firestoreData, userContext);
  }

  async getMetrics(companyId = null, collegeId = null) {
    try {
      let query = this.collection;
      if (companyId) query = query.where('companyId', '==', companyId);
      if (collegeId) query = query.where('collegeId', '==', collegeId);

      const [totalSnap, reviewSnap, shortlistSnap, interviewSnap, offerSnap] = await Promise.all([
        query.count().get(),
        query.where('recordStatus', '==', 'UNDER_REVIEW').count().get(),
        query.where('recordStatus', '==', 'SHORTLISTED').count().get(),
        query.where('recordStatus', '==', 'INTERVIEW_SCHEDULED').count().get(),
        query.where('recordStatus', '==', 'OFFER_RELEASED').count().get()
      ]);

      return {
        total: mapDoc(totalSnap).count,
        underReview: mapDoc(reviewSnap).count,
        shortlisted: mapDoc(shortlistSnap).count,
        interviews: mapDoc(interviewSnap).count,
        offers: mapDoc(offerSnap).count
      };
    } catch (err) {
      throw new AppError('Failed to aggregate Application metrics', 500);
    }
  }

  async advanceStage(id, newStage, userContext) {
    const docRef = this.collection.doc(id);
    const doc = await docRef.get();
    if (!doc.exists) throw new AppError('Application not found', 404);

    const data = mapDoc(doc);
    const timeline = data.timeline || [];
    timeline.push({
      stage: newStage,
      date: new Date().toISOString(),
      by: userContext?.email || 'SYSTEM'
    });

    return await super.update(id, { recordStatus: newStage, timeline }, userContext);
  }

  async bulkUpdateStage(applicationIds, newStage, userContext) {
    if (!Array.isArray(applicationIds) || applicationIds.length === 0) {
      throw new AppError('No applications provided', 400);
    }
    const batch = this.db.batch();
    const timestamp = new Date().toISOString();

    for (const id of applicationIds) {
      const ref = this.collection.doc(id);
      // We must append to timeline, but batch updates don't easily allow arrayUnion in this abstract pattern without FieldValue
      // For simplicity in the generic repository, we update status. A real system might do a transaction or use admin.firestore.FieldValue.arrayUnion
      const admin = require('firebase-admin');

      const {
        mapDoc: mapDoc,
        mapDocs: mapDocs
      } = require('../utils/firestoreMapper');

      batch.update(ref, {
        recordStatus: newStage,
        updatedAt: timestamp,
        lastModifiedBy: userContext?.email || 'SYSTEM',
        timeline: admin.firestore.FieldValue.arrayUnion({
           stage: newStage,
           date: timestamp,
           by: userContext?.email || 'SYSTEM'
        })
      });
    }

    await batch.commit();
    return { success: true, count: applicationIds.length };
  }
}

module.exports = new ApplicationRepository();
