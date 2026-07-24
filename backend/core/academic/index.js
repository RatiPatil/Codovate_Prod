const FirestoreRepository = require('../Repository');
const AppError = require('../../utils/AppError');

/**
 * Validates that an entity belongs to a valid hierarchy.
 */
const validateHierarchy = (data, requiredFields) => {
  for (const field of requiredFields) {
    if (!data[field]) {
      throw new AppError(`Missing required hierarchy field: ${field}`, 400);
    }
  }
};

class DepartmentRepository extends FirestoreRepository {
  constructor() { super('departments'); }
  async create(data, userContext) {
    validateHierarchy(data, ['name', 'collegeId']);
    return await super.create({ ...data, recordStatus: data.recordStatus || 'ACTIVE' }, userContext);
  }
}

class ProgramRepository extends FirestoreRepository {
  constructor() { super('programs'); }
  async create(data, userContext) {
    validateHierarchy(data, ['name', 'departmentId', 'collegeId']);
    return await super.create({ ...data, recordStatus: data.recordStatus || 'ACTIVE' }, userContext);
  }
}

class AcademicYearRepository extends FirestoreRepository {
  constructor() { super('academic_years'); }
  async create(data, userContext) {
    validateHierarchy(data, ['name', 'collegeId']);
    return await super.create({ ...data, recordStatus: data.recordStatus || 'ACTIVE' }, userContext);
  }
}

class SemesterRepository extends FirestoreRepository {
  constructor() { super('semesters'); }
  async create(data, userContext) {
    validateHierarchy(data, ['semesterNumber', 'academicYearId', 'programId', 'collegeId']);
    return await super.create({ ...data, recordStatus: data.recordStatus || 'ACTIVE' }, userContext);
  }
}

class DivisionRepository extends FirestoreRepository {
  constructor() { super('divisions'); }
  async create(data, userContext) {
    validateHierarchy(data, ['name', 'semesterId', 'collegeId']);
    return await super.create({ ...data, recordStatus: data.recordStatus || 'ACTIVE' }, userContext);
  }
}

class CourseRepository extends FirestoreRepository {
  constructor() { super('courses'); }
  async create(data, userContext) {
    validateHierarchy(data, ['name', 'code', 'departmentId', 'semesterId', 'collegeId']);
    return await super.create({ ...data, recordStatus: data.recordStatus || 'ACTIVE' }, userContext);
  }
}

module.exports = {
  DepartmentRepository: new DepartmentRepository(),
  ProgramRepository: new ProgramRepository(),
  AcademicYearRepository: new AcademicYearRepository(),
  SemesterRepository: new SemesterRepository(),
  DivisionRepository: new DivisionRepository(),
  CourseRepository: new CourseRepository(),
};
