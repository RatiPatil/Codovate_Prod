const { db } = require('../config/firebase');
const os = require('os');
const AppError = require('../utils/AppError');

const {
  mapDoc: mapDoc,
  mapDocs: mapDocs
} = require('../utils/firestoreMapper');

/**
 * Super Admin Dashboard Analytics Service
 * Utilizes highly optimized .count().get() queries to prevent massive document reads.
 */
class DashboardAnalyticsService {
  
  /**
   * 1. Top Level Aggregate Metrics
   */
  static async getOverviewMetrics() {
    try {
      // Fire highly parallelized count queries
      const [
        totalUsersSnap,
        activeUsersTodaySnap,
        totalOrgsSnap,
        totalCollegesSnap,
        totalCompaniesSnap,
        auditLogsSnap
      ] = await Promise.all([
        db.collection('users').count().get(),
        
        // Users who logged in today (assuming lastLogin exists and is ISO)
        db.collection('users')
          .where('lastLogin', '>=', new Date(new Date().setHours(0,0,0,0)).toISOString())
          .count().get(),
          
        db.collection('organizations').count().get(),
        db.collection('organizations').where('type', '==', 'college').count().get(),
        db.collection('organizations').where('type', '==', 'company').count().get(),
        
        // Rough system velocity metric
        db.collection('auditLogs').count().get()
      ]);

      return {
        totalUsers: totalUsersSnap.data().count,
        activeUsersToday: activeUsersTodaySnap.data().count,
        totalOrganizations: totalOrgsSnap.data().count,
        totalColleges: totalCollegesSnap.data().count,
        totalCompanies: totalCompaniesSnap.data().count,
        totalAuditLogs: auditLogsSnap.data().count,
      };
    } catch (err) {
      console.error('[DashboardAnalyticsService] Overview Metrics Error:', err);
      throw new AppError('Failed to aggregate overview metrics', 500);
    }
  }

  /**
   * 2. Recent Activity Feed (Lightweight fetch)
   */
  static async getRecentActivity(limit = 10) {
    try {
      const snapshot = await db.collection('auditLogs')
        .orderBy('timestamp', 'desc')
        .limit(limit)
        .get();

      return snapshot.docs.map(doc => ({ id: doc.id, ...mapDoc(doc) }));
    } catch (err) {
      console.error('[DashboardAnalyticsService] Recent Activity Error:', err);
      throw new AppError('Failed to fetch recent activity', 500);
    }
  }

  /**
   * 3. System & Platform Health
   */
  static async getPlatformHealth() {
    // A. Node.js Process & OS Health
    const memoryUsage = process.memoryUsage();
    const systemMetrics = {
      cpuCount: os.cpus().length,
      freeMemoryMB: Math.round(os.freemem() / 1024 / 1024),
      totalMemoryMB: Math.round(os.totalmem() / 1024 / 1024),
      processMemoryUsedMB: Math.round(memoryUsage.heapUsed / 1024 / 1024),
      uptimeSeconds: Math.round(process.uptime()),
    };

    // B. Database Health Ping (Latency test)
    let dbStatus = 'UNKNOWN';
    let dbLatencyMs = 0;
    try {
      const start = Date.now();
      // Write/Delete a tiny ping document to test actual DB responsiveness
      const pingRef = db.collection('_system_health').doc('ping');
      await pingRef.set({ timestamp: new Date().toISOString() });
      dbLatencyMs = Date.now() - start;
      dbStatus = dbLatencyMs < 1000 ? 'HEALTHY' : 'DEGRADED';
    } catch (err) {
      console.error('[DashboardAnalyticsService] DB Health Ping Failed:', err);
      dbStatus = 'DOWN';
    }

    return {
      system: systemMetrics,
      database: {
        status: dbStatus,
        latencyMs: dbLatencyMs
      },
      api: {
        status: 'HEALTHY' // If this endpoint resolves, API is inherently up
      }
    };
  }

  /**
   * 4. User Growth Data (For Recharts)
   * Fetches trailing 7 days registration count.
   */
  static async getGrowthMetrics() {
    const data = [];
    const today = new Date();
    
    // Create an array of the last 7 days (YYYY-MM-DD)
    const dates = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() - (6 - i));
      return d.toISOString().split('T')[0];
    });

    try {
      // In a real enterprise app, you'd want a cron job aggregating this into a daily stats collection.
      // Doing 7 sequential counts here is okay for an admin dashboard, but could be optimized.
      const promises = dates.map(async (dateStr) => {
        const start = `${dateStr}T00:00:00.000Z`;
        const end = `${dateStr}T23:59:59.999Z`;
        
        const snap = await db.collection('users')
          .where('createdAt', '>=', start)
          .where('createdAt', '<=', end)
          .count().get();
          
        return { name: dateStr, users: snap.data().count };
      });

      const results = await Promise.all(promises);
      return results;
    } catch (err) {
      console.error('[DashboardAnalyticsService] Growth Metrics Error:', err);
      throw new AppError('Failed to fetch growth metrics', 500);
    }
  }

}

module.exports = DashboardAnalyticsService;
