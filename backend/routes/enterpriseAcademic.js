const express = require('express');
const router = express.Router();
const ApiResponse = require('../utils/ApiResponse');
const ExportService = require('../core/ExportService');
const {
  DepartmentRepository,
  ProgramRepository,
  AcademicYearRepository,
  SemesterRepository,
  DivisionRepository,
  CourseRepository
} = require('../core/academic');

const {
  mapDoc: mapDoc,
  mapDocs: mapDocs
} = require('../utils/firestoreMapper');

// Helper generator to avoid 6x repetitive CRUD boilerplate
const generateCrudRouter = (Repository, exportFilename) => {
  const r = express.Router();

  r.get('/', async (req, res, next) => {
    try {
      const result = await Repository.findMany(req.query, req.dbUser);
      return ApiResponse.success(res, 200, "Records retrieved", result.data, { nextCursor: result.nextCursor });
    } catch (err) { next(err); }
  });

  r.get('/export', async (req, res, next) => {
    try {
      const queryParams = { ...req.query, limit: 10000 };
      const result = await Repository.findMany(queryParams, req.dbUser);
      return ExportService.toCSV(res, result.data, exportFilename);
    } catch (err) { next(err); }
  });

  r.get('/:id', async (req, res, next) => {
    try {
      const record = await Repository.findById(req.params.id);
      if (!record) return ApiResponse.error(res, 404, "Record not found");
      return ApiResponse.success(res, 200, "Record retrieved", record);
    } catch (err) { next(err); }
  });

  r.post('/', async (req, res, next) => {
    try {
      const record = await Repository.create(req.body, req.dbUser);
      return ApiResponse.success(res, 201, "Record created successfully", record);
    } catch (err) { next(err); }
  });

  r.put('/:id', async (req, res, next) => {
    try {
      const record = await Repository.update(req.params.id, req.body, req.dbUser);
      return ApiResponse.success(res, 200, "Record updated successfully", record);
    } catch (err) { next(err); }
  });

  r.patch('/:id/lifecycle', async (req, res, next) => {
    try {
      const { status } = req.body;
      const record = await Repository.update(req.params.id, { recordStatus: status }, req.dbUser);
      return ApiResponse.success(res, 200, `Record status changed to ${status}`, record);
    } catch (err) { next(err); }
  });

  r.delete('/:id', async (req, res, next) => {
    try {
      await Repository.softDelete(req.params.id, req.dbUser);
      return ApiResponse.success(res, 200, "Record soft deleted");
    } catch (err) { next(err); }
  });

  return r;
};

// Mount the generated routers
router.use('/departments', generateCrudRouter(DepartmentRepository, 'departments_export.csv'));
router.use('/programs', generateCrudRouter(ProgramRepository, 'programs_export.csv'));
router.use('/academic-years', generateCrudRouter(AcademicYearRepository, 'academic_years_export.csv'));
router.use('/semesters', generateCrudRouter(SemesterRepository, 'semesters_export.csv'));
router.use('/divisions', generateCrudRouter(DivisionRepository, 'divisions_export.csv'));
router.use('/courses', generateCrudRouter(CourseRepository, 'courses_export.csv'));

// Statistics Engine spanning all structures
router.get('/metrics', async (req, res, next) => {
  try {
    const [deptSnap, progSnap, yearSnap, semSnap, divSnap, courseSnap] = await Promise.all([
      DepartmentRepository.collection.where('recordStatus', '==', 'ACTIVE').count().get(),
      ProgramRepository.collection.where('recordStatus', '==', 'ACTIVE').count().get(),
      AcademicYearRepository.collection.where('recordStatus', '==', 'ACTIVE').count().get(),
      SemesterRepository.collection.where('recordStatus', '==', 'ACTIVE').count().get(),
      DivisionRepository.collection.where('recordStatus', '==', 'ACTIVE').count().get(),
      CourseRepository.collection.where('recordStatus', '==', 'ACTIVE').count().get(),
    ]);

    return ApiResponse.success(res, 200, "Academic metrics retrieved", {
      departments: mapDoc(deptSnap).count,
      programs: mapDoc(progSnap).count,
      academicYears: mapDoc(yearSnap).count,
      semesters: mapDoc(semSnap).count,
      divisions: mapDoc(divSnap).count,
      courses: mapDoc(courseSnap).count,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
