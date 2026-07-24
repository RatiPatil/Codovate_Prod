const express = require('express');
const router = express.Router();
const ApplicationRepository = require('../core/ApplicationRepository');
const ExportService = require('../core/ExportService');
const ApiResponse = require('../utils/ApiResponse');

router.get('/metrics', async (req, res, next) => {
  try {
    let companyId = null;
    let collegeId = null;
    if (req.user.role === 'company_admin' || req.user.role === 'recruiter') companyId = req.user.companyId;
    if (req.user.role === 'college_admin' || req.user.role === 'tpo') collegeId = req.user.collegeId;

    const data = await ApplicationRepository.getMetrics(companyId, collegeId);
    return ApiResponse.success(res, 200, "Metrics retrieved", data);
  } catch (err) { next(err); }
});

router.get('/', async (req, res, next) => {
  try {
    if (req.user.role === 'company_admin' || req.user.role === 'recruiter') req.query.companyId = req.user.companyId;
    if (req.user.role === 'college_admin' || req.user.role === 'tpo') req.query.collegeId = req.user.collegeId;
    if (req.user.role === 'student') req.query.studentId = req.user.uid;

    const result = await ApplicationRepository.findMany(req.query, req.dbUser);
    return ApiResponse.success(res, 200, "Applications retrieved", result.data, { nextCursor: result.nextCursor });
  } catch (err) { next(err); }
});

router.post('/', async (req, res, next) => {
  try {
    const payload = req.body;
    if (req.user.role === 'student') {
      payload.studentId = req.user.uid;
      payload.collegeId = req.user.collegeId;
    }
    const app = await ApplicationRepository.create(payload, req.dbUser);
    return ApiResponse.success(res, 201, "Application submitted", app);
  } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const app = await ApplicationRepository.findById(req.params.id);
    return ApiResponse.success(res, 200, "Application retrieved", app);
  } catch (err) { next(err); }
});

router.patch('/:id/stage', async (req, res, next) => {
  try {
    const { stage } = req.body;
    const app = await ApplicationRepository.advanceStage(req.params.id, stage, req.dbUser);
    return ApiResponse.success(res, 200, `Application moved to ${stage}`, app);
  } catch (err) { next(err); }
});

router.patch('/bulk-stage', async (req, res, next) => {
  try {
    const { applicationIds, stage } = req.body;
    const result = await ApplicationRepository.bulkUpdateStage(applicationIds, stage, req.dbUser);
    return ApiResponse.success(res, 200, "Bulk stage update successful", result);
  } catch (err) { next(err); }
});

router.get('/export', async (req, res, next) => {
  try {
    const queryParams = { ...req.query, limit: 10000 };
    if (req.user.role === 'company_admin' || req.user.role === 'recruiter') queryParams.companyId = req.user.companyId;
    if (req.user.role === 'college_admin' || req.user.role === 'tpo') queryParams.collegeId = req.user.collegeId;
    
    const result = await ApplicationRepository.findMany(queryParams, req.dbUser);
    return ExportService.toCSV(res, result.data, 'applications_export.csv');
  } catch (err) { next(err); }
});

module.exports = router;
