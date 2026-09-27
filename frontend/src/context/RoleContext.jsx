import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from '../api/axios';
import { useAuth } from './AuthContext';

const RoleContext = createContext();

export const useRole = () => useContext(RoleContext);

export const RoleProvider = ({ children }) => {
  const { user, token } = useAuth();
  const [permissions, setPermissions] = useState([]);
  const [isWildcard, setIsWildcard] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPermissions = async () => {
      if (!token || !user) {
        setPermissions([]);
        setIsWildcard(false);
        setLoading(false);
        return;
      }

      // Fast-path: Standard student or system admin roles don't need blocking RBAC calls
      if (user.role === 'student') {
        setPermissions([]);
        setIsWildcard(false);
        setLoading(false);
        return;
      }

      if (user.role === 'super_admin' || user.role === 'admin') {
        setPermissions([]);
        setIsWildcard(true);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await axios.get('/rbac/users/me/permissions');
        setPermissions(response.data.permissions || []);
        setIsWildcard(response.data.isWildcard || false);
      } catch (error) {
        console.error('[RoleContext] Failed to fetch permissions:', error);
        setPermissions([]);
        setIsWildcard(false);
      } finally {
        setLoading(false);
      }
    };

    fetchPermissions();
  }, [token, user?.role, user?.id]);

  /**
   * Check if user has ALL of the required permissions
   * @param {string|string[]} requiredPermissions
   * @returns {boolean}
   */
  const hasPermission = (requiredPermissions) => {
    if (isWildcard) return true; // Super admin bypass
    if (!requiredPermissions) return true;

    const required = Array.isArray(requiredPermissions) 
      ? requiredPermissions 
      : [requiredPermissions];

    return required.every(perm => permissions.includes(perm));
  };

  /**
   * Check if user has ANY of the required permissions (OR logic)
   * @param {string[]} requiredPermissions
   * @returns {boolean}
   */
  const hasAnyPermission = (requiredPermissions) => {
    if (isWildcard) return true;
    if (!requiredPermissions || requiredPermissions.length === 0) return true;

    return requiredPermissions.some(perm => permissions.includes(perm));
  };

  /**
   * Check if user has a specific role
   * @param {string|string[]} allowedRoles
   * @returns {boolean}
   */
  const hasRole = (allowedRoles) => {
    if (!user || !user.role) return false;
    
    // Super admins always pass role checks
    if (user.role === 'super_admin' || user.role === 'admin') return true;

    const allowed = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
    return allowed.includes(user.role);
  };

  return (
    <RoleContext.Provider value={{
      role: user?.role || null,
      permissions,
      isWildcard,
      loading,
      hasPermission,
      hasAnyPermission,
      hasRole
    }}>
      {children}
    </RoleContext.Provider>
  );
};
