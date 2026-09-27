const FirestoreRepository = require('./Repository');
const AppError = require('../utils/AppError');

const {
  mapDoc: mapDoc,
  mapDocs: mapDocs
} = require('../utils/firestoreMapper');

class InterviewRepository extends FirestoreRepository {
  constructor() { super('interviews'); }

  async create(data, userContext) {
    if (!data.applicationId || !data.studentId || !data.companyId || !data.jobId) {
      throw new AppError('Application ID, Student ID, Job ID, and Company ID are required.', 400);
    }

    const firestoreData = {
      ...data,
      recordStatus: data.recordStatus || 'SCHEDULED', // SCHEDULED -> CONFIRMED -> IN_PROGRESS -> COMPLETED -> FEEDBACK_SUBMITTED -> PASSED/FAILED
      feedback: data.feedback || null,
      panelMemberIds: data.panelMemberIds || []
    };
    
    return await super.create(firestoreData, userContext);
  }

  async getMetrics(companyId = null, panelMemberId = null) {
    try {
      let query = this.collection;
      if (companyId) query = query.where('companyId', '==', companyId);
      if (panelMemberId) query = query.where('panelMemberIds', 'array-contains', panelMemberId);

      const [totalSnap, scheduledSnap, pendingFeedbackSnap, passedSnap] = await Promise.all([
        query.count().get(),
        query.where('recordStatus', '==', 'SCHEDULED').count().get(),
        query.where('recordStatus', '==', 'COMPLETED').count().get(),
        query.where('recordStatus', '==', 'PASSED').count().get()
      ]);

      return {
        total: totalSnap.data().count,
        scheduled: scheduledSnap.data().count,
        pendingFeedback: pendingFeedbackSnap.data().count,
        passed: passedSnap.data().count
      };
    } catch (err) {
      throw new AppError('Failed to aggregate Interview metrics', 500);
    }
  }

  async submitFeedback(id, feedbackData, userContext) {
    const docRef = this.collection.doc(id);
    const doc = await docRef.get();
    if (!doc.exists) throw new AppError('Interview not found', 404);

    const data = mapDoc(doc);
    if (data.recordStatus !== 'COMPLETED' && data.recordStatus !== 'FEEDBACK_SUBMITTED') {
      throw new AppError('Interview must be COMPLETED before submitting feedback', 400);
    }

    // Determine terminal state based on recommendation
    let newStatus = 'FEEDBACK_SUBMITTED';
    if (feedbackData.recommendation === 'Pass' || feedbackData.recommendation === 'Offer Recommended') {
      newStatus = 'PASSED';
    } else if (feedbackData.recommendation === 'Fail' || feedbackData.recommendation === 'Reject') {
      newStatus = 'FAILED';
    }

    return await super.update(id, { 
      feedback: feedbackData,
      recordStatus: newStatus
    }, userContext);
  }
}

module.exports = new InterviewRepository();
