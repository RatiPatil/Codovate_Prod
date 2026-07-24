/**
 * organizationScope
 * 
 * Ensures the requesting user belongs to the same organization as the resource
 * they are attempting to access, unless they are a super_admin.
 * 
 * Requires that `req.dbUser` is populated (e.g. via sessionValidation) and 
 * that the resource's orgId is accessible (e.g., passed in params or body).
 */
const organizationScope = (req, res, next) => {
  if (req.user.role === 'super_admin') {
    return next(); // Super admins bypass org scoping
  }

  const userOrgId = req.dbUser?.orgId;
  
  // Extract target orgId from params or body. 
  // Adjust this based on your API design (e.g., /api/orgs/:orgId/users)
  const targetOrgId = req.params.orgId || req.body.orgId;

  if (!userOrgId || !targetOrgId || userOrgId !== targetOrgId) {
    return res.status(403).json({ message: "Forbidden: Cross-organization access denied." });
  }

  next();
};

/**
 * departmentScope
 * 
 * Ensures the requesting user belongs to the same department as the resource,
 * or is an organization admin.
 */
const departmentScope = (req, res, next) => {
  if (req.user.role === 'super_admin' || req.user.role === 'college_admin' || req.user.role === 'company_admin') {
    return next(); // Admins bypass dept scoping
  }

  const userDeptId = req.dbUser?.deptId;
  const targetDeptId = req.params.deptId || req.body.deptId;

  if (!userDeptId || !targetDeptId || userDeptId !== targetDeptId) {
    return res.status(403).json({ message: "Forbidden: Cross-department access denied." });
  }

  next();
};

module.exports = {
  organizationScope,
  departmentScope
};
