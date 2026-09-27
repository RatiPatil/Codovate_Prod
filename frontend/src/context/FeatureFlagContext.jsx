import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from '../api/axios';
import { useAuth } from './AuthContext';

const FeatureFlagContext = createContext();

export const useFeatureFlags = () => useContext(FeatureFlagContext);

export const FeatureFlagProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [flags, setFlags] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Only fetch flags if authenticated (since flags might be role-based)
    // If your app needs public flags, you'd fetch this unconditionally via a public endpoint
    if (!isAuthenticated) {
      setFlags({});
      setLoading(false);
      return;
    }

    const fetchFlags = async () => {
      try {
        setLoading(true);
        // Note: Currently the backend API for feature flags is admin-only.
        // For a real production app, we would need a public or standard-user endpoint to read flags.
        // For now, we will gracefully handle this if the endpoint isn't accessible to all users.
        const response = await axios.get('/rbac/feature-flags').catch(err => {
          // Ignore 403s for non-admins if the endpoint is admin only
          if (err.response?.status === 403) return { data: { flags: [] } };
          throw err;
        });
        
        const flagsArray = response.data.flags || [];
        
        // Convert array to a key-value object for easy lookup: { beta_ai: true, maintenance_mode: false }
        const flagsMap = flagsArray.reduce((acc, flag) => {
          // Check if this flag has role restrictions
          let isAllowedForRole = true;
          if (flag.allowedRoles && flag.allowedRoles.length > 0) {
            isAllowedForRole = flag.allowedRoles.includes(user?.role) || user?.role === 'super_admin' || user?.role === 'admin';
          }
          
          acc[flag.key] = flag.enabled && isAllowedForRole;
          return acc;
        }, {});
        
        setFlags(flagsMap);
      } catch (error) {
        console.error('[FeatureFlagContext] Failed to fetch flags:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFlags();
  }, [isAuthenticated, user]);

  /**
   * Check if a specific feature flag is enabled
   * @param {string} flagKey
   * @returns {boolean}
   */
  const isFeatureEnabled = (flagKey) => {
    return !!flags[flagKey];
  };

  return (
    <FeatureFlagContext.Provider value={{
      flags,
      loading,
      isFeatureEnabled
    }}>
      {children}
    </FeatureFlagContext.Provider>
  );
};
