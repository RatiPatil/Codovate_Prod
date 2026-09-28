import { Navigate, Route, Routes } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import {
  dashboardApi,
  teamsApi,
  projectsApi,
  mentorshipApi,
  learningApi,
  careerApi,
  showcaseApi,
  eventsApi,
  networkingApi,
} from './api';
import LoadingState from './components/ui/LoadingState';
import ErrorState from './components/ui/ErrorState';
import EmptyState from './components/ui/EmptyState';
import SectionHeader from './components/ui/SectionHeader';
import StatCard from './components/ui/StatCard';
import PrimaryButton from './components/ui/PrimaryButton';
import SecondaryButton from './components/ui/SecondaryButton';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Onboarding from './pages/Onboarding';
import OnboardingSuccess from './pages/OnboardingSuccess';
import Home from './pages/Home';
import AdminLogin from './pages/AdminLogin';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import MentorLogin from './pages/MentorLogin';
import RecruiterLogin from './pages/RecruiterLogin';
import Profile from './pages/Profile';
import Opportunities from './pages/Opportunities';
import Applications from './pages/Applications';
import ProtectedRoute from './components/ProtectedRoute';
import AuthGate from './components/auth/AuthGate';
import { useAuth } from './context/AuthContext';

const navItems = [
  ['dashboard', 'Dashboard'],
  ['profile', 'My Profile'],
  ['opportunities', 'Opportunities'],
  ['applications', 'My Applications'],
  ['teams', 'Teams'],
  ['projects', 'Projects'],
  ['mentors', 'Mentors'],
  ['learning', 'Learning'],
  ['career', 'Career'],
  ['showcase', 'Portfolio & Resumes'],
  ['events', 'Events'],
  ['messages', 'Messages'],
];

function useData(loader) {
  const [state, setState] = useState({
    loading: true,
    error: null,
    data: null,
  });

  const load = async () => {
    setState({
      loading: true,
      error: null,
      data: null,
    });

    try {
      const data = await loader();
      setState({
        loading: false,
        error: null,
        data,
      });
    } catch (error) {
      setState({
        loading: false,
        error:
          error?.response?.data?.message ||
          error?.message ||
          'Unable to load data.',
        data: null,
      });
    }
  };

  useEffect(() => {
    load();
  }, []);

  return {
    ...state,
    reload: load,
  };
}

function AppShell({ active, setActive, children }) {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => setActive('dashboard')}
            className="flex items-center gap-2"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#2015ff] text-sm font-black text-white">
              C
            </span>
            <span className="text-lg font-bold tracking-tight">
              Codovate
            </span>
          </button>

          <div className="flex items-center gap-4">
            <div className="hidden items-center gap-2 md:flex">
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                Learn · Build · Compete · Grow
              </span>
            </div>

            {user && (
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setActive('profile')}
                  className="hidden text-xs font-semibold text-slate-600 sm:inline-block hover:text-[#2015ff] transition cursor-pointer"
                >
                  {user.name || user.displayName || user.email}
                </button>
                <button
                  type="button"
                  onClick={logout}
                  className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-5 sm:px-6 lg:px-8">
        <aside className="hidden w-56 shrink-0 lg:block">
          <nav className="sticky top-24 space-y-1">
            {navItems.map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setActive(key)}
                className={[
                  'flex w-full items-center rounded-xl px-3 py-2.5 text-left text-sm font-medium transition',
                  active === key
                    ? 'bg-[#2015ff] text-white'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950',
                ].join(' ')}
              >
                {label}
              </button>
            ))}
          </nav>
        </aside>

        <main className="min-w-0 flex-1 pb-12">
          <div className="mb-5 flex gap-2 overflow-x-auto lg:hidden">
            {navItems.map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setActive(key)}
                className={[
                  'whitespace-nowrap rounded-full px-3 py-2 text-xs font-semibold',
                  active === key
                    ? 'bg-[#2015ff] text-white'
                    : 'bg-white text-slate-600 ring-1 ring-slate-200',
                ].join(' ')}
              >
                {label}
              </button>
            ))}
          </div>

          {children}
        </main>
      </div>
    </div>
  );
}

