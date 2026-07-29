import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const TITLE_MAP = {
  '/': 'Codovate | AI Student Career Platform',
  '/login': 'Codovate | Login',
  '/signup': 'Codovate | Create Account',
  '/forgot-password': 'Codovate | Reset Password',
  '/onboarding': 'Codovate | Onboarding',
  '/dashboard': 'Codovate | Dashboard',
  '/opportunities': 'Codovate | Opportunities',
  '/applications': 'Codovate | My Applications',
  '/profile': 'Codovate | Profile',
  '/calendar': 'Codovate | Calendar',
  '/leaderboard': 'Codovate | Leaderboard',
  '/resume-builder': 'Codovate | Resume Builder',
  '/admin-login': 'Codovate | Admin Login',
  '/recruiter-login': 'Codovate | Recruiter Login',
  '/mentor-login': 'Codovate | Mentor Login',
  '/admin': 'Codovate | Admin Portal',
};

const PageTitleManager = () => {
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname;
    let title = TITLE_MAP[path];

    if (!title) {
      if (path.startsWith('/admin')) {
        title = 'Codovate | Admin Management';
      } else {
        const segment = path.split('/')[1];
        if (segment) {
          const formatted = segment
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
          title = `Codovate | ${formatted}`;
        } else {
          title = 'Codovate | Student Career Platform';
        }
      }
    }

    document.title = title;
  }, [location]);

  return null;
};

export default PageTitleManager;
