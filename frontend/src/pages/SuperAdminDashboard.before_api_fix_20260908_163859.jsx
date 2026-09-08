import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../lib/apiClient';

const StatCard = ({ label, value, description }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
      {label}
    </p>
    <p className="mt-2 text-3xl font-black text-slate-900">
      {value}
    </p>
    <p className="mt-1 text-sm text-slate-500">
      {description}
    </p>
  </div>
);

const Section = ({ title, children }) => (
  <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
    <div className="mb-5 flex items-center justify-between">
      <h2 className="text-lg font-bold text-slate-900">{title}</h2>
    </div>
    {children}
  </section>
);

export default function SuperAdminDashboard() {
  const { user, logout } = useAuth();

  const [state, setState] = useState({
    loading: true,
    error: null,
    data: null,
  });

  const load = useCallback(async () => {
    setState((current) => ({
      ...current,
      loading: true,
      error: null,
    }));

    try {
      const response = await apiClient.get('/admin/overview');
      setState({
        loading: false,
        error: null,
        data: response?.data?.data || response?.data || {},
      });
    } catch (error) {
      console.error('[SuperAdminDashboard] load failed:', error);
      setState({
        loading: false,
        error:
          error?.response?.data?.message ||
          error?.message ||
          'Unable to load admin dashboard.',
        data: null,
      });
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const data = state.data || {};

  const stats = useMemo(
    () => [
      {
        label: 'Total Users',
        value: data.total_users ?? data.users_count ?? 0,
        description: 'Registered platform identities',
      },
      {
        label: 'Students',
        value: data.students ?? data.student_count ?? 0,
        description: 'Student accounts',
      },
      {
        label: 'Companies',
        value: data.companies ?? data.company_count ?? 0,
        description: 'Company accounts',
      },
      {
        label: 'Colleges',
        value: data.colleges ?? data.college_count ?? 0,
        description: 'College organizations',
      },
      {
        label: 'Mentors',
        value: data.mentors ?? data.mentor_count ?? 0,
        description: 'Mentor accounts',
      },
      {
        label: 'Opportunities',
        value: data.opportunities ?? data.opportunity_count ?? 0,
        description: 'Published opportunities',
      },
    ],
    [data]
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#2015ff]">
              Codovate HQ
            </p>
            <h1 className="mt-1 text-2xl font-black text-slate-900">
              Super Admin Control Center
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Platform operations, users, security and ecosystem management.
            </p>
          </div>

          <button
            type="button"
            onClick={logout}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Sign out
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-8 px-5 py-8">
        <section className="rounded-3xl bg-[#2015ff] p-7 text-white shadow-sm">
          <p className="text-sm font-medium text-white/70">
            Authenticated as
          </p>
          <h2 className="mt-1 text-2xl font-black">
            {user?.full_name || user?.displayName || 'Codovate Super Admin'}
          </h2>
          <p className="mt-1 text-sm text-white/75">
            {user?.email || 'admin@codovate.in'}
          </p>
          <div className="mt-4 inline-flex rounded-full bg-white/15 px-3 py-1 text-xs font-bold uppercase tracking-wider">
            SUPER ADMIN
          </div>
        </section>

        {state.error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
            <strong>Dashboard API:</strong> {state.error}
            <button
              type="button"
              onClick={load}
              className="ml-4 font-bold underline"
            >
              Retry
            </button>
          </div>
        )}

        <section>
          <div className="mb-4">
            <h2 className="text-xl font-black text-slate-900">
              Platform Overview
            </h2>
            <p className="text-sm text-slate-500">
              Live PostgreSQL-backed platform statistics.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {stats.map((item) => (
              <StatCard
                key={item.label}
                label={item.label}
                value={state.loading ? '—' : item.value}
                description={item.description}
              />
            ))}
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          <Section title="User & Role Management">
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                ['Users', 'Manage all platform identities'],
                ['Roles', 'Manage role assignments'],
                ['Permissions', 'Manage RBAC permissions'],
                ['Organizations', 'Manage colleges and companies'],
              ].map(([title, description]) => (
                <div
                  key={title}
                  className="rounded-2xl border border-slate-200 p-4"
                >
                  <h3 className="font-bold text-slate-900">{title}</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    {description}
                  </p>
                </div>
              ))}
            </div>
          </Section>

          <Section title="Platform Operations">
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                ['Opportunities', 'Review and moderate opportunities'],
                ['Events', 'Manage platform events'],
                ['Reports', 'Platform activity and analytics'],
                ['Audit & Security', 'Review sensitive platform activity'],
              ].map(([title, description]) => (
                <div
                  key={title}
                  className="rounded-2xl border border-slate-200 p-4"
                >
                  <h3 className="font-bold text-slate-900">{title}</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    {description}
                  </p>
                </div>
              ))}
            </div>
          </Section>
        </div>

        <Section title="Administrator Identity">
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <p className="text-xs font-semibold uppercase text-slate-400">
                Firebase UID
              </p>
              <p className="mt-1 break-all text-sm font-medium text-slate-800">
                {user?.uid || '—'}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-slate-400">
                Email
              </p>
              <p className="mt-1 text-sm font-medium text-slate-800">
                {user?.email || '—'}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-slate-400">
                Account
              </p>
              <p className="mt-1 text-sm font-medium text-slate-800">
                Super Administrator
              </p>
            </div>
          </div>
        </Section>
      </main>
    </div>
  );
}
