import React from 'react';
import { useRole } from '../context/RoleContext';

/**
 * PermissionGate
 * 
 * Conditionally renders children if the user has the required permission(s).
 *
 * @param {Object} props
 * @param {string|string[]} props.requires - The permission(s) required (e.g. 'users:create' or ['users:create', 'users:update'])
 * @param {boolean} [props.any=false] - If true, requires ANY of the permissions (OR logic). Defaults to ALL (AND logic).
 * @param {React.ReactNode} [props.fallback=null] - Component to render if permission is denied
 * @param {React.ReactNode} props.children - Component to render if permission is granted
 */
const PermissionGate = ({ requires, any = false, fallback = null, children }) => {
  const { hasPermission, hasAnyPermission, loading } = useRole();

  if (loading) {
    return null; // Or a small spinner if preferred
  }

  const isAllowed = any 
    ? hasAnyPermission(requires)
    : hasPermission(requires);

  if (!isAllowed) {
    return fallback;
  }

  return <>{children}</>;
};

export default PermissionGate;
