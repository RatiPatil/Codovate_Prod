const express = require('express');
const router = express.Router();
const OfferRepository = require('../core/OfferRepository');
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

    const data = await OfferRepository.getMetrics(companyId, collegeId);
    return ApiResponse.success(res, 200, "Metrics retrieved", data);
  } catch (err) { next(err); }
});

router.get('/', async (req, res, next) => {
  try {
    if (req.user.role === 'company_admin' || req.user.role === 'recruiter') req.query.companyId = req.user.companyId;
    if (req.user.role === 'college_admin' || req.user.role === 'tpo') req.query.collegeId = req.user.collegeId;
    if (req.user.role === 'student') req.query.studentId = req.user.uid;

    const result = await OfferRepository.findMany(req.query, req.dbUser);
    return ApiResponse.success(res, 200, "Offers retrieved", result.data, { nextCursor: result.nextCursor });
  } catch (err) { next(err); }
});

router.post('/', async (req, res, next) => {
  try {
    const offer = await OfferRepository.create(req.body, req.dbUser);
    return ApiResponse.success(res, 201, "Offer Drafted", offer);
  } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const offer = await OfferRepository.findById(req.params.id);
    return ApiResponse.success(res, 200, "Offer retrieved", offer);
  } catch (err) { next(err); }
});

router.put('/:id', async (req, res, next) => {
  try {
    const offer = await OfferRepository.update(req.params.id, req.body, req.dbUser);
    return ApiResponse.success(res, 200, "Offer updated", offer);
  } catch (err) { next(err); }
});

router.patch('/:id/status', async (req, res, next) => {
  try {
    const { status } = req.body;
    const offer = await OfferRepository.updateStatus(req.params.id, status, req.dbUser);
    return ApiResponse.success(res, 200, `Offer status changed to ${status}`, offer);
  } catch (err) { next(err); }
});

router.get('/export', async (req, res, next) => {
  try {
    const queryParams = { ...req.query, limit: 10000 };
    if (req.user.role === 'company_admin' || req.user.role === 'recruiter') queryParams.companyId = req.user.companyId;
    if (req.user.role === 'college_admin' || req.user.role === 'tpo') queryParams.collegeId = req.user.collegeId;
    
    const result = await OfferRepository.findMany(queryParams, req.dbUser);
    return ExportService.toCSV(res, result.data, 'offers_export.csv');
  } catch (err) { next(err); }
});

module.exports = router;