function DashboardPage({ onNavigate }) {
  const state = useData(dashboardApi.get);

  if (state.loading) return <LoadingState label="Loading your dashboard..." />;
  if (state.error) return <ErrorState description={state.error} onRetry={state.reload} />;

  const data = state.data || {};
  const profile = data.profile || {};
  const goals = data.goals || {};
  const readiness = data.placement_readiness || {};

  return (
    <div className="space-y-8">
      <section className="rounded-3xl bg-[#2015ff] p-6 text-white shadow-sm sm:p-8">
        <div className="max-w-3xl">
          <p className="text-sm font-medium text-white/75">
            Your career workspace
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            Build your next opportunity.
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/80 sm:text-base">
            Discover opportunities, build projects, grow your skills and stay
            ready for your next career move.
          </p>
        </div>
      </section>

      {/* Quick Actions Row */}
      <section className="flex flex-wrap items-center gap-2.5 rounded-2xl bg-white p-4 border border-slate-200 shadow-2xs">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1">Quick Actions:</span>
        <button
          type="button"
          onClick={() => onNavigate && onNavigate('opportunities')}
          className="rounded-xl bg-[#2015ff] text-white px-3.5 py-1.5 text-xs font-bold hover:bg-blue-700 transition"
        >
          Explore Opportunities →
        </button>
        <button
          type="button"
          onClick={() => onNavigate && onNavigate('applications')}
          className="rounded-xl border border-slate-200 text-slate-700 px-3.5 py-1.5 text-xs font-bold hover:bg-slate-50 transition"
        >
          My Applications
        </button>
        <button
          type="button"
          onClick={() => onNavigate && onNavigate('profile')}
          className="rounded-xl border border-slate-200 text-slate-700 px-3.5 py-1.5 text-xs font-bold hover:bg-slate-50 transition"
        >
          Edit Profile
        </button>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div onClick={() => onNavigate && onNavigate('profile')} className="cursor-pointer transition hover:opacity-90">
          <StatCard
            label="Profile completion"
            value={`${profile.profile_completion || 0}%`}
            icon="◉"
          />
        </div>
        <StatCard
          label="Placement readiness"
          value={readiness.score ?? 0}
          icon="↗"
        />
        <StatCard
          label="XP"
          value={goals.xp ?? 0}
          icon="✦"
        />
        <StatCard
          label="Current streak"
          value={goals.streak ?? 0}
          icon="🔥"
        />
      </section>

      <section>
        <SectionHeader
          title="Today’s focus"
          description="Use real activity from your Codovate account."
        />

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="font-semibold">Tasks</h3>
            {Array.isArray(data.daily_tasks) && data.daily_tasks.length ? (
              <div className="mt-4 space-y-3">
                {data.daily_tasks.slice(0, 5).map((task, index) => (
                  <div
                    key={task.id || index}
                    className="rounded-xl bg-slate-50 p-3 text-sm"
                  >
                    {task.title || task.name || `Task ${index + 1}`}
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-4">
                <EmptyState
                  title="No tasks yet"
                  description="Your daily tasks will appear here when available."
                />
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="font-semibold">AI recommendations</h3>
            {Array.isArray(data.recommendations) && data.recommendations.length ? (
              <div className="mt-4 space-y-3">
                {data.recommendations.slice(0, 5).map(item => (
                  <div
                    key={item.id}
                    className="rounded-xl bg-slate-50 p-3"
                  >
                    <div className="text-sm font-semibold">
                      {item.recommendation_type || 'Recommendation'}
                    </div>
                    <div className="mt-1 text-sm text-slate-500">
                      {item.reason || 'Recommended for your profile.'}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-4">
                <EmptyState
                  title="No recommendations yet"
                  description="Recommendations will appear as your profile and activity grow."
                />
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}



function GenericListPage({ title, description, loader, emptyTitle }) {
  const state = useData(loader);

  if (state.loading) return <LoadingState />;
  if (state.error) return <ErrorState description={state.error} onRetry={state.reload} />;

  const rows = Array.isArray(state.data)
    ? state.data
    : state.data?.items || [];

  return (
    <div>
      <SectionHeader title={title} description={description} />

      {!rows.length ? (
        <EmptyState
          title={emptyTitle}
          description="There is no data available for your account yet."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {rows.map((item, index) => (
            <div
              key={item.id || index}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="text-xs text-slate-400">
                {item.type || item.status || 'Codovate'}
              </div>
              <h3 className="mt-2 font-semibold">
                {item.title ||
                  item.name ||
                  item.full_name ||
                  item.display_name ||
                  `Item ${index + 1}`}
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                {item.description ||
                  item.bio ||
                  item.headline ||
                  'View details in Codovate.'}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ProtectedApp({ initialTab = 'dashboard' }) {
  const { user } = useAuth();
  const [active, setActive] = useState(initialTab);

  useEffect(() => {
    if (initialTab && initialTab !== active) {
      setActive(initialTab);
    }
  }, [initialTab]);

  const page = useMemo(() => {
    switch (active) {
      case 'dashboard':
        return <DashboardPage onNavigate={setActive} />;

      case 'profile':
        return <Profile />;

      case 'opportunities':
        return <Opportunities />;

      case 'applications':
        return <Applications onNavigateToOpportunities={() => setActive('opportunities')} />;

      case 'teams':
        return (
          <GenericListPage
            title="Teams"
            description="Build teams and collaborate with other students."
            loader={teamsApi.list}
            emptyTitle="No teams yet"
          />
        );

      case 'projects':
        return (
          <GenericListPage
            title="Projects"
            description="Turn ideas into projects and showcase what you build."
            loader={projectsApi.list}
            emptyTitle="No projects yet"
          />
        );

      case 'mentors':
        return (
          <GenericListPage
            title="Mentors"
            description="Find mentors who can help you move forward."
            loader={() => mentorshipApi.mentors()}
            emptyTitle="No mentors available"
          />
        );

      case 'learning':
        return (
          <GenericListPage
            title="Learning"
            description="Courses and learning resources for your career path."
            loader={learningApi.courses}
            emptyTitle="No courses available"
          />
        );

      case 'career':
        return (
          <GenericListPage
            title="Career Roadmap"
            description="Skills, assessments, gaps and your career roadmap."
            loader={careerApi.roadmap}
            emptyTitle="No roadmap yet"
          />
        );

      case 'showcase':
        return (
          <GenericListPage
            title="Profile & Portfolio"
            description="Your education, experience, resumes, portfolio and certificates."
            loader={showcaseApi.all}
            emptyTitle="Your showcase is empty"
          />
        );

      case 'events':
        return (
          <GenericListPage
            title="Events"
            description="Hackathons, competitions, workshops and career events."
            loader={eventsApi.list}
            emptyTitle="No events available"
          />
        );

      case 'messages':
        return (
          <GenericListPage
            title="Messages"
            description="Connect and collaborate with your Codovate network."
            loader={() => networkingApi.conversations()}
            emptyTitle="No conversations yet"
          />
        );

      default:
        return <DashboardPage />;
    }
  }, [active]);

  if (user?.role === 'student' && user?.onboardingCompleted === false) {
    return <Navigate to="/onboarding" replace />;
  }

  return (
    <AuthGate>
      <AppShell active={active} setActive={setActive}>
        {page}
      </AppShell>
    </AuthGate>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/register" element={<Navigate to="/signup" replace />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route
        path="/onboarding"
        element={
          <ProtectedRoute>
            <Onboarding />
          </ProtectedRoute>
        }
      />
      <Route
        path="/onboarding/success"
        element={
          <ProtectedRoute>
            <OnboardingSuccess />
          </ProtectedRoute>
        }
      />
      <Route path="/admin-login" element={<AdminLogin />} />
      <Route
        path="/admin"
        element={
          <ProtectedRoute requiredRole={['admin', 'super_admin']}>
            <SuperAdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route path="/mentor-login" element={<MentorLogin />} />
      <Route path="/recruiter-login" element={<RecruiterLogin />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <ProtectedApp initialTab="dashboard" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <ProtectedApp initialTab="profile" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/opportunities"
        element={
          <ProtectedRoute>
            <ProtectedApp initialTab="opportunities" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/opportunities/:id"
        element={
          <ProtectedRoute>
            <ProtectedApp initialTab="opportunities" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/applications"
        element={
          <ProtectedRoute>
            <ProtectedApp initialTab="applications" />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
