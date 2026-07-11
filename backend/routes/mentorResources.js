const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');
const auth = require('../middleware/auth');

const mentorOnly = (req, res, next) => {
  if (req.user.role !== 'mentor') {
    return res.status(403).json({ message: 'Mentor access required.' });
  }
  next();
};

// GET: All resources by mentor
router.get('/', auth, async (req, res) => {
  try {
    let query = db.collection('mentorResources');
    
    // If student, maybe fetch all resources, or resources of a specific mentor
    // If mentor, fetch only their own resources
    if (req.user.role === 'mentor') {
      query = query.where('mentor_id', '==', req.user.id);
    }
    
    const snapshot = await query.get();
    const resources = [];
    snapshot.forEach(doc => resources.push({ id: doc.id, ...doc.data() }));
    
    // Sort by created desc
    resources.sort((a, b) => {
      const tA = a.created_at?.toDate ? a.created_at.toDate().getTime() : 0;
      const tB = b.created_at?.toDate ? b.created_at.toDate().getTime() : 0;
      return tB - tA;
    });

    res.json(resources);
  } catch (error) {
    console.error("Fetch resources error:", error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST: Add a new resource
router.post('/', mentorOnly, async (req, res) => {
  try {
    const { title, description, category, file_url, file_type } = req.body;
    
    if (!title || !file_url) {
      return res.status(400).json({ message: 'Title and File URL are required' });
    }

    const docRef = db.collection('mentorResources').doc();
    const newRes = {
      id: docRef.id,
      mentor_id: req.user.id,
      title,
      description: description || '',
      category: category || 'General',
      file_url,
      file_type: file_type || 'link', // 'pdf', 'video', 'link'
      downloads: 0,
      created_at: new Date()
    };
    
    await docRef.set(newRes);
    res.status(201).json(newRes);
  } catch (error) {
    console.error("Create resource error:", error);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE: Remove resource
router.delete('/:id', mentorOnly, async (req, res) => {
  try {
    const docRef = db.collection('mentorResources').doc(req.params.id);
    const doc = await docRef.get();
    
    if (!doc.exists) return res.status(404).json({ message: 'Not found' });
    if (doc.data().mentor_id !== req.user.id) return res.status(403).json({ message: 'Forbidden' });
    
    await docRef.delete();
    res.json({ message: 'Deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST: Increment download count
router.post('/:id/download', auth, async (req, res) => {
  try {
    const docRef = db.collection('mentorResources').doc(req.params.id);
    const doc = await docRef.get();
    if (doc.exists) {
      await docRef.update({ downloads: (doc.data().downloads || 0) + 1 });
    }
    res.json({ message: 'Count updated' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
