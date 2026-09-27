const express = require('express');
const router = express.Router();
const DashboardAnalyticsService = require('../services/DashboardAnalyticsService');
const ApiResponse = require('../utils/ApiResponse');

/**
 * Super Admin Dashboard Routes
 * Base: /api/dashboard/super-admin
 */

// 1. Overview Metrics
router.get('/metrics/overview', async (req, res, next) => {
  try {
    const data = await DashboardAnalyticsService.getOverviewMetrics();
    return ApiResponse.success(res, 200, "Overview metrics retrieved", data);
  } catch (err) {
    next(err);
  }
});

// 2. Platform Health
router.get('/metrics/health', async (req, res, next) => {
  try {
    const data = await DashboardAnalyticsService.getPlatformHealth();
    return ApiResponse.success(res, 200, "Health metrics retrieved", data);
  } catch (err) {
    next(err);
  }
});

// 3. Recent Activity
router.get('/metrics/activity', async (req, res, next) => {
  try {
    const data = await DashboardAnalyticsService.getRecentActivity(15);
    return ApiResponse.success(res, 200, "Recent activity retrieved", data);
  } catch (err) {
    next(err);
  }
});

// 4. Growth Charts
router.get('/metrics/growth', async (req, res, next) => {
  try {
    const data = await DashboardAnalyticsService.getGrowthMetrics();
    return ApiResponse.success(res, 200, "Growth metrics retrieved", data);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
