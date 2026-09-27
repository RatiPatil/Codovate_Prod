const express = require('express');
const router = express.Router();
const CompanyRepository = require('../core/CompanyRepository');
const ExportService = require('../core/ExportService');
const ApiResponse = require('../utils/ApiResponse');

router.get('/metrics', async (req, res, next) => {
  try {
    const data = await CompanyRepository.getMetrics();
    return ApiResponse.success(res, 200, "Metrics retrieved", data);
  } catch (err) { next(err); }
});

router.get('/', async (req, res, next) => {
  try {
    const result = await CompanyRepository.findMany(req.query, req.dbUser);
    return ApiResponse.success(res, 200, "Companies retrieved", result.data, { nextCursor: result.nextCursor });
  } catch (err) { next(err); }
});

router.get('/export', async (req, res, next) => {
  try {
    const queryParams = { ...req.query, limit: 10000 };
    const result = await CompanyRepository.findMany(queryParams, req.dbUser);
    return ExportService.toCSV(res, result.data, 'enterprise_companies_export.csv');
  } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const company = await CompanyRepository.findById(req.params.id);
    if (!company) return ApiResponse.error(res, 404, "Company not found");
    return ApiResponse.success(res, 200, "Company retrieved", company);
  } catch (err) { next(err); }
});

router.post('/', async (req, res, next) => {
  try {
    const company = await CompanyRepository.create(req.body, req.dbUser);
    return ApiResponse.success(res, 201, "Company created successfully", company);
  } catch (err) { next(err); }
});

router.put('/:id', async (req, res, next) => {
  try {
    const company = await CompanyRepository.update(req.params.id, req.body, req.dbUser);
    return ApiResponse.success(res, 200, "Company updated successfully", company);
  } catch (err) { next(err); }
});

router.patch('/:id/lifecycle', async (req, res, next) => {
  try {
    const { status } = req.body;
    const company = await CompanyRepository.update(req.params.id, { recordStatus: status }, req.dbUser);
    return ApiResponse.success(res, 200, `Company status changed to ${status}`, company);
  } catch (err) { next(err); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    await CompanyRepository.softDelete(req.params.id, req.dbUser);
    return ApiResponse.success(res, 200, "Company soft deleted");
  } catch (err) { next(err); }
});

module.exports = router;
