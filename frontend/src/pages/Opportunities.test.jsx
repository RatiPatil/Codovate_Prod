import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Opportunities from './Opportunities';

// Mock context and api
vi.mock('../context/SocketContext', () => ({
  useSocket: () => ({
    socket: { on: vi.fn(), off: vi.fn() }
  })
}));

vi.mock('../api/axios', () => ({
  default: {
    get: vi.fn((url) => {
      if (url === '/opportunities') {
        return Promise.resolve({ data: [{ id: 1, title: 'Mock Opp', type: 'Internship', company: 'Mock Inc', deadline: '2026-12-31' }] });
      }
      if (url === '/applications/my') {
        return Promise.resolve({ data: [] });
      }
      return Promise.resolve({ data: [] });
    }),
    post: vi.fn()
  }
}));

describe('Opportunities Component', () => {
  it('renders the opportunity title and component properly', async () => {
    render(<Opportunities />);
    
    // Initially should show loading state (the spin div)
    // Wait for the mock to resolve
    const oppElement = await screen.findByText('Mock Opp');
    expect(oppElement).toBeDefined();
    
    const companyElement = await screen.findByText('Mock Inc');
    expect(companyElement).toBeDefined();
  });
});
