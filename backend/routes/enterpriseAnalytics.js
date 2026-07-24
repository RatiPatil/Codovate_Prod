const express = require('express');
const router = express.Router();
const AnalyticsEngine = require('../core/AnalyticsEngine');
const ApiResponse = require('../utils/ApiResponse');

router.get('/super-admin', async (req, res, next) => {
  try {
    const data = await AnalyticsEngine.getSuperAdminMetrics();
    return ApiResponse.success(res, 200, "Super Admin Analytics retrieved", data);
  } catch (err) { next(err); }
});

router.get('/college', async (req, res, next) => {
  try {
    const collegeId = req.user.collegeId;
    const data = await AnalyticsEngine.getCollegeMetrics(collegeId);
    return ApiResponse.success(res, 200, "College Analytics retrieved", data);
  } catch (err) { next(err); }
});

router.get('/company', async (req, res, next) => {
  try {
    const companyId = req.user.companyId;
    const data = await AnalyticsEngine.getCompanyMetrics(companyId);
    return ApiResponse.success(res, 200, "Company Analytics retrieved", data);
  } catch (err) { next(err); }
});

module.exports = router;
