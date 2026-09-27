const { db } = require('../config/firebase');
const crypto = require('crypto');

/**
 * AuditService
 * Handles Diffing, Version History, and Audit Logs for the Data Layer.
 */
class AuditService {
  /**
   * Log an update by comparing old and new objects.
   * @param {string} collectionName 
   * @param {string} documentId 
   * @param {Object} oldData 
   * @param {Object} newData 
   * @param {Object} actor - The user performing the action
   */
  static async logUpdate(collectionName, documentId, oldData, newData, actor) {
    try {
      const diff = this.generateDiff(oldData, newData);
      
      // If no meaningful changes, don't log a version
      if (Object.keys(diff).length === 0) return;

      const timestamp = new Date().toISOString();
      const versionId = crypto.randomUUID();

      // 1. Create a version snapshot
      const versionSnapshot = {
        ...newData,
        _versionId: versionId,
        _snapshotAt: timestamp,
        _snapshotBy: actor?.uid || 'system',
        _snapshotReason: 'UPDATE'
      };

      // 2. Create the audit diff log
      const auditLog = {
        collection: collectionName,
        documentId: documentId,
        action: 'UPDATE',
        changes: diff,
        actorId: actor?.uid || 'system',
        actorEmail: actor?.email || 'system',
        orgId: actor?.orgId || null,
        timestamp: timestamp,
        versionId: versionId
      };

      const batch = db.batch();
      
      // Write version
      const versionRef = db.collection(`${collectionName}_versions`).doc(versionId);
      batch.set(versionRef, versionSnapshot);

      // Write audit
      const auditRef = db.collection('auditLogs').doc();
      batch.set(auditRef, auditLog);

      await batch.commit();
    } catch (err) {
      console.error('[AuditService] Failed to log update:', err.message);
    }
  }

  /**
   * Simple shallow diff generator
   */
  static generateDiff(oldObj, newObj) {
    const diff = {};
    const keys = new Set([...Object.keys(oldObj || {}), ...Object.keys(newObj || {})]);
    
    // Ignore internal fields
    const ignored = ['updatedAt', 'updatedBy', 'searchKeywords'];

    for (const key of keys) {
      if (ignored.includes(key)) continue;

      const oldVal = oldObj[key];
      const newVal = newObj[key];

      // Extremely basic comparison (doesn't deeply check nested arrays/objects perfectly)
      if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
        diff[key] = { from: oldVal ?? null, to: newVal ?? null };
      }
    }
    return diff;
  }
}

module.exports = AuditService;
