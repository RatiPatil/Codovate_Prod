const express = require('express');
const router = express.Router();
const UserRepository = require('../core/UserRepository');
const ExportService = require('../core/ExportService');
const ApiResponse = require('../utils/ApiResponse');

/**
 * GET /api/admin/enterprise-users/metrics
 * User Dashboard metrics
 */
router.get('/metrics', async (req, res, next) => {
  try {
    const data = await UserRepository.getMetrics();
    return ApiResponse.success(res, 200, "Metrics retrieved", data);
  } catch (err) { next(err); }
});

/**
 * GET /api/admin/enterprise-users
 * List users with pagination and search
 */
router.get('/', async (req, res, next) => {
  try {
    const result = await UserRepository.findMany(req.query, req.dbUser);
    return ApiResponse.success(res, 200, "Users retrieved", result.data, { nextCursor: result.nextCursor });
  } catch (err) { next(err); }
});

/**
 * GET /api/admin/enterprise-users/export
 * Export filtered users to CSV
 */
router.get('/export', async (req, res, next) => {
  try {
    // Pass high limit for export
    const queryParams = { ...req.query, limit: 10000 };
    const result = await UserRepository.findMany(queryParams, req.dbUser);
    return ExportService.toCSV(res, result.data, 'enterprise_users_export.csv');
  } catch (err) { next(err); }
});

/**
 * GET /api/admin/enterprise-users/:id
 * Get single user details
 */
router.get('/:id', async (req, res, next) => {
  try {
    const user = await UserRepository.findById(req.params.id);
    if (!user) return ApiResponse.error(res, 404, "User not found");
    return ApiResponse.success(res, 200, "User retrieved", user);
  } catch (err) { next(err); }
});

/**
 * POST /api/admin/enterprise-users
 * Create user manually
 */
router.post('/', async (req, res, next) => {
  try {
    const user = await UserRepository.create(req.body, req.dbUser);
    return ApiResponse.success(res, 201, "User created successfully", user);
  } catch (err) { next(err); }
});

/**
 * PUT /api/admin/enterprise-users/:id
 * Update user details
 */
router.put('/:id', async (req, res, next) => {
  try {
    const user = await UserRepository.update(req.params.id, req.body, req.dbUser);
    return ApiResponse.success(res, 200, "User updated successfully", user);
  } catch (err) { next(err); }
});

/**
 * PATCH /api/admin/enterprise-users/:id/lifecycle
 * Suspend, Restore, Lock, Disable
 */
router.patch('/:id/lifecycle', async (req, res, next) => {
  try {
    const { status } = req.body;
    const user = await UserRepository.changeLifecycle(req.params.id, status, req.dbUser);
    return ApiResponse.success(res, 200, `User lifecycle changed to ${status}`, user);
  } catch (err) { next(err); }
});

/**
 * DELETE /api/admin/enterprise-users/:id
 * Soft Delete user
 */
router.delete('/:id', async (req, res, next) => {
  try {
    await UserRepository.softDelete(req.params.id, req.dbUser);
    return ApiResponse.success(res, 200, "User soft deleted");
  } catch (err) { next(err); }
});

module.exports = router;
