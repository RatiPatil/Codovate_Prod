const express = require('express');
const router = express.Router();
const TpoProfileRepository = require('../core/TpoProfileRepository');
const PlacementDriveRepository = require('../core/PlacementDriveRepository');
const ExportService = require('../core/ExportService');
const ApiResponse = require('../utils/ApiResponse');
const DriveRegistrationRepository = require('../core/DriveRegistrationRepository');

// --- METRICS ---
router.get('/metrics', async (req, res, next) => {
  try {
    const collegeId = req.user.role === 'college_admin' || req.user.role === 'tpo' ? req.user.collegeId : null;
    const [staffMetrics, driveMetrics] = await Promise.all([
      TpoProfileRepository.getMetrics(collegeId),
      PlacementDriveRepository.getMetrics(collegeId)
    ]);
    return ApiResponse.success(res, 200, "Metrics retrieved", { staff: staffMetrics, drives: driveMetrics });
  } catch (err) { next(err); }
});

// --- STAFF (TPO) ---
router.get('/staff', async (req, res, next) => {
  try {
    if (req.user.role === 'college_admin' || req.user.role === 'tpo') req.query.collegeId = req.user.collegeId;
    const result = await TpoProfileRepository.findManyWithUsers(req.query, req.dbUser);
    return ApiResponse.success(res, 200, "TPO Staff retrieved", result.data, { nextCursor: result.nextCursor });
  } catch (err) { next(err); }
});

router.post('/staff', async (req, res, next) => {
  try {
    if (req.user.role === 'college_admin' || req.user.role === 'tpo') req.body.collegeId = req.user.collegeId;
    const staff = await TpoProfileRepository.create(req.body, req.dbUser);
    return ApiResponse.success(res, 201, "TPO Staff created", staff);
  } catch (err) { next(err); }
});

router.put('/staff/:id', async (req, res, next) => {
  try {
    const staff = await TpoProfileRepository.update(req.params.id, req.body, req.dbUser);
    return ApiResponse.success(res, 200, "TPO Staff updated", staff);
  } catch (err) { next(err); }
});

router.patch('/staff/:id/lifecycle', async (req, res, next) => {
  try {
    const { status } = req.body;
    const staff = await TpoProfileRepository.update(req.params.id, { recordStatus: status }, req.dbUser);
    return ApiResponse.success(res, 200, `TPO Staff status changed to ${status}`, staff);
  } catch (err) { next(err); }
});

router.delete('/staff/:id', async (req, res, next) => {
  try {
    await TpoProfileRepository.softDelete(req.params.id, req.dbUser);
    return ApiResponse.success(res, 200, "TPO Staff deleted");
  } catch (err) { next(err); }
});

router.get('/staff-export', async (req, res, next) => {
  try {
    const queryParams = { ...req.query, limit: 10000 };
    if (req.user.role === 'college_admin' || req.user.role === 'tpo') queryParams.collegeId = req.user.collegeId;
    const result = await TpoProfileRepository.findManyWithUsers(queryParams, req.dbUser);
    return ExportService.toCSV(res, result.data, 'tpo_staff_export.csv');
  } catch (err) { next(err); }
});

// --- DRIVES ---
router.get('/drives', async (req, res, next) => {
  try {
    if (req.user.role === 'college_admin' || req.user.role === 'tpo') req.query.collegeId = req.user.collegeId;
    const result = await PlacementDriveRepository.findMany(req.query, req.dbUser);
    return ApiResponse.success(res, 200, "Drives retrieved", result.data, { nextCursor: result.nextCursor });
  } catch (err) { next(err); }
});

router.post('/drives', async (req, res, next) => {
  try {
    if (req.user.role === 'college_admin' || req.user.role === 'tpo') req.body.collegeId = req.user.collegeId;
    const drive = await PlacementDriveRepository.create(req.body, req.dbUser);
    return ApiResponse.success(res, 201, "Drive created", drive);
  } catch (err) { next(err); }
});

router.put('/drives/:id', async (req, res, next) => {
  try {
    const drive = await PlacementDriveRepository.update(req.params.id, req.body, req.dbUser);
    return ApiResponse.success(res, 200, "Drive updated", drive);
  } catch (err) { next(err); }
});

router.patch('/drives/:id/lifecycle', async (req, res, next) => {
  try {
    const { status } = req.body;
    const drive = await PlacementDriveRepository.update(req.params.id, { recordStatus: status }, req.dbUser);
    return ApiResponse.success(res, 200, `Drive status changed to ${status}`, drive);
  } catch (err) { next(err); }
});

router.delete('/drives/:id', async (req, res, next) => {
  try {
    await PlacementDriveRepository.softDelete(req.params.id, req.dbUser);
    return ApiResponse.success(res, 200, "Drive deleted");
  } catch (err) { next(err); }
});

router.get('/drives-export', async (req, res, next) => {
  try {
    const queryParams = { ...req.query, limit: 10000 };
    if (req.user.role === 'college_admin' || req.user.role === 'tpo') queryParams.collegeId = req.user.collegeId;
    if (req.user.role === 'company_admin') queryParams.companyId = req.user.companyId;
    const result = await PlacementDriveRepository.findMany(queryParams, req.dbUser);
    return ExportService.toCSV(res, result.data, 'placement_drives_export.csv');
  } catch (err) { next(err); }
});

// --- DRIVE WORKFLOW ---
router.patch('/drives/:id/workflow', async (req, res, next) => {
  try {
    const { status } = req.body;
    const drive = await PlacementDriveRepository.changeWorkflow(req.params.id, status, req.dbUser);
    return ApiResponse.success(res, 200, `Drive workflow advanced to ${status}`, drive);
  } catch (err) { next(err); }
});

// --- REGISTRATION ENGINE ---
router.get('/drives/:id/registrations/metrics', async (req, res, next) => {
  try {
    const data = await DriveRegistrationRepository.getMetrics(req.params.id);
    return ApiResponse.success(res, 200, "Registration metrics retrieved", data);
  } catch (err) { next(err); }
});

router.get('/drives/:id/registrations', async (req, res, next) => {
  try {
    const queryParams = { ...req.query, driveId: req.params.id };
    const result = await DriveRegistrationRepository.findMany(queryParams, req.dbUser);
    return ApiResponse.success(res, 200, "Registrations retrieved", result.data, { nextCursor: result.nextCursor });
  } catch (err) { next(err); }
});

router.post('/drives/:id/register', async (req, res, next) => {
  try {
    const payload = { ...req.body, driveId: req.params.id };
    // Students typically hit this route, so we pull their IDs
    if (req.user.role === 'student') {
      payload.studentId = req.user.uid;
      payload.collegeId = req.user.collegeId;
    }
    const reg = await DriveRegistrationRepository.create(payload, req.dbUser);
    return ApiResponse.success(res, 201, "Registration successful", reg);
  } catch (err) { next(err); }
});

router.patch('/drives/:id/registrations/bulk-status', async (req, res, next) => {
  try {
    const { registrationIds, status } = req.body;
    const result = await DriveRegistrationRepository.bulkUpdateStatus(registrationIds, status, req.dbUser);
    return ApiResponse.success(res, 200, "Bulk update successful", result);
  } catch (err) { next(err); }
});

module.exports = router;
