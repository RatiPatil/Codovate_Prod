import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from './AuthContext';

const SessionContext = createContext();

export const useSession = () => useContext(SessionContext);

/**
 * SessionProvider
 * 
 * Manages user sessions, idle timeouts, and cross-tab logout synchronization.
 * For a true Enterprise system, it watches activity and automatically logs
 * the user out if they are idle beyond the organization's policy.
 */
export const SessionProvider = ({ children }) => {
  const { token, logout, user } = useAuth();
  const navigate = useNavigate();
  const [sessionTimeoutMs, setSessionTimeoutMs] = useState(30 * 60 * 1000); // Default 30 min
  
  const idleTimer = useRef(null);
  const lastActivity = useRef(Date.now());

  // 1. Fetch Security Policy for Session Timeout
  useEffect(() => {
    if (token && user) {
      // We would ideally fetch the org's security policy here.
      // api.get(`/policies/${user.orgId || 'global'}`)
      //   .then(res => setSessionTimeoutMs(res.data.sessionTimeout * 60 * 1000))
      //   .catch(console.error);
    }
  }, [token, user]);

  // 2. Cross-tab synchronization
  useEffect(() => {
    const syncLogout = (event) => {
      if (event.key === 'logoutEvent') {
        logout(); // Someone logged out in another tab
        navigate('/login');
      }
    };
    window.addEventListener('storage', syncLogout);
    return () => window.removeEventListener('storage', syncLogout);
  }, [logout, navigate]);

  // 3. Idle timeout tracking
  const resetIdleTimer = () => {
    lastActivity.current = Date.now();
  };

  useEffect(() => {
    if (!token) return;

    const checkIdle = setInterval(() => {
      if (Date.now() - lastActivity.current > sessionTimeoutMs) {
        console.warn('[Session] Idle timeout reached. Logging out.');
        logout();
        navigate('/login?reason=timeout');
      }
    }, 60000); // Check every minute

    // Activity listeners
    const events = ['mousemove', 'keydown', 'mousedown', 'touchstart'];
    events.forEach(e => window.addEventListener(e, resetIdleTimer));

    return () => {
      clearInterval(checkIdle);
      events.forEach(e => window.removeEventListener(e, resetIdleTimer));
    };
  }, [token, sessionTimeoutMs, logout, navigate]);

  const revokeAllSessions = async () => {
    try {
      await api.delete('/iam/sessions/all');
      logout();
      window.localStorage.setItem('logoutEvent', Date.now()); // Trigger cross-tab sync
    } catch (err) {
      console.error('Failed to revoke sessions', err);
    }
  };

  return (
    <SessionContext.Provider value={{ revokeAllSessions }}>
      {children}
    </SessionContext.Provider>
  );
};
