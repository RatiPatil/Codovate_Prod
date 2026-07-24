const express = require('express');
const router = express.Router();
const MentorProfileRepository = require('../core/MentorProfileRepository');
const ExportService = require('../core/ExportService');
const ApiResponse = require('../utils/ApiResponse');

router.get('/metrics', async (req, res, next) => {
  try {
    const collegeId = req.user.role === 'college_admin' ? req.user.collegeId : null;
    const data = await MentorProfileRepository.getMetrics(collegeId);
    return ApiResponse.success(res, 200, "Metrics retrieved", data);
  } catch (err) { next(err); }
});

router.get('/', async (req, res, next) => {
  try {
    if (req.user.role === 'college_admin') {
      req.query.collegeId = req.user.collegeId;
    }
    const result = await MentorProfileRepository.findManyWithUsers(req.query, req.dbUser);
    return ApiResponse.success(res, 200, "Mentors retrieved", result.data, { nextCursor: result.nextCursor });
  } catch (err) { next(err); }
});

router.get('/export', async (req, res, next) => {
  try {
    const queryParams = { ...req.query, limit: 10000 };
    if (req.user.role === 'college_admin') queryParams.collegeId = req.user.collegeId;
    const result = await MentorProfileRepository.findManyWithUsers(queryParams, req.dbUser);
    return ExportService.toCSV(res, result.data, 'enterprise_mentors_export.csv');
  } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const mentor = await MentorProfileRepository.findById(req.params.id);
    if (!mentor) return ApiResponse.error(res, 404, "Mentor not found");
    
    if (req.user.role === 'college_admin' && mentor.collegeId && mentor.collegeId !== req.user.collegeId) {
      return ApiResponse.error(res, 403, "Access denied");
    }

    return ApiResponse.success(res, 200, "Mentor retrieved", mentor);
  } catch (err) { next(err); }
});

router.post('/', async (req, res, next) => {
  try {
    if (req.user.role === 'college_admin') {
      req.body.collegeId = req.user.collegeId;
    }
    const mentor = await MentorProfileRepository.create(req.body, req.dbUser);
    return ApiResponse.success(res, 201, "Mentor created successfully", mentor);
  } catch (err) { next(err); }
});

router.put('/:id', async (req, res, next) => {
  try {
    const mentor = await MentorProfileRepository.update(req.params.id, req.body, req.dbUser);
    return ApiResponse.success(res, 200, "Mentor updated successfully", mentor);
  } catch (err) { next(err); }
});

router.patch('/:id/lifecycle', async (req, res, next) => {
  try {
    const { status } = req.body;
    const mentor = await MentorProfileRepository.update(req.params.id, { recordStatus: status }, req.dbUser);
    return ApiResponse.success(res, 200, `Mentor status changed to ${status}`, mentor);
  } catch (err) { next(err); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    await MentorProfileRepository.softDelete(req.params.id, req.dbUser);
    return ApiResponse.success(res, 200, "Mentor soft deleted");
  } catch (err) { next(err); }
});

module.exports = router;
