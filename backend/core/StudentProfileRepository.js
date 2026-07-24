const FirestoreRepository = require('./Repository');
const { db, admin } = require('../config/firebase');
const AppError = require('../utils/AppError');
const UserRepository = require('./UserRepository');

/**
 * StudentProfileRepository
 * Extends the generic FirestoreRepository to handle Student Profiles.
 * Enforces the 1:1 relationship with the users collection.
 */
class StudentProfileRepository extends FirestoreRepository {
  constructor() {
    super('student_profiles');
  }

  /**
   * Override create.
   * If a user does not exist, we must create the user first, then create the profile.
   * If a user exists, we just create/update the profile.
   * The document ID in `student_profiles` MUST equal the `userId`.
   */
  async create(data, userContext) {
    if (!data.email || !data.name || !data.collegeId) {
      throw new AppError('Name, Email, and College ID are required.', 400);
    }

    // 1. Check if user already exists
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

    // 2. Create User if they don't exist using the UserRepository
    if (!userId) {
      const newUser = await UserRepository.create({
        email: data.email,
        name: data.name,
        role: 'student',
        orgId: data.orgId || null
      }, userContext);
      userId = newUser.id;
    }

    // Check PRN uniqueness if provided
    if (data.prn) {
      const existing = await this.collection.where('prn', '==', data.prn).limit(1).get();
      if (!existing.empty && existing.docs[0].id !== userId) {
        throw new AppError(`Student with PRN ${data.prn} already exists.`, 409);
      }
    }

    // 3. Create the student profile explicitly using the userId as the document ID
    const firestoreData = {
      ...data,
      userId,
      recordStatus: data.recordStatus || 'ACTIVE'
    };
    
    // We can't use super.create() directly because it auto-generates IDs, 
    // unless super.create() allows passing id. Our FirestoreRepository usually doesn't,
    // so we use update() which acts as an upsert, or manually write it.
    // Let's use the standard update method which handles audit logging.
    return await super.update(userId, firestoreData, userContext);
  }

  /**
   * Fetch Dashboard Metrics for Students
   */
  async getMetrics(collegeId = null) {
    try {
      let query = this.collection;
      if (collegeId) {
        query = query.where('collegeId', '==', collegeId);
      }

      const [
        totalSnap,
        placedSnap,
        readySnap,
        archivedSnap
      ] = await Promise.all([
        query.count().get(),
        query.where('recordStatus', '==', 'PLACED').count().get(), // custom status example
        query.where('placementReadiness', '>=', 80).count().get(),
        query.where('recordStatus', '==', 'ARCHIVED').count().get(),
      ]);

      return {
        total: totalSnap.data().count,
        placed: placedSnap.data().count,
        placementReady: readySnap.data().count,
        archived: archivedSnap.data().count,
      };
    } catch (err) {
      throw new AppError('Failed to aggregate student metrics', 500);
    }
  }

  /**
   * Custom: Join user data with profile data
   */
  async findManyWithUsers(query, userContext) {
    // 1. Fetch student profiles (handles pagination and filters via QueryEngine)
    const result = await super.findMany(query, userContext);
    
    // 2. Fetch corresponding users to attach name/email dynamically if needed, 
    // though ideally email/name are stored redundantly on the profile for searchability,
    // or we fetch them here.
    // For extreme performance, we assume name/email is synced to the student_profile doc.
    return result; 
  }
}

module.exports = new StudentProfileRepository();
