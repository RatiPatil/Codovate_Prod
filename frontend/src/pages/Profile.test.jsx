import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import Profile from './Profile';

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: {
      uid: 'student_123',
      displayName: 'Test Student',
      email: 'student@codovate.in'
    },
    currentUser: {
      uid: 'student_123',
      displayName: 'Test Student',
      email: 'student@codovate.in'
    }
  })
}));

vi.mock('../api', () => ({
  profileApi: {
    get: vi.fn(() => Promise.resolve({
      data: {
        name: 'Test Student',
        email: 'student@codovate.in',
        college: 'IIT Bombay',
        degree: 'B.Tech',
        branch: 'Computer Science',
        graduation_year: '2026',
        city: 'Mumbai',
        state: 'Maharashtra',
        country: 'India',
        skills: ['React', 'Node.js', 'Python'],
        desired_role: 'Full Stack Engineer',
        career_goals: 'Senior Engineering Architect',
        domain_interests: ['Cloud Architecture', 'Artificial Intelligence'],
        bio: 'Passionate software engineering student.',
        resume_url: 'https://codovateprod.appspot.com/resumes/test.pdf',
        portfolio_url: 'https://teststudent.dev',
        github_url: 'https://github.com/teststudent',
        linkedin_url: 'https://linkedin.com/in/teststudent',
        profile_completion: 85
      }
    })),
    update: vi.fn(data => Promise.resolve({ data }))
  }
}));

describe('Profile Page Component', () => {
  it('renders student profile information from backend accurately', async () => {
    render(
      <MemoryRouter>
        <Profile />
      </MemoryRouter>
    );

    // Verify student name and college render
    const nameHeadings = await screen.findAllByText(/Test Student/i);
    expect(nameHeadings.length).toBeGreaterThan(0);

    const collegeTexts = await screen.findAllByText(/IIT Bombay/i);
    expect(collegeTexts.length).toBeGreaterThan(0);

    // Verify skills render
    const skillReact = await screen.findByText(/React/i);
    expect(skillReact).toBeDefined();

    const skillNode = await screen.findByText(/Node\.js/i);
    expect(skillNode).toBeDefined();

    // Verify career goal
    const roleText = await screen.findByText(/Full Stack Engineer/i);
    expect(roleText).toBeDefined();
  });
});
