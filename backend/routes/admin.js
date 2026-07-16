const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');
const { runDailyPipeline } = require('../jobs/automation');

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

    // Real stats
    stats.users = stats.students + stats.mentors + stats.colleges + stats.companies;
    stats.projects = 0;
    stats.certificates = 0;

    // Initialize charts with 0 values
    const generateChartData = (labelBase, valuesCount) => {
      return Array.from({ length: valuesCount }).map((_, i) => ({
        name: `${labelBase} ${i + 1}`,
        uv: 0,
        pv: 0,
        amt: 0,
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

// Fetch Audit Logs
router.get('/audit-logs', async (req, res) => {
  try {
    const logsSnap = await db.collection('audit_logs')
      .orderBy('timestamp', 'desc')
      .limit(100)
      .get();
      
    const logs = [];
    logsSnap.forEach(doc => {
      logs.push({ id: doc.id, ...doc.data() });
    });
    
    res.json({ success: true, logs });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({ success: false, message: 'Server error fetching audit logs.' });
  }
});

// Fetch Platform Content
router.get('/content', async (req, res) => {
  try {
    const contentSnap = await db.collection('platform_content')
      .orderBy('updated_at', 'desc')
      .get();
      
    const content = [];
    contentSnap.forEach(doc => {
      content.push({ id: doc.id, ...doc.data() });
    });
    
    res.json({ success: true, content });
  } catch (error) {
    console.error('Error fetching platform content:', error);
    res.status(500).json({ success: false, message: 'Server error fetching content.' });
  }
});

// Trigger Background Pipeline Manually
router.post('/trigger-pipeline', async (req, res) => {
  try {
    const result = await runDailyPipeline();
    if (result.success) {
      res.json({ success: true, message: `Pipeline completed. Processed ${result.usersProcessed} users in ${result.executionTime}ms.` });
    } else {
      res.status(500).json({ success: false, message: result.error });
    }
  } catch (error) {
    console.error('Error triggering pipeline:', error);
    res.status(500).json({ success: false, message: 'Server error triggering pipeline.' });
  }
});

module.exports = router;
