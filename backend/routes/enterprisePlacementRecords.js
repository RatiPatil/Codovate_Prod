const express = require('express');
const router = express.Router();
const PlacementRepository = require('../core/PlacementRepository');
const AlumniRepository = require('../core/AlumniRepository');
const ExportService = require('../core/ExportService');
const ApiResponse = require('../utils/ApiResponse');

router.get('/metrics', async (req, res, next) => {
  try {
    let companyId = null;
    let collegeId = null;
    
    if (req.user.role === 'company_admin' || req.user.role === 'recruiter') {
      companyId = req.user.companyId;
    } else if (req.user.role === 'college_admin' || req.user.role === 'tpo') {
      collegeId = req.user.collegeId;
    }

    const data = await PlacementRepository.getMetrics(companyId, collegeId);
    return ApiResponse.success(res, 200, "Metrics retrieved", data);
  } catch (err) { next(err); }
});

router.get('/', async (req, res, next) => {
  try {
    if (req.user.role === 'company_admin' || req.user.role === 'recruiter') req.query.companyId = req.user.companyId;
    if (req.user.role === 'college_admin' || req.user.role === 'tpo') req.query.collegeId = req.user.collegeId;
    if (req.user.role === 'student') req.query.studentId = req.user.uid;

    const result = await PlacementRepository.findMany(req.query, req.dbUser);
    return ApiResponse.success(res, 200, "Placement Records retrieved", result.data, { nextCursor: result.nextCursor });
  } catch (err) { next(err); }
});

router.post('/', async (req, res, next) => {
  try {
    const record = await PlacementRepository.create(req.body, req.dbUser);
    return ApiResponse.success(res, 201, "Placement Record Generated", record);
  } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const record = await PlacementRepository.findById(req.params.id);
    return ApiResponse.success(res, 200, "Placement Record retrieved", record);
  } catch (err) { next(err); }
});

router.put('/:id', async (req, res, next) => {
  try {
    const record = await PlacementRepository.update(req.params.id, req.body, req.dbUser);
    return ApiResponse.success(res, 200, "Placement Record updated", record);
  } catch (err) { next(err); }
});

router.patch('/:id/status', async (req, res, next) => {
  try {
    const { status } = req.body;
    const record = await PlacementRepository.updateStatus(req.params.id, status, req.dbUser);
    
    // If they officially JOINED, they might become Alumni. For now we leave Alumni promotion as a separate API call or trigger
    
    return ApiResponse.success(res, 200, `Placement status changed to ${status}`, record);
  } catch (err) { next(err); }
});

router.post('/alumni', async (req, res, next) => {
  try {
    const { studentId, currentCompany, designation, linkedIn, professionalEmail, mentorshipAvailable } = req.body;
    const alumni = await AlumniRepository.createOrUpdate(studentId, {
      currentCompany, designation, linkedIn, professionalEmail, mentorshipAvailable
    }, req.dbUser);
    return ApiResponse.success(res, 201, "Alumni Profile Updated", alumni);
  } catch (err) { next(err); }
});

router.get('/export', async (req, res, next) => {
  try {
    const queryParams = { ...req.query, limit: 10000 };
    if (req.user.role === 'company_admin' || req.user.role === 'recruiter') queryParams.companyId = req.user.companyId;
    if (req.user.role === 'college_admin' || req.user.role === 'tpo') queryParams.collegeId = req.user.collegeId;
    
    const result = await PlacementRepository.findMany(queryParams, req.dbUser);
    return ExportService.toCSV(res, result.data, 'placements_export.csv');
  } catch (err) { next(err); }
});

module.exports = router;
