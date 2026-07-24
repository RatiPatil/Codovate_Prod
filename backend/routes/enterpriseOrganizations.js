const express = require('express');
const router = express.Router();
const OrganizationRepository = require('../core/OrganizationRepository');
const ExportService = require('../core/ExportService');
const ApiResponse = require('../utils/ApiResponse');

/**
 * GET /api/admin/organizations/metrics
 * Organization Dashboard metrics
 */
router.get('/metrics', async (req, res, next) => {
  try {
    const data = await OrganizationRepository.getMetrics();
    return ApiResponse.success(res, 200, "Metrics retrieved", data);
  } catch (err) { next(err); }
});

/**
 * GET /api/admin/organizations
 * List organizations with pagination and search
 */
router.get('/', async (req, res, next) => {
  try {
    const result = await OrganizationRepository.findMany(req.query, req.dbUser);
    return ApiResponse.success(res, 200, "Organizations retrieved", result.data, { nextCursor: result.nextCursor });
  } catch (err) { next(err); }
});

/**
 * GET /api/admin/organizations/export
 * Export filtered organizations to CSV
 */
router.get('/export', async (req, res, next) => {
  try {
    const queryParams = { ...req.query, limit: 10000 };
    const result = await OrganizationRepository.findMany(queryParams, req.dbUser);
    return ExportService.toCSV(res, result.data, 'enterprise_organizations_export.csv');
  } catch (err) { next(err); }
});

/**
 * GET /api/admin/organizations/:id
 * Get single organization details
 */
router.get('/:id', async (req, res, next) => {
  try {
    const org = await OrganizationRepository.findById(req.params.id);
    if (!org) return ApiResponse.error(res, 404, "Organization not found");
    return ApiResponse.success(res, 200, "Organization retrieved", org);
  } catch (err) { next(err); }
});

/**
 * POST /api/admin/organizations
 * Create organization
 */
router.post('/', async (req, res, next) => {
  try {
    const org = await OrganizationRepository.create(req.body, req.dbUser);
    return ApiResponse.success(res, 201, "Organization created successfully", org);
  } catch (err) { next(err); }
});

/**
 * PUT /api/admin/organizations/:id
 * Update organization details
 */
router.put('/:id', async (req, res, next) => {
  try {
    const org = await OrganizationRepository.update(req.params.id, req.body, req.dbUser);
    return ApiResponse.success(res, 200, "Organization updated successfully", org);
  } catch (err) { next(err); }
});

/**
 * PATCH /api/admin/organizations/:id/lifecycle
 * Suspend, Restore, Archive
 */
router.patch('/:id/lifecycle', async (req, res, next) => {
  try {
    const { status } = req.body;
    const org = await OrganizationRepository.changeLifecycle(req.params.id, status, req.dbUser);
    return ApiResponse.success(res, 200, `Organization lifecycle changed to ${status}`, org);
  } catch (err) { next(err); }
});

/**
 * DELETE /api/admin/organizations/:id
 * Soft Delete organization
 */
router.delete('/:id', async (req, res, next) => {
  try {
    await OrganizationRepository.softDelete(req.params.id, req.dbUser);
    return ApiResponse.success(res, 200, "Organization soft deleted");
  } catch (err) { next(err); }
});

module.exports = router;
