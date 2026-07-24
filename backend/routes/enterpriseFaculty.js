const express = require('express');
const router = express.Router();
const FacultyProfileRepository = require('../core/FacultyProfileRepository');
const ExportService = require('../core/ExportService');
const ApiResponse = require('../utils/ApiResponse');

router.get('/metrics', async (req, res, next) => {
  try {
    const collegeId = req.user.role === 'college_admin' ? req.user.collegeId : null;
    const data = await FacultyProfileRepository.getMetrics(collegeId);
    return ApiResponse.success(res, 200, "Metrics retrieved", data);
  } catch (err) { next(err); }
});

router.get('/', async (req, res, next) => {
  try {
    if (req.user.role === 'college_admin') {
      req.query.collegeId = req.user.collegeId;
    }
    const result = await FacultyProfileRepository.findManyWithUsers(req.query, req.dbUser);
    return ApiResponse.success(res, 200, "Faculty retrieved", result.data, { nextCursor: result.nextCursor });
  } catch (err) { next(err); }
});

router.get('/export', async (req, res, next) => {
  try {
    const queryParams = { ...req.query, limit: 10000 };
    if (req.user.role === 'college_admin') queryParams.collegeId = req.user.collegeId;
    const result = await FacultyProfileRepository.findManyWithUsers(queryParams, req.dbUser);
    return ExportService.toCSV(res, result.data, 'enterprise_faculty_export.csv');
  } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const faculty = await FacultyProfileRepository.findById(req.params.id);
    if (!faculty) return ApiResponse.error(res, 404, "Faculty not found");
    
    if (req.user.role === 'college_admin' && faculty.collegeId !== req.user.collegeId) {
      return ApiResponse.error(res, 403, "Access denied");
    }

    return ApiResponse.success(res, 200, "Faculty retrieved", faculty);
  } catch (err) { next(err); }
});

router.post('/', async (req, res, next) => {
  try {
    if (req.user.role === 'college_admin') {
      req.body.collegeId = req.user.collegeId;
    }
    const faculty = await FacultyProfileRepository.create(req.body, req.dbUser);
    return ApiResponse.success(res, 201, "Faculty created successfully", faculty);
  } catch (err) { next(err); }
});

router.put('/:id', async (req, res, next) => {
  try {
    const faculty = await FacultyProfileRepository.update(req.params.id, req.body, req.dbUser);
    return ApiResponse.success(res, 200, "Faculty updated successfully", faculty);
  } catch (err) { next(err); }
});

router.patch('/:id/lifecycle', async (req, res, next) => {
  try {
    const { status } = req.body;
    const faculty = await FacultyProfileRepository.update(req.params.id, { recordStatus: status }, req.dbUser);
    return ApiResponse.success(res, 200, `Faculty status changed to ${status}`, faculty);
  } catch (err) { next(err); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    await FacultyProfileRepository.softDelete(req.params.id, req.dbUser);
    return ApiResponse.success(res, 200, "Faculty soft deleted");
  } catch (err) { next(err); }
});

module.exports = router;
