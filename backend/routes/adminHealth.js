const express = require('express');
const router = express.Router();
const os = require('os');

const superAdminOnly = (req, res, next) => {
  if (req.user.role !== 'super_admin' && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Super Admin access required.' });
  }
  next();
};

router.get('/', superAdminOnly, (req, res) => {
  try {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const memoryUsagePercent = ((usedMem / totalMem) * 100).toFixed(2);

    const cpus = os.cpus();
    const loadAvg = os.loadavg(); // Returns an array containing the 1, 5, and 15 minute load averages
    
    // Process uptime in seconds
    const uptime = process.uptime();

    res.json({
      status: 'healthy',
      system: {
        platform: os.platform(),
        arch: os.arch(),
        cpuCount: cpus.length,
        cpuModel: cpus[0].model,
        loadAvg,
      },
      memory: {
        totalMem: (totalMem / 1024 / 1024 / 1024).toFixed(2) + ' GB',
        freeMem: (freeMem / 1024 / 1024 / 1024).toFixed(2) + ' GB',
        usedMem: (usedMem / 1024 / 1024 / 1024).toFixed(2) + ' GB',
        usagePercent: memoryUsagePercent
      },
      process: {
        uptime: uptime,
        nodeVersion: process.version
      },
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching health status' });
  }
});

module.exports = router;
