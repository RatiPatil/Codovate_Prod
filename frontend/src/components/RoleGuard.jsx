import React from 'react';
import { useRole } from '../context/RoleContext';

/**
 * RoleGuard
 * 
 * Conditionally renders children if the user has the required role(s).
 * Useful for broad UI hiding where granular permission checking isn't necessary.
 *
 * @param {Object} props
 * @param {string|string[]} props.allowedRoles - The role(s) allowed to see the children
 * @param {React.ReactNode} [props.fallback=null] - Component to render if role is denied
 * @param {React.ReactNode} props.children - Component to render if role is granted
 */
const RoleGuard = ({ allowedRoles, fallback = null, children }) => {
  const { hasRole, loading } = useRole();

  if (loading) {
    return null;
  }

  if (!hasRole(allowedRoles)) {
    return fallback;
  }

  return <>{children}</>;
};

export default RoleGuard;
