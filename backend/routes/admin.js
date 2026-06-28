const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');

// Super Admin Stats Endpoint
router.get('/stats', async (req, res) => {
  try {
    const collections = {
      students: db.collection('students').count().get(),
      colleges: db.collection('colleges').count().get(),
      companies: db.collection('companies').count().get(),
      mentors: db.collection('mentors').count().get(),
      teams: db.collection('teams').count().get(),
      jobs: db.collection('opportunities').where('type', '==', 'Job').count().get(),
      internships: db.collection('opportunities').where('type', '==', 'Internship').count().get(),
      hackathons: db.collection('opportunities').where('type', '==', 'Hackathon').count().get(),
      applications: db.collection('applications').count().get(),
    };

    const results = await Promise.all(Object.values(collections));
    const keys = Object.keys(collections);
    
    const stats = {};
    keys.forEach((key, index) => {
      stats[key] = results[index].data().count;
    });

    // We can mock some data that doesn't exist explicitly as a collection yet
    stats.users = stats.students + stats.mentors + stats.colleges + stats.companies;
    stats.projects = stats.students * 3; // Approx 3 projects per student
    stats.certificates = stats.students * 2; // Approx 2 certs per student

    // Generate some fake trend data for the charts
    const generateChartData = (labelBase, valuesCount) => {
      return Array.from({ length: valuesCount }).map((_, i) => ({
        name: `${labelBase} ${i + 1}`,
        uv: Math.floor(Math.random() * 5000) + 1000,
        pv: Math.floor(Math.random() * 5000) + 1000,
        amt: Math.floor(Math.random() * 5000) + 1000,
      }));
    };

    res.json({
      success: true,
      data: stats,
      charts: {
        activeUsers: generateChartData('Day', 7),
        registrations: generateChartData('Month', 6),
        revenue: generateChartData('Q', 4)
      }
    });

  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ success: false, message: 'Server error fetching stats.' });
  }
});

module.exports = router;
