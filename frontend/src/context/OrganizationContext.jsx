import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import api from '../api/axios';

const OrganizationContext = createContext();

export const useOrganization = () => useContext(OrganizationContext);

/**
 * OrganizationProvider
 * 
 * Manages the multi-tenant context. A super admin might switch between organizations.
 * A college admin is bound to one organization.
 */
export const OrganizationProvider = ({ children }) => {
  const { user } = useAuth();
  const [currentOrg, setCurrentOrg] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setCurrentOrg(null);
      setLoading(false);
      return;
    }

    // If user is bound to an org, load it
    if (user.orgId) {
      // For now, we mock it. Ideally: api.get(`/organizations/${user.orgId}`)
      setCurrentOrg({ id: user.orgId, name: 'Assigned Organization' });
      setLoading(false);
    } else {
      // Super admin without specific org context loaded
      setCurrentOrg({ id: 'global', name: 'Global System' });
      setLoading(false);
    }
  }, [user]);

  const switchOrganization = (orgId) => {
    if (user?.role !== 'super_admin') {
      console.warn('Only Super Admins can switch org context freely.');
      return;
    }
    // Fetch and set new org context
    setCurrentOrg({ id: orgId, name: `Organization ${orgId}` });
  };

  return (
    <OrganizationContext.Provider value={{ currentOrg, switchOrganization, loading }}>
      {children}
    </OrganizationContext.Provider>
  );
};
