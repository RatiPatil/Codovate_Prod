const express = require('express');
const router = express.Router();
const CollegeRepository = require('../core/CollegeRepository');
const ExportService = require('../core/ExportService');
const ApiResponse = require('../utils/ApiResponse');

/**
 * GET /api/admin/colleges/metrics
 * College Dashboard metrics
 */
router.get('/metrics', async (req, res, next) => {
  try {
    const data = await CollegeRepository.getMetrics();
    return ApiResponse.success(res, 200, "Metrics retrieved", data);
  } catch (err) { next(err); }
});

/**
 * GET /api/admin/colleges
 * List colleges with pagination and search
 */
router.get('/', async (req, res, next) => {
  try {
    const result = await CollegeRepository.findMany(req.query, req.dbUser);
    return ApiResponse.success(res, 200, "Colleges retrieved", result.data, { nextCursor: result.nextCursor });
  } catch (err) { next(err); }
});

/**
 * GET /api/admin/colleges/export
 * Export filtered colleges to CSV
 */
router.get('/export', async (req, res, next) => {
  try {
    const queryParams = { ...req.query, limit: 10000 };
    const result = await CollegeRepository.findMany(queryParams, req.dbUser);
    return ExportService.toCSV(res, result.data, 'enterprise_colleges_export.csv');
  } catch (err) { next(err); }
});

/**
 * GET /api/admin/colleges/:id
 * Get single college details
 */
router.get('/:id', async (req, res, next) => {
  try {
    const college = await CollegeRepository.findById(req.params.id);
    if (!college) return ApiResponse.error(res, 404, "College not found");
    return ApiResponse.success(res, 200, "College retrieved", college);
  } catch (err) { next(err); }
});

/**
 * POST /api/admin/colleges
 * Create college
 */
router.post('/', async (req, res, next) => {
  try {
    const college = await CollegeRepository.create(req.body, req.dbUser);
    return ApiResponse.success(res, 201, "College created successfully", college);
  } catch (err) { next(err); }
});

/**
 * PUT /api/admin/colleges/:id
 * Update college details
 */
router.put('/:id', async (req, res, next) => {
  try {
    const college = await CollegeRepository.update(req.params.id, req.body, req.dbUser);
    return ApiResponse.success(res, 200, "College updated successfully", college);
  } catch (err) { next(err); }
});

/**
 * PATCH /api/admin/colleges/:id/lifecycle
 * Suspend, Restore, Archive
 */
router.patch('/:id/lifecycle', async (req, res, next) => {
  try {
    const { status } = req.body;
    const college = await CollegeRepository.changeLifecycle(req.params.id, status, req.dbUser);
    return ApiResponse.success(res, 200, `College lifecycle changed to ${status}`, college);
  } catch (err) { next(err); }
});

/**
 * DELETE /api/admin/colleges/:id
 * Soft Delete college
 */
router.delete('/:id', async (req, res, next) => {
  try {
    await CollegeRepository.softDelete(req.params.id, req.dbUser);
    return ApiResponse.success(res, 200, "College soft deleted");
  } catch (err) { next(err); }
});

module.exports = router;
