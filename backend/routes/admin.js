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

    // Fetch actual students for registration trends
    const studentsSnap = await db.collection('students').get();
    
    const monthlyRegistrations = {};
    const dailyActive = {};
    
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const today = new Date();
    
    // Init last 6 months
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const mName = monthNames[d.getMonth()];
      monthlyRegistrations[mName] = { name: mName, pv: 0, sortKey: d.getTime() };
    }
    
    // Init last 7 days
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dayName = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d.getDay()];
      dailyActive[dayName] = { name: dayName, uv: 0, sortKey: d.getTime() };
    }

    studentsSnap.forEach(doc => {
      const data = doc.data();
      const createdAt = data.created_at?.toDate ? data.created_at.toDate() : (data.created_at ? new Date(data.created_at) : null);
      if (createdAt && !isNaN(createdAt.getTime())) {
        const mName = monthNames[createdAt.getMonth()];
        if (monthlyRegistrations[mName]) {
          monthlyRegistrations[mName].pv += 1;
        }
      }
      
      const lastLogin = data.last_login?.toDate ? data.last_login.toDate() : (data.last_login ? new Date(data.last_login) : null);
      if (lastLogin && !isNaN(lastLogin.getTime())) {
        const timeDiff = today.getTime() - lastLogin.getTime();
        const daysDiff = Math.floor(timeDiff / (1000 * 3600 * 24));
        if (daysDiff >= 0 && daysDiff < 7) {
          const dayName = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][lastLogin.getDay()];
          if(dailyActive[dayName]) {
             dailyActive[dayName].uv += 1;
          }
        }
      }
    });

    const activeUsersChart = Object.values(dailyActive).sort((a,b) => a.sortKey - b.sortKey);
    const registrationsChart = Object.values(monthlyRegistrations).sort((a,b) => a.sortKey - b.sortKey);

    // Mock Revenue Data for B2B SaaS Subscriptions + Job Posting Fees
    // (Since there is no actual billing collection in this MVP)
    const mockRevenue = [
      { name: 'Jan', mrr: 12000, jobs: 4000 },
      { name: 'Feb', mrr: 15000, jobs: 5200 },
      { name: 'Mar', mrr: 19500, jobs: 8100 },
      { name: 'Apr', mrr: 24000, jobs: 10500 },
      { name: 'May', mrr: 31000, jobs: 14200 },
      { name: 'Jun', mrr: 42000, jobs: 21000 },
    ];

    // Mock AI Analytics Data
    const mockAiAnalytics = [
      { name: 'Jan', tokens: 1200000, generations: 4500 },
      { name: 'Feb', tokens: 1800000, generations: 6200 },
      { name: 'Mar', tokens: 2500000, generations: 8900 },
      { name: 'Apr', tokens: 4100000, generations: 14500 },
      { name: 'May', tokens: 6800000, generations: 22000 },
      { name: 'Jun', tokens: 9500000, generations: 31000 },
    ];

    res.json({
      success: true,
      data: {
        ...stats,
        aiTokensUsed: 25900000,
        aiGenerations: 87100
      },
      charts: {
        activeUsers: activeUsersChart,
        registrations: registrationsChart,
        revenue: mockRevenue,
        ai: mockAiAnalytics
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
