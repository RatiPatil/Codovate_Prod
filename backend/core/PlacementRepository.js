const FirestoreRepository = require('./Repository');
const AppError = require('../utils/AppError');
const OfferRepository = require('./OfferRepository');

const {
  mapDoc: mapDoc,
  mapDocs: mapDocs
} = require('../utils/firestoreMapper');

class PlacementRepository extends FirestoreRepository {
  constructor() { super('placements'); }

  async create(data, userContext) {
    if (!data.offerId || !data.studentId || !data.companyId) {
      throw new AppError('Offer ID, Student ID, and Company ID are required.', 400);
    }

    // STRICT RULE: Placements can only be generated from ACCEPTED offers
    const offerDoc = await OfferRepository.findById(data.offerId);
    if (!offerDoc || offerDoc.recordStatus !== 'ACCEPTED') {
       throw new AppError('Placement records can only be created for ACCEPTED offers.', 403);
    }

    const firestoreData = {
      ...data,
      // Denormalize offer data for reporting speed
      ctc: offerDoc.ctc || 0,
      designation: offerDoc.designation || 'TBD',
      joiningDate: offerDoc.joiningDate || data.joiningDate,
      recordStatus: data.recordStatus || 'OFFER_ACCEPTED', // OFFER_ACCEPTED -> JOINING_PENDING -> JOINED -> DEFERRED / NO_SHOW / WITHDRAWN
      timeline: [{ stage: 'OFFER_ACCEPTED', date: new Date().toISOString(), by: userContext?.email || 'SYSTEM' }]
    };
    
    return await super.create(firestoreData, userContext);
  }

  async getMetrics(companyId = null, collegeId = null) {
    try {
      let query = this.collection;
      if (companyId) query = query.where('companyId', '==', companyId);
      if (collegeId) query = query.where('collegeId', '==', collegeId);

      const allSnap = await query.get();
      let total = 0, joined = 0, highestCtc = 0, sumCtc = 0;
      
      allSnap.forEach(doc => {
        const d = mapDoc(doc);
        total++;
        if (d.recordStatus === 'JOINED') joined++;
        if (d.ctc > highestCtc) highestCtc = d.ctc;
        sumCtc += (d.ctc || 0);
      });

      return {
        total,
        joined,
        highestCtc,
        averageCtc: total > 0 ? (sumCtc / total) : 0
      };
    } catch (err) {
      throw new AppError('Failed to aggregate Placement metrics', 500);
    }
  }

  async updateStatus(id, newStatus, userContext) {
    const docRef = this.collection.doc(id);
    const doc = await docRef.get();
    if (!doc.exists) throw new AppError('Placement Record not found', 404);

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

module.exports = new PlacementRepository();
