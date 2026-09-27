const express = require('express');
const router = express.Router();
const JobRepository = require('../core/JobRepository');
const ExportService = require('../core/ExportService');
const ApiResponse = require('../utils/ApiResponse');

router.get('/metrics', async (req, res, next) => {
  try {
    const companyId = req.user.role === 'company_admin' ? req.user.companyId : null;
    const data = await JobRepository.getMetrics(companyId);
    return ApiResponse.success(res, 200, "Metrics retrieved", data);
  } catch (err) { next(err); }
});

router.get('/', async (req, res, next) => {
  try {
    if (req.user.role === 'company_admin') req.query.companyId = req.user.companyId;
    const result = await JobRepository.findMany(req.query, req.dbUser);
    return ApiResponse.success(res, 200, "Jobs retrieved", result.data, { nextCursor: result.nextCursor });
  } catch (err) { next(err); }
});

router.post('/', async (req, res, next) => {
  try {
    if (req.user.role === 'company_admin') req.body.companyId = req.user.companyId;
    const job = await JobRepository.create(req.body, req.dbUser);
    return ApiResponse.success(res, 201, "Job created successfully", job);
  } catch (err) { next(err); }
});

router.put('/:id', async (req, res, next) => {
  try {
    const job = await JobRepository.update(req.params.id, req.body, req.dbUser);
    return ApiResponse.success(res, 200, "Job updated successfully", job);
  } catch (err) { next(err); }
});

router.patch('/:id/publish', async (req, res, next) => {
  try {
    const job = await JobRepository.changeStatus(req.params.id, 'PUBLISHED', req.dbUser);
    return ApiResponse.success(res, 200, "Job Published", job);
  } catch (err) { next(err); }
});

router.patch('/:id/close', async (req, res, next) => {
  try {
    const job = await JobRepository.changeStatus(req.params.id, 'CLOSED', req.dbUser);
    return ApiResponse.success(res, 200, "Job Closed", job);
  } catch (err) { next(err); }
});

router.patch('/:id/lifecycle', async (req, res, next) => {
  try {
    const { status } = req.body;
    const job = await JobRepository.update(req.params.id, { recordStatus: status }, req.dbUser);
    return ApiResponse.success(res, 200, `Job status changed to ${status}`, job);
  } catch (err) { next(err); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    await JobRepository.softDelete(req.params.id, req.dbUser);
    return ApiResponse.success(res, 200, "Job deleted");
  } catch (err) { next(err); }
});

router.get('/export', async (req, res, next) => {
  try {
    const queryParams = { ...req.query, limit: 10000 };
    if (req.user.role === 'company_admin') queryParams.companyId = req.user.companyId;
    const result = await JobRepository.findMany(queryParams, req.dbUser);
    return ExportService.toCSV(res, result.data, 'enterprise_jobs_export.csv');
  } catch (err) { next(err); }
});

module.exports = router;
