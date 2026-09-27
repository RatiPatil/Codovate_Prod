const express = require('express');
const router = express.Router();
const RecruiterProfileRepository = require('../core/RecruiterProfileRepository');
const HiringTeamRepository = require('../core/HiringTeamRepository');
const ExportService = require('../core/ExportService');
const ApiResponse = require('../utils/ApiResponse');

// --- METRICS ---
router.get('/metrics', async (req, res, next) => {
  try {
    const companyId = req.user.role === 'company_admin' ? req.user.companyId : null;
    const [recruiters, teams] = await Promise.all([
      RecruiterProfileRepository.getMetrics(companyId),
      HiringTeamRepository.getMetrics(companyId)
    ]);
    return ApiResponse.success(res, 200, "Metrics retrieved", { recruiters, teams });
  } catch (err) { next(err); }
});

// --- RECRUITERS ---
router.get('/', async (req, res, next) => {
  try {
    if (req.user.role === 'company_admin') req.query.companyId = req.user.companyId;
    const result = await RecruiterProfileRepository.findManyWithUsers(req.query, req.dbUser);
    return ApiResponse.success(res, 200, "Recruiters retrieved", result.data, { nextCursor: result.nextCursor });
  } catch (err) { next(err); }
});

router.post('/', async (req, res, next) => {
  try {
    if (req.user.role === 'company_admin') req.body.companyId = req.user.companyId;
    const recruiter = await RecruiterProfileRepository.create(req.body, req.dbUser);
    return ApiResponse.success(res, 201, "Recruiter created", recruiter);
  } catch (err) { next(err); }
});

router.put('/:id', async (req, res, next) => {
  try {
    const recruiter = await RecruiterProfileRepository.update(req.params.id, req.body, req.dbUser);
    return ApiResponse.success(res, 200, "Recruiter updated", recruiter);
  } catch (err) { next(err); }
});

router.patch('/:id/lifecycle', async (req, res, next) => {
  try {
    const { status } = req.body;
    const recruiter = await RecruiterProfileRepository.update(req.params.id, { recordStatus: status }, req.dbUser);
    return ApiResponse.success(res, 200, `Recruiter status changed to ${status}`, recruiter);
  } catch (err) { next(err); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    await RecruiterProfileRepository.softDelete(req.params.id, req.dbUser);
    return ApiResponse.success(res, 200, "Recruiter deleted");
  } catch (err) { next(err); }
});

router.get('/export', async (req, res, next) => {
  try {
    const queryParams = { ...req.query, limit: 10000 };
    if (req.user.role === 'company_admin') queryParams.companyId = req.user.companyId;
    const result = await RecruiterProfileRepository.findManyWithUsers(queryParams, req.dbUser);
    return ExportService.toCSV(res, result.data, 'enterprise_recruiters_export.csv');
  } catch (err) { next(err); }
});

// --- HIRING TEAMS ---
router.get('/teams/list', async (req, res, next) => {
  try {
    if (req.user.role === 'company_admin') req.query.companyId = req.user.companyId;
    const result = await HiringTeamRepository.findMany(req.query, req.dbUser);
    return ApiResponse.success(res, 200, "Teams retrieved", result.data, { nextCursor: result.nextCursor });
  } catch (err) { next(err); }
});

router.post('/teams', async (req, res, next) => {
  try {
    if (req.user.role === 'company_admin') req.body.companyId = req.user.companyId;
    const team = await HiringTeamRepository.create(req.body, req.dbUser);
    return ApiResponse.success(res, 201, "Team created", team);
  } catch (err) { next(err); }
});

router.put('/teams/:id', async (req, res, next) => {
  try {
    const team = await HiringTeamRepository.update(req.params.id, req.body, req.dbUser);
    return ApiResponse.success(res, 200, "Team updated", team);
  } catch (err) { next(err); }
});

router.patch('/teams/:id/lifecycle', async (req, res, next) => {
  try {
    const { status } = req.body;
    const team = await HiringTeamRepository.update(req.params.id, { recordStatus: status }, req.dbUser);
    return ApiResponse.success(res, 200, `Team status changed to ${status}`, team);
  } catch (err) { next(err); }
});

router.delete('/teams/:id', async (req, res, next) => {
  try {
    await HiringTeamRepository.softDelete(req.params.id, req.dbUser);
    return ApiResponse.success(res, 200, "Team deleted");
  } catch (err) { next(err); }
});

module.exports = router;
