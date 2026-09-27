const express = require('express');
const router = express.Router();
const InterviewRepository = require('../core/InterviewRepository');
const ExportService = require('../core/ExportService');
const ApiResponse = require('../utils/ApiResponse');

router.get('/metrics', async (req, res, next) => {
  try {
    let companyId = null;
    let panelMemberId = null;
    
    if (req.user.role === 'company_admin') {
      companyId = req.user.companyId;
    } else if (req.user.role === 'recruiter') {
      companyId = req.user.companyId;
      panelMemberId = req.user.uid; // Recruiters only see metrics for panels they are on
    }

    const data = await InterviewRepository.getMetrics(companyId, panelMemberId);
    return ApiResponse.success(res, 200, "Metrics retrieved", data);
  } catch (err) { next(err); }
});

router.get('/', async (req, res, next) => {
  try {
    if (req.user.role === 'company_admin') req.query.companyId = req.user.companyId;
    if (req.user.role === 'recruiter') {
      req.query.companyId = req.user.companyId;
      // Depending on strictness, we could enforce panelMemberId here, but often recruiters can see all company interviews. Let's filter if requested.
      // We will allow the frontend to pass panelMemberId=uid if they want the "My Interviews" tab.
    }
    if (req.user.role === 'student') req.query.studentId = req.user.uid;

    const result = await InterviewRepository.findMany(req.query, req.dbUser);
    return ApiResponse.success(res, 200, "Interviews retrieved", result.data, { nextCursor: result.nextCursor });
  } catch (err) { next(err); }
});

router.post('/', async (req, res, next) => {
  try {
    const interview = await InterviewRepository.create(req.body, req.dbUser);
    return ApiResponse.success(res, 201, "Interview Scheduled", interview);
  } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const interview = await InterviewRepository.findById(req.params.id);
    return ApiResponse.success(res, 200, "Interview retrieved", interview);
  } catch (err) { next(err); }
});

router.put('/:id', async (req, res, next) => {
  try {
    const interview = await InterviewRepository.update(req.params.id, req.body, req.dbUser);
    return ApiResponse.success(res, 200, "Interview updated", interview);
  } catch (err) { next(err); }
});

router.patch('/:id/status', async (req, res, next) => {
  try {
    const { status } = req.body;
    const interview = await InterviewRepository.update(req.params.id, { recordStatus: status }, req.dbUser);
    return ApiResponse.success(res, 200, `Interview status changed to ${status}`, interview);
  } catch (err) { next(err); }
});

router.patch('/:id/feedback', async (req, res, next) => {
  try {
    const interview = await InterviewRepository.submitFeedback(req.params.id, req.body, req.dbUser);
    return ApiResponse.success(res, 200, "Feedback submitted successfully", interview);
  } catch (err) { next(err); }
});

router.get('/export', async (req, res, next) => {
  try {
    const queryParams = { ...req.query, limit: 10000 };
    if (req.user.role === 'company_admin' || req.user.role === 'recruiter') queryParams.companyId = req.user.companyId;
    
    const result = await InterviewRepository.findMany(queryParams, req.dbUser);
    return ExportService.toCSV(res, result.data, 'interviews_export.csv');
  } catch (err) { next(err); }
});

module.exports = router;
