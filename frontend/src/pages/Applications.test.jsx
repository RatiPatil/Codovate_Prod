import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import Applications from './Applications';

vi.mock('../context/SocketContext', () => ({
  useSocket: () => ({
    socket: { on: vi.fn(), off: vi.fn() },
    isConnected: true
  })
}));

vi.mock('../api', () => ({
  applicationsApi: {
    list: vi.fn(() => Promise.resolve({
      data: [
        {
          id: 'app_1',
          opportunity_id: 'opp_1',
          title: 'Frontend React Engineer',
          company: 'Acme Cloud',
          status: 'Applied',
          applied_at: new Date().toISOString(),
          type: 'Internship',
          mode: 'Remote'
        },
        {
          id: 'app_2',
          opportunity_id: 'opp_2',
          title: 'Backend Node Specialist',
          company: 'HyperScale AI',
          status: 'Interview',
          applied_at: new Date().toISOString(),
          type: 'Full-time',
          mode: 'Hybrid'
        }
      ]
    })),
    withdraw: vi.fn(() => Promise.resolve({ data: { success: true } })),
    get: vi.fn()
  }
}));

describe('Applications Page Component', () => {
  it('renders application list and status metrics correctly', async () => {
    render(
      <MemoryRouter>
        <Applications />
      </MemoryRouter>
    );

    // Verify applications header
    expect(screen.getByText('My Applications')).toBeDefined();

    // Verify company and role cards render
    const appRole1 = await screen.findByText('Frontend React Engineer');
    expect(appRole1).toBeDefined();

    const company1 = await screen.findByText('Acme Cloud');
    expect(company1).toBeDefined();

    const appRole2 = await screen.findByText('Backend Node Specialist');
    expect(appRole2).toBeDefined();

    // Verify status badges render
    const appliedBadges = await screen.findAllByText('Applied');
    expect(appliedBadges.length).toBeGreaterThan(0);

    const interviewBadge = await screen.findByText('Interview');
    expect(interviewBadge).toBeDefined();
  });
});
