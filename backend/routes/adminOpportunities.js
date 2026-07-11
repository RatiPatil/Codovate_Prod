const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');
const { body, validationResult } = require('express-validator');

const superAdminOnly = (req, res, next) => {
  if (req.user.role !== 'super_admin' && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Super Admin access required.' });
  }
  next();
};

// GET all opportunities (including inactive)
router.get('/', superAdminOnly, async (req, res) => {
  try {
    const snapshot = await db.collection('opportunities').get();
    const opps = [];
    snapshot.forEach(doc => {
      opps.push({ id: doc.id, ...doc.data() });
    });
    res.json(opps);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// We can just rely on the existing /api/opportunities POST/PUT/DELETE for the rest,
// but since the user requested full CRUD, we'll implement it here for completeness and safety.

// POST new opportunity
router.post('/', superAdminOnly, [
  body('title').notEmpty().withMessage('Title is required'),
  body('type').isIn(['Internship', 'Hackathon', 'Competition', 'Job']).withMessage('Invalid type'),
  body('company').notEmpty().withMessage('Company is required'),
  body('status').isIn(['active', 'inactive']).withMessage('Invalid status')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { title, type, company, description, status, mode, location, deadline } = req.body;
    const newDocRef = db.collection('opportunities').doc();
    const newOpp = {
      id: newDocRef.id,
      title,
      type,
      company,
      description: description || '',
      mode: mode || '',
      location: location || '',
      deadline: deadline || null,
      is_active: status === 'active',
      created_at: new Date()
    };
    await newDocRef.set(newOpp);
    res.status(201).json(newOpp);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT update opportunity
router.put('/:id', superAdminOnly, [
  body('title').optional().notEmpty(),
  body('type').optional().isIn(['Internship', 'Hackathon', 'Competition', 'Job']),
  body('status').optional().isIn(['active', 'inactive'])
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const docRef = db.collection('opportunities').doc(req.params.id);
    const doc = await docRef.get();
    if (!doc.exists) return res.status(404).json({ message: 'Opportunity not found' });

    const updateData = { ...req.body };
    if (updateData.status) {
      updateData.is_active = updateData.status === 'active';
      delete updateData.status;
    }
    
    await docRef.update(updateData);
    const updated = await docRef.get();
    res.json(updated.data());
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE (Soft delete) opportunity
router.delete('/:id', superAdminOnly, async (req, res) => {
  try {
    const docRef = db.collection('opportunities').doc(req.params.id);
    const doc = await docRef.get();
    if (!doc.exists) return res.status(404).json({ message: 'Opportunity not found' });

    await docRef.update({ is_active: false });
    res.json({ message: 'Opportunity deactivated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE (Hard delete) opportunity
router.delete('/:id/hard', superAdminOnly, async (req, res) => {
  try {
    const docRef = db.collection('opportunities').doc(req.params.id);
    const doc = await docRef.get();
    if (!doc.exists) return res.status(404).json({ message: 'Opportunity not found' });

    await docRef.delete();
    res.json({ message: 'Opportunity permanently deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET import history
router.get('/import-history', superAdminOnly, async (req, res) => {
  try {
    const snapshot = await db.collection('import_history').orderBy('created_at', 'desc').limit(50).get();
    const history = [];
    snapshot.forEach(doc => {
      history.push({ id: doc.id, ...doc.data() });
    });
    res.json(history);
  } catch (error) {
    console.error("History fetch error:", error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST bulk import
router.post('/bulk-import', superAdminOnly, [
  body('records').isArray().withMessage('Records must be an array'),
  body('fileName').notEmpty().withMessage('File name is required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { records, fileName, skippedCount = 0 } = req.body;
    let imported = 0;
    let updated = 0;
    let failed = 0;

    const chunkSize = 400; 
    for (let i = 0; i < records.length; i += chunkSize) {
      const chunk = records.slice(i, i + chunkSize);
      const batch = db.batch();
      
      await Promise.all(chunk.map(async (record) => {
        try {
          const existingRef = await db.collection('opportunities')
            .where('title', '==', record.title)
            .where('company', '==', record.company)
            .get();

          let docRef;
          let isUpdate = false;

          if (!existingRef.empty) {
            docRef = existingRef.docs[0].ref;
            isUpdate = true;
          } else {
            docRef = db.collection('opportunities').doc();
          }

          const typeMapping = {
            "Hackathon": "Hackathon",
            "Competition": "Competition",
            "Job": "Job"
          };
          
          let resolvedType = "Internship";
          if (record.jobType && record.jobType.toLowerCase().includes("job")) {
            resolvedType = "Job";
          } else if (record.type && typeMapping[record.type]) {
            resolvedType = typeMapping[record.type];
          }

          const data = {
            title: record.title,
            company: record.company,
            type: resolvedType,
            category: record.category || '',
            domain: record.domain || '',
            mode: record.workMode || record.mode || '',
            location: record.location || '',
            duration: record.duration || '',
            stipend: record.stipend || '',
            jobType: record.jobType || '',
            vacancies: record.vacancies ? Number(record.vacancies) : 1,
            experience: record.experience || '',
            description: record.summary || record.description || '',
            skills: Array.isArray(record.skills) ? record.skills : [],
            keywords: Array.isArray(record.keywords) ? record.keywords : [],
            source: record.source || '',
            applyUrl: record.applyUrl || '',
            is_active: record.status ? (record.status.toLowerCase() === 'active') : true,
            updated_at: new Date(),
            lastModifiedBy: 'Super Admin'
          };

          if (isUpdate) {
            batch.update(docRef, data);
            updated++;
          } else {
            data.id = docRef.id;
            data.created_at = new Date();
            data.createdBy = 'Super Admin';
            batch.set(docRef, data);
            imported++;
          }
        } catch (e) {
          console.error("Record processing error:", e);
          failed++;
        }
      }));
      
      await batch.commit();
    }

    const historyRef = db.collection('import_history').doc();
    const historyData = {
      id: historyRef.id,
      file_name: fileName,
      total_records: records.length + skippedCount,
      imported,
      updated,
      failed,
      skipped: skippedCount,
      imported_by: req.user.name || 'Super Admin',
      created_at: new Date()
    };
    await historyRef.set(historyData);

    res.json({
      message: 'Import completed successfully',
      metrics: {
        total: records.length + skippedCount,
        imported,
        updated,
        failed,
        skipped: skippedCount
      }
    });

  } catch (error) {
    console.error("Bulk import error:", error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
