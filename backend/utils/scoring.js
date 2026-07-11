const { db } = require("../config/firebase");

/**
 * Awards points to a student and logs the transaction in point_ledger.
 * Prevents duplicate actions if checkDuplicate is true.
 *
 * @param {string} studentId
 * @param {string} action - The string identifier of the action (e.g., 'profile_complete')
 * @param {number} points - Points to award
 * @param {boolean} checkDuplicate - Whether to check if this action was already awarded for this user
 */
const awardPoints = async (studentId, action, points, checkDuplicate = true) => {
  try {
    const ledgerRef = db.collection('point_ledger');
    
    if (checkDuplicate) {
      // Check if action already exists for this user
      const existing = await ledgerRef
        .where('student_id', '==', studentId)
        .where('action', '==', action)
        .limit(1)
        .get();
        
      if (!existing.empty) {
        console.log(`[Scoring] Action ${action} already awarded to ${studentId}. Skipping.`);
        return false; // Already awarded
      }
    }

    // Use a transaction to safely increment points
    await db.runTransaction(async (transaction) => {
      const studentRef = db.collection('students').doc(studentId);
      const studentDoc = await transaction.get(studentRef);
      
      if (!studentDoc.exists) throw new Error("Student not found");

      const currentPoints = studentDoc.data().total_points || 0;
      const weeklyPoints = studentDoc.data().weekly_points || 0;
      const monthlyPoints = studentDoc.data().monthly_points || 0;

      transaction.update(studentRef, {
        total_points: currentPoints + points,
        weekly_points: weeklyPoints + points,
        monthly_points: monthlyPoints + points,
      });

      const newLedgerDoc = ledgerRef.doc();
      transaction.set(newLedgerDoc, {
        student_id: studentId,
        action: action,
        points: points,
        created_at: new Date()
      });
    });

    console.log(`[Scoring] Awarded ${points} points to ${studentId} for ${action}.`);
    return true;
  } catch (error) {
    console.error("[Scoring Error]", error);
    return false;
  }
};

/**
 * Recalculates the placement readiness score (0-100) based on points and profile completeness.
 */
const updatePlacementScore = async (studentId) => {
  try {
    const studentRef = db.collection('students').doc(studentId);
    const doc = await studentRef.get();
    if (!doc.exists) return;
    
    const data = doc.data();
    const profile = data.profile_data || {};
    
    // Formula: 50% Profile Completeness, 50% Points/Engagement (Cap at 500 points for full 50%)
    const completeness = profile.profile_completion || 0; // 0 to 100
    const points = data.total_points || 0;
    
    let engagementScore = (points / 500) * 100;
    if (engagementScore > 100) engagementScore = 100;
    
    const placementScore = Math.round((completeness * 0.5) + (engagementScore * 0.5));
    
    await studentRef.update({ placement_score: placementScore });
  } catch (err) {
    console.error("[Placement Score Error]", err);
  }
};

module.exports = {
  awardPoints,
  updatePlacementScore
};
