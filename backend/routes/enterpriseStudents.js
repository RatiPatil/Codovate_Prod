const express = require('express');
const router = express.Router();
const StudentProfileRepository = require('../core/StudentProfileRepository');
const ExportService = require('../core/ExportService');
const ApiResponse = require('../utils/ApiResponse');

/**
 * GET /api/admin/students/metrics
 * Student Dashboard metrics
 */
router.get('/metrics', async (req, res, next) => {
  try {
    // If college_admin, filter metrics by their college
    const collegeId = req.user.role === 'college_admin' ? req.user.collegeId : null;
    const data = await StudentProfileRepository.getMetrics(collegeId);
    return ApiResponse.success(res, 200, "Metrics retrieved", data);
  } catch (err) { next(err); }
});

/**
 * GET /api/admin/students
 * List students with pagination and search
 */
router.get('/', async (req, res, next) => {
  try {
    // Inject collegeId filter if college_admin
    if (req.user.role === 'college_admin') {
      req.query.collegeId = req.user.collegeId;
    }
    const result = await StudentProfileRepository.findManyWithUsers(req.query, req.dbUser);
    return ApiResponse.success(res, 200, "Students retrieved", result.data, { nextCursor: result.nextCursor });
  } catch (err) { next(err); }
});

/**
 * GET /api/admin/students/export
 * Export filtered students to CSV
 */
router.get('/export', async (req, res, next) => {
  try {
    const queryParams = { ...req.query, limit: 10000 };
    if (req.user.role === 'college_admin') {
      queryParams.collegeId = req.user.collegeId;
    }
    const result = await StudentProfileRepository.findManyWithUsers(queryParams, req.dbUser);
    return ExportService.toCSV(res, result.data, 'enterprise_students_export.csv');
  } catch (err) { next(err); }
});

/**
 * GET /api/admin/students/:id
 * Get single student details
 */
router.get('/:id', async (req, res, next) => {
  try {
    const student = await StudentProfileRepository.findById(req.params.id);
    if (!student) return ApiResponse.error(res, 404, "Student not found");
    
    // Auth check for college isolation
    if (req.user.role === 'college_admin' && student.collegeId !== req.user.collegeId) {
      return ApiResponse.error(res, 403, "Access denied to this student");
    }

    return ApiResponse.success(res, 200, "Student retrieved", student);
  } catch (err) { next(err); }
});

/**
 * POST /api/admin/students
 * Create student (and user atomically)
 */
router.post('/', async (req, res, next) => {
  try {
    if (req.user.role === 'college_admin') {
      req.body.collegeId = req.user.collegeId;
    }
    const student = await StudentProfileRepository.create(req.body, req.dbUser);
    return ApiResponse.success(res, 201, "Student created successfully", student);
  } catch (err) { next(err); }
});

/**
 * PUT /api/admin/students/:id
 * Update student profile
 */
router.put('/:id', async (req, res, next) => {
  try {
    const student = await StudentProfileRepository.update(req.params.id, req.body, req.dbUser);
    return ApiResponse.success(res, 200, "Student updated successfully", student);
  } catch (err) { next(err); }
});

/**
 * PATCH /api/admin/students/:id/lifecycle
 * Change student status
 */
router.patch('/:id/lifecycle', async (req, res, next) => {
  try {
    const { status } = req.body;
    const student = await StudentProfileRepository.update(req.params.id, { recordStatus: status }, req.dbUser);
    return ApiResponse.success(res, 200, `Student status changed to ${status}`, student);
  } catch (err) { next(err); }
});

/**
 * DELETE /api/admin/students/:id
 * Soft Delete student profile
 */
router.delete('/:id', async (req, res, next) => {
  try {
    await StudentProfileRepository.softDelete(req.params.id, req.dbUser);
    return ApiResponse.success(res, 200, "Student soft deleted");
  } catch (err) { next(err); }
});

module.exports = router;
