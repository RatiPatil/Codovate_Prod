const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');

const collegeAdminOnly = (req, res, next) => {
  if (req.user.role !== 'college_admin' && req.user.role !== 'super_admin') {
    return res.status(403).json({ message: 'College Admin access required.' });
  }
  // The college admin MUST have a college_id associated with them.
  if (req.user.role === 'college_admin' && !req.user.college_id) {
    return res.status(403).json({ message: 'No college association found for this admin.' });
  }
  next();
};

// GET students for the admin's college
router.get('/', collegeAdminOnly, async (req, res) => {
  try {
    const targetCollegeId = req.user.role === 'super_admin' ? req.query.college_id : req.user.college_id;
    
    if (!targetCollegeId) {
      return res.status(400).json({ message: 'College ID is required.' });
    }

    const snapshot = await db.collection('students')
                             .where('college_id', '==', targetCollegeId)
                             .get();
    
    const students = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      students.push({ 
        id: doc.id, 
        email: data.email,
        name: data.profile_data?.name || 'Unknown',
        status: data.status,
        is_active: data.is_active,
        college_id: data.college_id,
        created_at: data.created_at
      });
    });
    
    res.json(students);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching students' });
  }
});

// POST add student
router.post('/', collegeAdminOnly, async (req, res) => {
  try {
    const targetCollegeId = req.user.role === 'super_admin' ? req.body.college_id : req.user.college_id;
    const { name, email, status } = req.body;
    
    if (!name || !email) return res.status(400).json({ message: 'Name and Email are required' });

    // Check if user already exists
    const existing = await db.collection('students').where('email', '==', email.toLowerCase()).get();
    if (!existing.empty) return res.status(400).json({ message: 'Email already exists' });

    const newDocRef = db.collection('students').doc();
    const newStudent = {
      id: newDocRef.id,
      email: email.toLowerCase(),
      role: 'student',
      status: status || 'active',
      is_active: status !== 'suspended' && status !== 'banned',
      college_id: targetCollegeId,
      created_at: new Date(),
      profile_data: {
        name: name
      }
    };
    await newDocRef.set(newStudent);
    res.status(201).json(newStudent);
  } catch (error) {
    res.status(500).json({ message: 'Server error adding student' });
  }
});

// PUT update status of a student in their college
router.put('/:id/status', collegeAdminOnly, async (req, res) => {
  try {
    const targetCollegeId = req.user.role === 'super_admin' ? req.body.college_id : req.user.college_id;
    const { status } = req.body; // 'active', 'suspended'

    if (!['active', 'suspended'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const docRef = db.collection('students').doc(req.params.id);
    const doc = await docRef.get();
    
    if (!doc.exists) return res.status(404).json({ message: 'Student not found' });
    
    // Ensure the student belongs to this college admin
    if (doc.data().college_id !== targetCollegeId && req.user.role !== 'super_admin') {
       return res.status(403).json({ message: 'Cannot modify a student from another college.' });
    }

    await docRef.update({ status });
    res.json({ message: 'Student status updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error updating student status' });
  }
});

module.exports = router;
