import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import Home from './Home';
import Login from './Login';
import Signup from './Signup';
import { ToastProvider } from '../components/ui/ToastProvider';
import { AuthProvider } from '../context/AuthContext';
import { auth, googleProvider, storage, db } from '../lib/firebase';

vi.mock('../context/SocketContext', () => ({
  useSocket: () => ({
    socket: { on: vi.fn(), off: vi.fn() }
  })
}));

vi.mock('../api/axios', () => ({
  default: {
    get: vi.fn(() => Promise.resolve({ data: [] })),
    post: vi.fn(() => Promise.resolve({ data: {} }))
  }
}));

describe('Phase 8 Step 2 Verification — Firebase and Key Pages', () => {
  it('initializes Firebase auth, storage, and db without throwing auth/invalid-api-key', () => {
    expect(auth).toBeDefined();
    expect(googleProvider).toBeDefined();
    expect(storage).toBeDefined();
    expect(db).toBeDefined();
    expect(auth.app).toBeDefined();
  });

  it('mounts and renders the Home page without blank page errors', async () => {
    const { container } = render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    );
    expect(container).toBeDefined();
    expect(container.firstChild).not.toBeNull();
  });

  it('mounts and renders the Login page properly', async () => {
    const { container } = render(
      <MemoryRouter>
        <ToastProvider>
          <AuthProvider>
            <Login />
          </AuthProvider>
        </ToastProvider>
      </MemoryRouter>
    );
    expect(container).toBeDefined();
    expect(container.firstChild).not.toBeNull();
  });

  it('mounts and renders the Signup page properly', async () => {
    const { container } = render(
      <MemoryRouter>
        <ToastProvider>
          <AuthProvider>
            <Signup />
          </AuthProvider>
        </ToastProvider>
      </MemoryRouter>
    );
    expect(container).toBeDefined();
    expect(container.firstChild).not.toBeNull();
  });
});
