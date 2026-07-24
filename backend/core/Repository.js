const { db } = require('../config/firebase');
const QueryEngine = require('./QueryEngine');
const AuditService = require('./AuditService');
const AppError = require('../utils/AppError');

/**
 * FirestoreRepository
 * 
 * Generic Enterprise Data Access Layer.
 * Supports CRUD, Soft Delete, Auditing, Search, and Cursor Pagination.
 */
class FirestoreRepository {
  /**
   * @param {string} collectionName - Firestore collection name (e.g. 'users', 'internships')
   */
  constructor(collectionName) {
    this.collectionName = collectionName;
    this.collection = db.collection(collectionName);
  }

  /**
   * Find a single document by ID
   */
  async findById(id) {
    const doc = await this.collection.doc(id).get();
    if (!doc.exists) return null;
    
    const data = doc.data();
    // Soft delete check
    if (data.recordStatus === 'DELETED') return null;
    
    return { id: doc.id, ...data };
  }

  /**
   * Advanced find many with Pagination, Search, and Scoping
   * 
   * @param {Object} queryParams - API query string (req.query)
   * @param {Object} userContext - Current user (req.dbUser)
   * @returns {Object} { data: [...], nextCursor: "...", total: number }
   */
  async findMany(queryParams = {}, userContext = null) {
    let q = QueryEngine.compileQuery(this.collection, queryParams, userContext);
    
    // Pagination (limit and cursor)
    const limit = parseInt(queryParams.limit) || 20;
    
    if (queryParams.cursor) {
      const cursorDoc = await this.collection.doc(queryParams.cursor).get();
      if (cursorDoc.exists) {
        q = q.startAfter(cursorDoc);
      }
    }
    
    q = q.limit(limit);

    const snapshot = await q.get();
    
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    let nextCursor = null;
    if (data.length === limit) {
      nextCursor = data[data.length - 1].id;
    }

    return { data, nextCursor };
  }

  /**
   * Create a new document
   * @param {Object} data 
   * @param {Object} userContext 
   * @param {string} [customId] - Optional explicit ID
   */
  async create(data, userContext, customId = null) {
    const now = new Date().toISOString();
    const docData = {
      ...data,
      recordStatus: 'ACTIVE', // Enforce active status
      createdAt: now,
      updatedAt: now,
      createdBy: userContext?.uid || 'system',
      updatedBy: userContext?.uid || 'system',
      orgId: data.orgId || userContext?.orgId || null,
      deptId: data.deptId || userContext?.deptId || null,
    };

    // Generate search keywords if necessary
    docData.searchKeywords = QueryEngine.generateSearchKeywords(docData);

    let docRef;
    if (customId) {
      docRef = this.collection.doc(customId);
      await docRef.set(docData);
    } else {
      docRef = await this.collection.add(docData);
    }

    // Fire audit event for creation
    await AuditService.logUpdate(this.collectionName, docRef.id, null, docData, userContext);

    return { id: docRef.id, ...docData };
  }

  /**
   * Update an existing document (triggers diffing and version history)
   * @param {string} id 
   * @param {Object} data 
   * @param {Object} userContext 
   */
  async update(id, data, userContext) {
    const docRef = this.collection.doc(id);
    const docSnap = await docRef.get();
    
    if (!docSnap.exists) throw new AppError('Document not found', 404);
    
    const oldData = docSnap.data();
    if (oldData.recordStatus === 'DELETED') throw new AppError('Cannot update a deleted record', 400);

    const now = new Date().toISOString();
    const updateData = {
      ...data,
      updatedAt: now,
      updatedBy: userContext?.uid || 'system',
    };

    // Re-generate search keywords based on merged data
    const mergedData = { ...oldData, ...updateData };
    updateData.searchKeywords = QueryEngine.generateSearchKeywords(mergedData);

    // Prevent direct mutation of protected fields
    delete updateData.recordStatus;
    delete updateData.createdAt;
    delete updateData.createdBy;
    delete updateData.orgId; // Can't change tenant

    await docRef.update(updateData);

    // Fire audit event
    await AuditService.logUpdate(this.collectionName, id, oldData, mergedData, userContext);

    return { id, ...mergedData };
  }

  /**
   * Soft delete a document
   * @param {string} id 
   * @param {Object} userContext 
   */
  async softDelete(id, userContext) {
    const docRef = this.collection.doc(id);
    const docSnap = await docRef.get();
    if (!docSnap.exists) throw new AppError('Document not found', 404);
    
    const oldData = docSnap.data();

    const updateData = {
      recordStatus: 'DELETED',
      deletedAt: new Date().toISOString(),
      deletedBy: userContext?.uid || 'system',
      updatedAt: new Date().toISOString(),
      updatedBy: userContext?.uid || 'system',
    };

    await docRef.update(updateData);

    const mergedData = { ...oldData, ...updateData };
    await AuditService.logUpdate(this.collectionName, id, oldData, mergedData, userContext);

    return { id, status: 'DELETED' };
  }

  /**
   * Restore a soft-deleted document
   */
  async restore(id, userContext) {
    const docRef = this.collection.doc(id);
    const docSnap = await docRef.get();
    if (!docSnap.exists) throw new AppError('Document not found', 404);
    
    const oldData = docSnap.data();

    const updateData = {
      recordStatus: 'RESTORED',
      restoredAt: new Date().toISOString(),
      restoredBy: userContext?.uid || 'system',
      updatedAt: new Date().toISOString(),
      updatedBy: userContext?.uid || 'system',
    };

    await docRef.update(updateData);
    
    const mergedData = { ...oldData, ...updateData };
    await AuditService.logUpdate(this.collectionName, id, oldData, mergedData, userContext);

    return { id, status: 'RESTORED' };
  }

  /**
   * Archive a document
   */
  async archive(id, userContext) {
    const docRef = this.collection.doc(id);
    const docSnap = await docRef.get();
    if (!docSnap.exists) throw new AppError('Document not found', 404);
    
    const oldData = docSnap.data();

    const updateData = {
      recordStatus: 'ARCHIVED',
      archivedAt: new Date().toISOString(),
      archivedBy: userContext?.uid || 'system',
      updatedAt: new Date().toISOString(),
      updatedBy: userContext?.uid || 'system',
    };

    await docRef.update(updateData);
    
    const mergedData = { ...oldData, ...updateData };
    await AuditService.logUpdate(this.collectionName, id, oldData, mergedData, userContext);

    return { id, status: 'ARCHIVED' };
  }
}

module.exports = FirestoreRepository;
