import { useEffect, useState } from "react";
import {
  Link,
  NavLink,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import {
  ArrowRight,
  Search,
  BriefcaseBusiness,
  Trophy,
  Code2,
  MapPin,
  Clock,
  Bookmark,
  GraduationCap,
  ArrowUpRight,
  Check,
  Menu,
  X,
  LayoutDashboard,
  FileText,
  UserRound,
  LogOut,
  ShieldCheck,
  Plus,
  SlidersHorizontal,
  ChevronRight,
  CheckCircle2,
  Upload,
  Building2,
  Compass,
  Sparkles,
} from "lucide-react";
import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  Timestamp,
  query,
  onSnapshot,
  orderBy,
  limit,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { auth, db, storage, configured } from "./firebase";
import { useSession } from "./session";
import {
  useOpportunities,
  useOwned,
  applyToOpportunity,
  toggleSaved,
} from "./data";
import {
  types,
  typeLabel,
  filterOpportunities,
  completion,
  isOpen,
  money,
  dateLabel,
  errorMessage,
  validWebLink,
} from "./domain";

const categoryIcons = {
  internship: BriefcaseBusiness,
  job: GraduationCap,
  competition: Trophy,
  hackathon: Code2,
};
const categories = [
  "Technology",
  "Design",
  "Marketing",
  "Business",
  "Finance",
  "Other",
];
const nav = [
  ["/explore?type=internship", "Internships"],
  ["/explore?type=job", "Jobs"],
  ["/explore?type=competition", "Competitions"],
  ["/explore?type=hackathon", "Hackathons"],
];
function Logo() {
  return (
    <Link className="brand" to="/" aria-label="Codovate home">
      <img src="/logo-light.png" alt="Codovate" />
    </Link>
  );
}
function Notice({ children, kind = "error" }) {
  return (
    <div
      className={"notice " + kind}
      role={kind === "error" ? "alert" : "status"}
    >
      {children}
    </div>
  );
}
function Empty({ title, children }) {
  return (
    <div className="empty">
      <Compass size={32} />
      <h2>{title}</h2>
      <p>{children}</p>
      <Link className="button secondary" to="/explore">
        Explore opportunities <ArrowRight size={16} />
      </Link>
    </div>
  );
}
function Loading() {
  return (
    <div className="loading" role="status">
      <span className="spinner" />
      Loading your workspace…
    </div>
  );
}
function Header() {
  const { user, admin, logout } = useSession();
  const [open, setOpen] = useState(false);
  const loc = useLocation();
  useEffect(() => setOpen(false), [loc]);
  return (
    <header className="site-header">
      <div className="header-inner">
        <Logo />
        <nav className="desktop-nav" aria-label="Main navigation">
          {nav.map(([to, label]) => (
            <Link
              key={label}
              className={
                loc.pathname === "/explore" &&
                loc.search === to.split("/explore")[1]
                  ? "selected"
                  : ""
              }
              to={to}
            >
              {label}
            </Link>
          ))}
        </nav>
        <div className="header-actions">
          {user ? (
            <>
              <Link
                className="button secondary small"
                to={admin ? "/admin" : "/dashboard"}
              >
                My workspace <ArrowUpRight size={15} />
              </Link>
              <button
                className="icon-button desktop-nav"
                title="Sign out"
                onClick={() => logout().catch(() => {})}
              >
                <LogOut size={18} />
              </button>
            </>
          ) : (
            <>
              <Link className="login-link" to="/login">
                Log in
              </Link>
              <Link className="button small" to="/signup">
                Get started <ArrowRight size={15} />
              </Link>
            </>
          )}
          <button
            className="icon-button menu-button"
            aria-label={open ? "Close navigation" : "Open navigation"}
            aria-expanded={open}
            onClick={() => setOpen(!open)}
          >
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </div>
      {open && (
        <nav className="mobile-nav" aria-label="Mobile navigation">
          {nav.map(([to, label]) => (
            <Link key={to} to={to}>
              {label}
            </Link>
          ))}
          <Link to="/profile">My profile</Link>
          {user && (
            <button onClick={() => logout().catch(() => {})}>Sign out</button>
          )}
        </nav>
      )}
    </header>
  );
}
function Footer() {
  return (
    <footer className="footer">
      <Logo />
      <p>Potential has no postcode. Your next chapter starts here.</p>
      <div>
        <Link to="/explore">Explore</Link>
        <Link to="/profile">Your profile</Link>
        <Link to="/setup">Firebase setup</Link>
      </div>
      <small>
        © {new Date().getFullYear()} Codovate · Built for your next step
      </small>
    </footer>
  );
}
function PreviewBanner() {
  return (
    !configured && (
      <div className="preview-banner">
        <span>
          <Sparkles size={14} /> Local preview · Sample listings · Sign-in and
          saving require your new Firebase project.
        </span>
        <Link to="/setup">
          Connect Firebase <ArrowRight size={14} />
        </Link>
      </div>
    )
  );
}
function Card({ item, saved = false, onSave }) {
  const Icon = categoryIcons[item.type] || BriefcaseBusiness;
  return (
    <article className="opportunity-card">
      <div className="card-top">
        <span className={"org-mark " + item.type}>
          {item.organization.slice(0, 2).toUpperCase()}
        </span>
        <span className="eyebrow">
          <Icon size={13} />
          {typeLabel[item.type]?.replace(/s$/, "") || item.type}
        </span>
        {onSave && (
          <button
            className={"save-button " + (saved ? "is-saved" : "")}
            aria-label={(saved ? "Unsave " : "Save ") + item.title}
            aria-pressed={saved}
            onClick={() => onSave(item)}
          >
            <Bookmark size={19} fill={saved ? "currentColor" : "none"} />
          </button>
        )}
      </div>
      <Link className="card-title" to={"/opportunities/" + item.id}>
        <h3>{item.title}</h3>
      </Link>
      <p className="organization">{item.organization}</p>
      <div className="card-meta">
        <span>
          <MapPin size={14} />
          {item.mode === "Remote" ? "Work from home" : item.location}
        </span>
        <span>
          <Clock size={14} />
          {item.duration}
        </span>
      </div>
      <div className="skill-row">
        {item.skills.slice(0, 3).map((s) => (
          <span key={s}>{s}</span>
        ))}
      </div>
      <div className="card-bottom">
        <div>
          <strong>{money(item.stipend)}</strong>
          <small>
            {["competition", "hackathon"].includes(item.type)
              ? "Prize pool"
              : "/ month"}
          </small>
        </div>
        <Link
          to={"/opportunities/" + item.id}
          aria-label={"View " + item.title}
        >
          <ArrowUpRight size={21} />
        </Link>
      </div>
    </article>
  );
}
function Home({ catalog }) {
  const [search, setSearch] = useState("");
  const navigate = useNavigate();
  const featured = catalog.items.filter((o) => isOpen(o)).slice(0, 3);
  return (
    <>
      <section className="hero container">
        <div className="hero-copy">
          <span className="pill">
            <span className="green-dot" /> Big ambitions. Every college.
          </span>
          <h1>
            Your college is
            <br />a starting point.
            <br />
            <em>Not your limit.</em>
          </h1>
          <p>
            Find your first internship. Take on a challenge.
            <br className="desktop-break" /> Build a career that’s yours,
            wherever you begin.
          </p>
          <form
            className="hero-search"
            onSubmit={(e) => {
              e.preventDefault();
              navigate("/explore?search=" + encodeURIComponent(search));
            }}
          >
            <Search size={20} />
            <input
              aria-label="Search opportunities"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Try “React”, “design” or “remote”"
            />
            <button className="button" type="submit">
              Explore <ArrowRight size={17} />
            </button>
          </form>
          <div className="hero-note">
            <CheckCircle2 size={16} /> Open to students from every college{" "}
            <span>·</span> Free to get started
          </div>
        </div>
        <div
          className="hero-art"
          aria-label="Learn, build and discover your next opportunity"
        >
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <span className="art-star">✦</span>
          <div className="art-card art-career">
            <span className="eyebrow">YOUR NEXT CHAPTER</span>
            <div className="art-title">
              A little courage.
              <br />A lot of possibility.
            </div>
            <div className="path-line">
              <span>01</span>
              <p>Discover your direction</p>
              <Check size={16} />
            </div>
            <div className="path-line">
              <span>02</span>
              <p>Build something real</p>
              <Check size={16} />
            </div>
            <div className="path-line active">
              <span>03</span>
              <p>Make your next move</p>
              <ArrowUpRight size={17} />
            </div>
            <div className="art-progress">
              <i />
              <i />
              <i />
            </div>
            <p className="art-caption">Small steps. Real progress.</p>
          </div>
          <div className="art-float art-float-one">
            <span className="float-icon">
              <BriefcaseBusiness size={21} />
            </span>
            <div>
              <strong>Your first internship</strong>
              <small>Closer than you think</small>
            </div>
            <ArrowUpRight size={18} />
          </div>
          <div className="art-float art-float-two">
            <span className="float-icon gold">
              <Trophy size={22} />
            </span>
            <div>
              <strong>Ideas worth building.</strong>
              <small>Compete. Collaborate. Grow.</small>
            </div>
          </div>
          <div className="art-tag">
            <span className="avatar-stack">
              <b>A</b>
              <b>R</b>
              <b>S</b>
            </span>{" "}
            Your ambition belongs here.
          </div>
        </div>
      </section>
      <section
        className="paths container"
        aria-label="Explore by opportunity type"
      >
        {types.map((type, i) => {
          const Icon = categoryIcons[type];
          return (
            <Link
              className={"path-card " + type}
              key={type}
              to={"/explore?type=" + type}
            >
              <span className="path-icon">
                <Icon size={25} />
              </span>
              <div>
                <h2>{typeLabel[type]}</h2>
                <p>
                  {
                    [
                      "Get your first real experience",
                      "Take the next step forward",
                      "Let your ideas stand out",
                      "Build something that matters",
                    ][i]
                  }
                </p>
              </div>
              <ArrowUpRight size={20} />
            </Link>
          );
        })}
      </section>
      <section className="section container">
        <div className="section-heading">
          <div>
            <span className="eyebrow blue">DISCOVER YOUR NEXT MOVE</span>
            <h2>Small beginnings. Big possibilities.</h2>
            <p>
              {configured
                ? "Explore the latest opportunities published on Codovate."
                : "A glimpse of the opportunities your platform can bring together."}
            </p>
          </div>
          <Link className="text-link" to="/explore">
            View all opportunities <ArrowRight size={17} />
          </Link>
        </div>
        {catalog.loading ? (
          <Loading />
        ) : catalog.error ? (
          <Notice>
            {errorMessage(catalog.error)}{" "}
            <button onClick={catalog.retry}>Retry</button>
          </Notice>
        ) : featured.length ? (
          <div className="card-grid">
            {featured.map((o) => (
              <Card key={o.id} item={o} />
            ))}
          </div>
        ) : (
          <Empty title="Your opportunity board is ready">
            An administrator can publish your first internship, job or
            challenge.
          </Empty>
        )}
      </section>
      <section className="student-banner container">
        <div>
          <span className="eyebrow">FOR THE AMBITION IN EVERY CLASSROOM</span>
          <h2>
            Skills over labels.
            <br />
            Potential over postcodes.
          </h2>
          <p>
            Your college name shouldn’t decide your future. Put your work,
            curiosity and ambition in the spotlight.
          </p>
          <Link className="button" to="/signup">
            Build your student profile <ArrowRight size={17} />
          </Link>
        </div>
        <div className="steps">
          <div>
            <span>01</span>
            <p>
              <strong>Show what makes you, you.</strong>
              <small>Add your skills, projects and résumé.</small>
            </p>
          </div>
          <div>
            <span>02</span>
            <p>
              <strong>Find something that fits.</strong>
              <small>Search by interest, location and work mode.</small>
            </p>
          </div>
          <div>
            <span>03</span>
            <p>
              <strong>Take your next step.</strong>
              <small>Apply and follow your application in one place.</small>
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
function Explore({ catalog }) {
  const [params, setParams] = useSearchParams();
  const { user } = useSession();
  const bookmarks = useOwned("bookmarks", user?.uid);
  const [notice, setNotice] = useState("");
  const type = types.includes(params.get("type")) ? params.get("type") : "all";
  const filters = {
    type,
    search: params.get("search") || "",
    mode: params.get("mode") || "all",
    category: params.get("category") || "all",
    sort: params.get("sort") || "newest",
  };
  const rows = filterOpportunities(catalog.items, filters);
  const saved = new Set(bookmarks.items.map((b) => b.opportunityId));
  function change(key, value) {
    const next = new URLSearchParams(params);
    if (value === "all" || !value) next.delete(key);
    else next.set(key, value);
    setParams(next, { replace: key === "search" });
  }
  async function save(item) {
    setNotice("");
    if (!user) {
      setNotice("Sign in to save opportunities to your account.");
      return;
    }
    try {
      await toggleSaved(user.uid, item, saved.has(item.id));
    } catch (e) {
      setNotice(errorMessage(e));
    }
  }
  return (
    <div className="container section">
      <div className="page-intro">
        <span className="eyebrow blue">OPPORTUNITIES, WITHOUT LIMITS</span>
        <h1>{typeLabel[type] || "Find your next opportunity."}</h1>
        <p>
          A first experience, a fresh start, or a challenge worth taking on.
        </p>
      </div>
      <div className="type-tabs">
        <button
          className={type === "all" ? "active" : ""}
          onClick={() => change("type", "all")}
        >
          All opportunities
        </button>
        {types.map((t) => (
          <button
            key={t}
            className={type === t ? "active" : ""}
            onClick={() => change("type", t)}
          >
            {typeLabel[t]}
          </button>
        ))}
      </div>
      <div className="explore-layout">
        <aside className="filter-panel">
          <h2>
            <SlidersHorizontal size={17} /> Refine your search
          </h2>
          <label>
            Work mode
            <select
              value={filters.mode}
              onChange={(e) => change("mode", e.target.value)}
            >
              <option value="all">Any work mode</option>
              {["Remote", "On-site", "Hybrid"].map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </label>
          <label>
            Area of interest
            <select
              value={filters.category}
              onChange={(e) => change("category", e.target.value)}
            >
              <option value="all">All interests</option>
              {categories.map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </label>
          <button className="text-link" onClick={() => setParams({})}>
            Clear all filters
          </button>
          <div className="filter-tip">
            <GraduationCap size={26} />
            <h3>Your potential matters.</h3>
            <p>
              Explore opportunities open to students from every college. Check
              each listing for eligibility.
            </p>
          </div>
        </aside>
        <div>
          <div className="results-toolbar">
            <label className="search-input">
              <Search size={18} />
              <input
                aria-label="Search by role, skill or company"
                value={filters.search}
                onChange={(e) => change("search", e.target.value)}
                placeholder="Search role, skill or company"
              />
            </label>
            <select
              aria-label="Sort opportunities"
              value={filters.sort}
              onChange={(e) => change("sort", e.target.value)}
            >
              <option value="newest">Newest first</option>
              <option value="deadline">Closing soon</option>
              <option value="stipend">Highest stipend / prize</option>
            </select>
          </div>
          <p className="result-count">
            {rows.length} {configured ? "" : "sample "}opportunities · Showing
            up to 200 latest listings
          </p>
          {notice && (
            <Notice kind="info">
              {notice} {!user && <Link to="/login">Sign in</Link>}
            </Notice>
          )}
          {catalog.loading ? (
            <Loading />
          ) : catalog.error ? (
            <Notice>
              {errorMessage(catalog.error)}{" "}
              <button onClick={catalog.retry}>Retry</button>
            </Notice>
          ) : rows.length ? (
            <div className="card-grid two">
              {rows.map((o) => (
                <Card
                  key={o.id}
                  item={o}
                  saved={saved.has(o.id)}
                  onSave={save}
                />
              ))}
            </div>
          ) : (
            <Empty title="No matching opportunities">
              Try another skill or remove a filter. New listings appear here
              when published.
            </Empty>
          )}
        </div>
      </div>
    </div>
  );
}
function Details({ catalog }) {
  const { id } = useParams();
  const { user, profile } = useSession();
  const navigate = useNavigate();
  const [item, setItem] = useState(null),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [note, setNote] = useState(""),
    [busy, setBusy] = useState(false),
    [success, setSuccess] = useState(false);
  const applications = useOwned("applications", user?.uid);
  const applied = applications.items.some((a) => a.opportunityId === id);
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    setSuccess(false);
    if (!configured) {
      setItem(catalog.items.find((o) => o.id === id) || null);
      setLoading(false);
      return;
    }
    getDoc(doc(db, "opportunities", id))
      .then((s) => {
        if (!cancelled) {
          setItem(s.exists() ? { ...s.data(), id: s.id } : null);
          setLoading(false);
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setError(errorMessage(e));
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [id, catalog.items]);
  async function apply(e) {
    e.preventDefault();
    if (!user) {
      navigate("/login", { state: { from: "/opportunities/" + id } });
      return;
    }
    setBusy(true);
    setError("");
    try {
      await applyToOpportunity(user, profile, item, note);
      setSuccess(true);
    } catch (e) {
      setError(e.code ? errorMessage(e) : e.message);
    } finally {
      setBusy(false);
    }
  }
  if (loading) return <Loading />;
  if (!item)
    return (
      <div className="container section">
        {error ? (
          <Notice>{error}</Notice>
        ) : (
          <Empty title="Opportunity not found">
            It may have been removed or is not available to view.
          </Empty>
        )}
      </div>
    );
  return (
    <div className="container section">
      <Link className="text-link" to="/explore">
        ← All opportunities
      </Link>
      <div className="detail-layout">
        <article className="panel detail-main">
          <span className="pill">
            {typeLabel[item.type]} · {item.category}
          </span>
          <h1>{item.title}</h1>
          <p className="organization">{item.organization}</p>
          <div className="detail-facts">
            <span>
              <MapPin size={17} />
              {item.location} · {item.mode}
            </span>
            <span>
              <Clock size={17} />
              {item.duration}
            </span>
            <span>
              <BriefcaseBusiness size={17} />
              {money(item.stipend)}{" "}
              {["competition", "hackathon"].includes(item.type)
                ? "prize pool"
                : "/ month"}
            </span>
          </div>
          {!configured && (
            <Notice kind="info">
              Sample listing for preview only. Applications are disabled until
              your new Firebase project is connected.
            </Notice>
          )}
          <h2>About the opportunity</h2>
          <p className="multiline">{item.description}</p>
          <h2>What you’ll work on</h2>
          <p className="multiline">{item.responsibilities}</p>
          <h2>Who can apply</h2>
          <p className="multiline">{item.eligibility}</p>
          <h2>Skills you’ll use</h2>
          <div className="skill-row">
            {item.skills.map((s) => (
              <span key={s}>{s}</span>
            ))}
          </div>
        </article>
        <aside className="panel apply-panel">
          <span className="eyebrow blue">YOUR NEXT STEP</span>
          <h2>
            {applied || success
              ? "You’re in the running."
              : "Ready to give it a go?"}
          </h2>
          <p>
            Applications close
            <br />
            <strong>{dateLabel(item.deadline)}</strong>
          </p>
          {error && <Notice>{error}</Notice>}
          {applied || success ? (
            <>
              <Notice kind="success">
                Application submitted successfully.
              </Notice>
              <Link className="button" to="/applications">
                Track your application <ArrowRight size={16} />
              </Link>
            </>
          ) : (
            <form onSubmit={apply}>
              <label>
                A short introduction{" "}
                <span className="optional">(optional)</span>
                <textarea
                  maxLength={2000}
                  rows={4}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="What excites you about this opportunity?"
                />
              </label>
              {user && (!profile?.resumePath || !profile?.college) && (
                <p className="hint">
                  Add your college and résumé to{" "}
                  <Link to="/profile">your profile</Link> before applying.
                </p>
              )}
              <button
                className="button full"
                disabled={!configured || busy || !isOpen(item)}
              >
                {busy
                  ? "Submitting…"
                  : !configured
                    ? "Preview only"
                    : !isOpen(item)
                      ? "Applications closed"
                      : user
                        ? "Submit application"
                        : "Sign in to apply"}
                <ArrowRight size={16} />
              </button>
            </form>
          )}
          <p className="hint">
            <ShieldCheck size={15} /> Your application is private to you and the
            platform administrator.
          </p>
        </aside>
      </div>
    </div>
  );
}
function Guard({ children, adminOnly = false }) {
  const { user, admin, loading, sessionError } = useSession();
  const loc = useLocation();
  if (loading) return <Loading />;
  if (!configured)
    return (
      <div className="container section">
        <Empty title="Connect your new Firebase project">
          This workspace will be ready once Firebase is configured. You can
          explore the public preview now.
        </Empty>
        <Link className="button" to="/setup">
          View setup steps
        </Link>
      </div>
    );
  if (!user)
    return (
      <Navigate
        to="/login"
        state={{ from: loc.pathname + loc.search }}
        replace
      />
    );
  if (sessionError)
    return (
      <div className="container section">
        <Notice>{errorMessage(sessionError)}</Notice>
      </div>
    );
  if (adminOnly && !admin)
    return (
      <div className="container section">
        <Empty title="Administrator access required">
          Your student account cannot publish listings or access other students’
          applications.
        </Empty>
      </div>
    );
  return children;
}
function AuthPage({ signup = false }) {
  const { user, createProfile } = useSession();
  const navigate = useNavigate();
  const loc = useLocation();
  const [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  const from =
    loc.state?.from?.startsWith("/") && !loc.state.from.startsWith("//")
      ? loc.state.from
      : "/dashboard";
  if (user) return <Navigate to={from} replace />;
  async function ensureProfile(u, name) {
    const snapshot = await getDoc(doc(db, "users", u.uid));
    if (!snapshot.exists()) await createProfile(u, name);
  }
  async function submit(e) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    setBusy(true);
    setError("");
    try {
      const result = signup
        ? await createUserWithEmailAndPassword(
            auth,
            data.get("email"),
            data.get("password"),
          )
        : await signInWithEmailAndPassword(
            auth,
            data.get("email"),
            data.get("password"),
          );
      await ensureProfile(result.user, data.get("name"));
      navigate(from, { replace: true });
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  async function google() {
    setBusy(true);
    setError("");
    try {
      const result = await signInWithPopup(auth, new GoogleAuthProvider());
      await ensureProfile(result.user);
      navigate(from, { replace: true });
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  async function reset() {
    const email = document.querySelector("#auth-email")?.value;
    if (!email) {
      setError("Enter your email above first.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await sendPasswordResetEmail(auth, email);
      setMessage(
        "If this email has an account, a password reset link will be sent.",
      );
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="auth-layout container">
      <div className="auth-story">
        <span className="eyebrow blue">YOUR AMBITION BELONGS HERE</span>
        <h1>
          Every big career
          <br />
          starts with
          <br />
          <em>one small step.</em>
        </h1>
        <p>
          Your skills. Your ideas. Your next chapter.
          <br />
          Let’s build something worth starting.
        </p>
        <div className="story-feature">
          <BriefcaseBusiness /> Discover opportunities that fit you.
        </div>
        <div className="story-feature">
          <Trophy /> Turn your ideas into real experience.
        </div>
        <div className="story-feature">
          <GraduationCap /> Grow, wherever you study.
        </div>
      </div>
      <div className="auth-card panel">
        <h2>{signup ? "Start your next chapter." : "Welcome back."}</h2>
        <p>
          {signup
            ? "Create your free student account."
            : "Your next opportunity is waiting."}
        </p>
        {!configured && (
          <Notice kind="info">
            New Firebase connection pending.{" "}
            <Link to="/setup">See what to configure.</Link>
          </Notice>
        )}
        {error && <Notice>{error}</Notice>}
        {message && <Notice kind="success">{message}</Notice>}
        <button
          className="button secondary full google-button"
          disabled={!configured || busy}
          onClick={google}
        >
          <span className="google-g" aria-hidden="true">G</span> Continue with Google
        </button>
        <div className="divider">
          <span>or continue with email</span>
        </div>
        <form onSubmit={submit}>
          {signup && (
            <label>
              Your name
              <input
                name="name"
                required
                maxLength={100}
                autoComplete="name"
                placeholder="Your full name"
              />
            </label>
          )}
          <label>
            Email address
            <input
              id="auth-email"
              name="email"
              required
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
            />
          </label>
          <label>
            Password
            <input
              name="password"
              required
              minLength={8}
              type="password"
              autoComplete={signup ? "new-password" : "current-password"}
              placeholder="At least 8 characters"
            />
          </label>
          {!signup && (
            <button
              type="button"
              className="text-link reset-link"
              disabled={!configured || busy}
              onClick={reset}
            >
              Forgot password?
            </button>
          )}
          <button className="button full" disabled={!configured || busy}>
            {busy ? "Please wait…" : signup ? "Create account" : "Sign in"}
            <ArrowRight size={16} />
          </button>
        </form>
        <p className="auth-switch">
          {signup ? "Already have an account?" : "New to Codovate?"}{" "}
          <Link to={signup ? "/login" : "/signup"} state={loc.state}>
            {signup ? "Sign in" : "Create an account"}
          </Link>
        </p>
      </div>
    </div>
  );
}
function Workspace({ children, title, subtitle }) {
  const { admin } = useSession();
  return (
    <div className="workspace container">
      <aside className="workspace-nav">
        <span className="eyebrow">YOUR WORKSPACE</span>
        {[
          ["/dashboard", "Overview", LayoutDashboard],
          ["/applications", "My applications", FileText],
          ["/saved", "Saved opportunities", Bookmark],
          ["/profile", "My profile", UserRound],
          ...(admin ? [["/admin", "Administration", ShieldCheck]] : []),
        ].map(([to, label, Icon]) => (
          <NavLink key={to} to={to}>
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
        <Link className="explore-back" to="/explore">
          <Compass size={18} /> Explore opportunities
        </Link>
      </aside>
      <div className="workspace-main">
        <div className="page-intro">
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>
        {children}
      </div>
    </div>
  );
}
function Dashboard({ catalog }) {
  const { user, profile, admin } = useSession();
  const apps = useOwned("applications", user.uid),
    saved = useOwned("bookmarks", user.uid);
  return (
    <Workspace
      title={
        "Hey " +
        (profile?.name?.split(" ")[0] || "there") +
        ", let’s move forward."
      }
      subtitle="One place for your profile, opportunities and next steps."
    >
      <section className="dashboard-callout">
        <div>
          <span className="eyebrow">YOUR JOURNEY, YOUR PACE</span>
          <h2>Make your potential visible.</h2>
          <p>A complete profile helps you put your best foot forward.</p>
          <Link className="button" to="/profile">
            Complete your profile <ArrowRight size={16} />
          </Link>
        </div>
        <div className="progress-circle">
          <strong>{completion(profile)}%</strong>
          <span>profile complete</span>
        </div>
      </section>
      <div className="stats-grid">
        {[
          ["Applications", apps.items.length, "/applications"],
          ["Saved opportunities", saved.items.length, "/saved"],
          [
            "Open opportunities",
            catalog.items.filter((o) => isOpen(o)).length,
            "/explore",
          ],
        ].map(([label, value, to]) => (
          <Link to={to} className="stat panel" key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
            <ArrowUpRight size={19} />
          </Link>
        ))}
      </div>
      <section className="panel checklist">
        <h2>Your next steps</h2>
        {[
          [
            "Add your college and skills",
            !!profile?.college && !!profile?.skills?.length,
            "/profile",
          ],
          ["Upload your résumé", !!profile?.resumePath, "/profile"],
          ["Send your first application", apps.items.length > 0, "/explore"],
        ].map(([title, done, to]) => (
          <Link key={title} to={to}>
            <span className={done ? "check done" : "check"}>
              {done ? <Check size={15} /> : <ChevronRight size={15} />}
            </span>
            {title}
            <ArrowUpRight size={16} />
          </Link>
        ))}
      </section>
      {admin && (
        <Link className="button secondary" to="/admin">
          Open administration <ShieldCheck size={17} />
        </Link>
      )}
    </Workspace>
  );
}
function Applications() {
  const { user } = useSession();
  const state = useOwned("applications", user.uid);
  return (
    <Workspace
      title="My applications"
      subtitle="Your next chapter, one application at a time."
    >
      {state.loading ? (
        <Loading />
      ) : state.error ? (
        <Notice>{errorMessage(state.error)}</Notice>
      ) : !state.items.length ? (
        <Empty title="Your first step starts here">
          Explore an opportunity, complete your profile and send your first
          application.
        </Empty>
      ) : (
        <div className="application-list">
          {state.items
            .sort(
              (a, b) =>
                (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0),
            )
            .map((a) => (
              <article className="panel application-row" key={a.id}>
                <span className="org-mark">
                  {a.organization.slice(0, 2).toUpperCase()}
                </span>
                <div>
                  <Link to={"/opportunities/" + a.opportunityId}>
                    <h2>{a.opportunityTitle}</h2>
                  </Link>
                  <p>
                    {a.organization} ·{" "}
                    {a.createdAt?.toDate
                      ? dateLabel(a.createdAt.toDate())
                      : "Just submitted"}
                  </p>
                </div>
                <span className={"status " + a.status}>
                  {a.status.replaceAll("_", " ")}
                </span>
              </article>
            ))}
        </div>
      )}
    </Workspace>
  );
}
function Saved({ catalog }) {
  const { user } = useSession();
  const state = useOwned("bookmarks", user.uid);
  const [error, setError] = useState("");
  async function remove(item) {
    try {
      await toggleSaved(user.uid, { id: item.opportunityId }, true);
    } catch (e) {
      setError(errorMessage(e));
    }
  }
  return (
    <Workspace
      title="Saved for your next move."
      subtitle="Keep opportunities you like close by."
    >
      {error && <Notice>{error}</Notice>}
      {state.loading ? (
        <Loading />
      ) : state.error ? (
        <Notice>{errorMessage(state.error)}</Notice>
      ) : !state.items.length ? (
        <Empty title="A little inspiration goes a long way">
          Use the bookmark button on an opportunity to save it here.
        </Empty>
      ) : (
        state.items.map((b) => (
          <article className="panel application-row" key={b.id}>
            <Bookmark size={20} />
            <div>
              <Link to={"/opportunities/" + b.opportunityId}>
                <h2>{b.title}</h2>
              </Link>
              <p>
                {b.organization}
                {!catalog.items.some((o) => o.id === b.opportunityId)
                  ? " · No longer in the current listing"
                  : ""}
              </p>
            </div>
            <button
              className="button secondary small"
              onClick={() => remove(b)}
            >
              Remove
            </button>
          </article>
        ))
      )}
    </Workspace>
  );
}
function Profile() {
  const { user, profile, admin, createProfile } = useSession();
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    [file, setFile] = useState(null);
  async function save(e) {
    e.preventDefault();
    const values = new FormData(e.currentTarget);
    const data = Object.fromEntries(values);
    delete data.resume;
    data.skills = [
      ...new Set(
        data.skills
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      ),
    ].slice(0, 20);
    if (!validWebLink(data.portfolio)) {
      setError("Portfolio links must start with https://");
      return;
    }
    setBusy(true);
    setError("");
    setMessage("");
    try {
      let resumePath = profile?.resumePath || "";
      if (file) {
        if (file.type !== "application/pdf" || file.size > 5 * 1024 * 1024)
          throw new Error("Choose a PDF résumé under 5 MB.");
        resumePath = "resumes/" + user.uid + "/resume.pdf";
        await uploadBytes(ref(storage, resumePath), file, {
          contentType: "application/pdf",
        });
      }
      if (!profile) await createProfile(user, data.name);
      await updateDoc(doc(db, "users", user.uid), {
        ...data,
        resumePath,
        updatedAt: serverTimestamp(),
      });
      setFile(null);
      setMessage("Your profile has been saved.");
    } catch (e) {
      setError(e.code ? errorMessage(e) : e.message);
    } finally {
      setBusy(false);
    }
  }
  async function openResume() {
    setError("");
    try {
      window.open(
        await getDownloadURL(ref(storage, profile.resumePath)),
        "_blank",
        "noopener,noreferrer",
      );
    } catch (e) {
      setError(errorMessage(e));
    }
  }
  return (
    <Workspace
      title="Your story. Your potential."
      subtitle="Let your skills and ambition do the talking."
    >
      <div className="profile-summary panel">
        <div className="profile-avatar">
          {(profile?.name || user.email || "S")[0].toUpperCase()}
        </div>
        <div>
          <h2>{profile?.name || "Complete your profile"}</h2>
          <p>{user.email}</p>
          <span className="pill">{admin ? "Administrator" : "Student"}</span>
        </div>
        <strong>{completion(profile)}% complete</strong>
      </div>
      {error && <Notice>{error}</Notice>}
      {message && <Notice kind="success">{message}</Notice>}
      <form
        className="panel profile-form"
        onSubmit={save}
        key={user.uid + !!profile}
      >
        <h2>The basics</h2>
        <div className="form-grid">
          <label>
            Full name
            <input
              required
              maxLength={100}
              name="name"
              defaultValue={profile?.name || user.displayName || ""}
              autoComplete="name"
            />
          </label>
          <label>
            College / institution
            <input
              required
              maxLength={180}
              name="college"
              defaultValue={profile?.college || ""}
              placeholder="Every college belongs here"
            />
          </label>
          <label>
            Degree / programme
            <input
              required
              maxLength={100}
              name="degree"
              defaultValue={profile?.degree || ""}
              placeholder="e.g. B.Tech Computer Science"
            />
          </label>
          <label>
            Graduation year
            <input
              required
              name="graduationYear"
              type="number"
              min="2000"
              max="2100"
              defaultValue={profile?.graduationYear || ""}
            />
          </label>
          <label>
            City
            <input
              required
              maxLength={100}
              name="city"
              defaultValue={profile?.city || ""}
              autoComplete="address-level2"
            />
          </label>
          <label>
            Portfolio / GitHub <span className="optional">(optional)</span>
            <input
              type="url"
              maxLength={500}
              name="portfolio"
              defaultValue={profile?.portfolio || ""}
              placeholder="https://"
            />
          </label>
        </div>
        <label>
          About you
          <textarea
            maxLength={1500}
            name="bio"
            rows={3}
            defaultValue={profile?.bio || ""}
            placeholder="Your interests, projects and what you’d love to work on."
          />
        </label>
        <label>
          Skills{" "}
          <span className="optional">(separate with commas, up to 20)</span>
          <input
            maxLength={600}
            name="skills"
            defaultValue={profile?.skills?.join(", ") || ""}
            placeholder="React, communication, Figma…"
          />
        </label>
        <h2>Your résumé</h2>
        <p className="hint">
          PDF only, up to 5 MB. Stored privately in Firebase Storage.
        </p>
        <label className="upload-zone">
          <Upload size={22} />
          <span>
            {file
              ? file.name
              : profile?.resumePath
                ? "Replace your résumé"
                : "Choose your résumé PDF"}
          </span>
          <input
            type="file"
            name="resume"
            accept="application/pdf"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
        </label>
        {profile?.resumePath && (
          <button type="button" className="text-link" onClick={openResume}>
            View current résumé <ArrowUpRight size={15} />
          </button>
        )}
        <div className="form-footer">
          <p>Your profile is private to you and the platform administrator.</p>
          <button className="button" disabled={busy}>
            {busy ? "Saving…" : "Save profile"}
            <Check size={17} />
          </button>
        </div>
      </form>
    </Workspace>
  );
}
function Admin() {
  const { user } = useSession();
  const [tab, setTab] = useState("listings"),
    [listings, setListings] = useState([]),
    [apps, setApps] = useState([]),
    [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    const fail = (e) => setError(errorMessage(e));
    const a = onSnapshot(
      query(
        collection(db, "opportunities"),
        orderBy("createdAt", "desc"),
        limit(200),
      ),
      (s) => setListings(s.docs.map((d) => ({ ...d.data(), id: d.id }))),
      fail,
    );
    const b = onSnapshot(
      query(
        collection(db, "applications"),
        orderBy("createdAt", "desc"),
        limit(200),
      ),
      (s) => setApps(s.docs.map((d) => ({ ...d.data(), id: d.id }))),
      fail,
    );
    return () => {
      a();
      b();
    };
  }, []);
  async function publish(e) {
    e.preventDefault();
    const form = e.currentTarget;
    const d = Object.fromEntries(new FormData(form));
    if (Date.parse(d.deadline) <= Date.now()) {
      setError("Choose a future application deadline.");
      return;
    }
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await setDoc(doc(collection(db, "opportunities")), {
        ...d,
        skills: [
          ...new Set(
            d.skills
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean),
          ),
        ].slice(0, 20),
        stipend: Number(d.stipend),
        deadline: new Date(d.deadline).toISOString(),
        closesAt: Timestamp.fromDate(new Date(d.deadline)),
        status: "published",
        createdBy: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      form.reset();
      setMessage("Opportunity published. Students can now discover and apply.");
      setTab("listings");
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  async function status(collectionName, id, value) {
    setError("");
    setBusy(true);
    try {
      await updateDoc(doc(db, collectionName, id), {
        status: value,
        updatedAt: serverTimestamp(),
      });
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  async function resume(path) {
    try {
      window.open(
        await getDownloadURL(ref(storage, path)),
        "_blank",
        "noopener,noreferrer",
      );
    } catch (e) {
      setError(errorMessage(e));
    }
  }
  return (
    <Workspace
      title="Platform administration"
      subtitle="Publish opportunities and manage student applications."
    >
      <div className="type-tabs">
        {[
          ["listings", "Listings"],
          ["publish", "Publish opportunity"],
          ["applications", "Applications"],
        ].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={tab === key ? "active" : ""}
          >
            {label}
          </button>
        ))}
      </div>
      {error && <Notice>{error}</Notice>}
      {message && <Notice kind="success">{message}</Notice>}
      {tab === "publish" ? (
        <form className="panel profile-form" onSubmit={publish}>
          <h2>A new opportunity</h2>
          <div className="form-grid">
            {[
              ["title", "Opportunity title"],
              ["organization", "Organization"],
              ["location", "Location"],
              ["duration", "Duration"],
            ].map(([name, label]) => (
              <label key={name}>
                {label}
                <input required maxLength={180} name={name} />
              </label>
            ))}
            <label>
              Type
              <select name="type">
                {types.map((t) => (
                  <option key={t} value={t}>
                    {typeLabel[t]}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Category
              <select name="category">
                {categories.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </label>
            <label>
              Work mode
              <select name="mode">
                {["Remote", "On-site", "Hybrid"].map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </label>
            <label>
              Monthly stipend / prize pool (INR)
              <input
                name="stipend"
                type="number"
                min="0"
                max="10000000"
                required
                defaultValue="0"
              />
            </label>
            <label>
              Application deadline
              <input required name="deadline" type="datetime-local" />
            </label>
            <label>
              Skills (comma separated)
              <input name="skills" required maxLength={600} />
            </label>
          </div>
          {[
            ["description", "About the opportunity"],
            ["responsibilities", "Responsibilities / challenge brief"],
            ["eligibility", "Eligibility"],
          ].map(([name, label]) => (
            <label key={name}>
              {label}
              <textarea name={name} required maxLength={6000} rows={4} />
            </label>
          ))}
          <button disabled={busy} className="button">
            {busy ? "Publishing…" : "Publish opportunity"}
            <Plus size={16} />
          </button>
        </form>
      ) : tab === "listings" ? (
        <div className="application-list">
          {!listings.length ? (
            <Empty title="Publish your first opportunity">
              Use the Publish opportunity tab to create a real listing.
            </Empty>
          ) : (
            listings.map((o) => (
              <article className="panel application-row" key={o.id}>
                <Building2 size={22} />
                <div>
                  <Link to={"/opportunities/" + o.id}>
                    <h2>{o.title}</h2>
                  </Link>
                  <p>
                    {o.organization} · {typeLabel[o.type]}
                  </p>
                </div>
                <select
                  disabled={busy}
                  aria-label={"Publication status for " + o.title}
                  value={o.status}
                  onChange={(e) =>
                    status("opportunities", o.id, e.target.value)
                  }
                >
                  {["draft", "published", "closed"].map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </article>
            ))
          )}
        </div>
      ) : (
        <div className="application-list">
          {!apps.length ? (
            <Empty title="No applications yet">
              Submitted student applications will appear here.
            </Empty>
          ) : (
            apps.map((a) => (
              <article className="panel admin-application" key={a.id}>
                <div className="application-row">
                  <div>
                    <h2>
                      {a.studentName} · {a.opportunityTitle}
                    </h2>
                    <p>
                      {a.college} · {a.organization}
                    </p>
                  </div>
                  <select
                    disabled={busy}
                    aria-label={"Application status for " + a.studentName}
                    value={a.status}
                    onChange={(e) =>
                      status("applications", a.id, e.target.value)
                    }
                  >
                    {[
                      "submitted",
                      "under_review",
                      "shortlisted",
                      "selected",
                      "rejected",
                    ].map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </div>
                {a.coverNote && <p className="multiline">{a.coverNote}</p>}
                <button
                  className="text-link"
                  onClick={() => resume(a.resumePath)}
                >
                  View résumé <ArrowUpRight size={15} />
                </button>
              </article>
            ))
          )}
        </div>
      )}
      <p className="hint">
        Showing the latest 200 records. Roles are assigned through Firebase
        Admin custom claims, never by a student form.
      </p>
    </Workspace>
  );
}
function Setup() {
  return (
    <div className="container section setup-page">
      <span className="eyebrow blue">A FRESH FIREBASE FOUNDATION</span>
      <h1>Connect your new project.</h1>
      <p>
        The old Firebase project connection has been removed. The public preview
        runs now; real accounts and saved data need the following setup.
      </p>
      <div className="panel">
        <h2>1. Register a web app</h2>
        <p>
          Firebase Console → Project settings → General → Your apps → Web app.
          Copy its configuration into <code>frontend/.env.local</code> using{" "}
          <code>frontend/.env.example</code>.
        </p>
        <pre>
          apiKey{"\n"}authDomain{"\n"}projectId{"\n"}storageBucket{"\n"}
          messagingSenderId{"\n"}appId
        </pre>
        <h2>2. Enable Firebase services</h2>
        <p>
          Enable Authentication with Google and Email/Password. Add{" "}
          <code>localhost</code> to authorized domains. Create Cloud Firestore
          and Firebase Storage in the new project.
        </p>
        <h2>3. Deploy the access rules and indexes</h2>
        <p>
          Use the Firebase CLI with an explicit new project ID. See the README
          for commands. These rules protect profiles, résumés, bookmarks,
          applications and administrator operations.
        </p>
        <h2>4. Restart and verify</h2>
        <p>
          Run <code>npm run dev</code>. Create a student account, complete your
          profile, upload a résumé, and test an application. An administrator
          account is granted using the documented custom-claim script.
        </p>
        <Notice kind="info">
          The web app configuration is sufficient for the browser. Never paste a
          service-account private key into chat, frontend files or GitHub.
        </Notice>
      </div>
    </div>
  );
}
export default function App() {
  const catalog = useOpportunities();
  const location = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
    document.title = "Codovate — Your next chapter starts here";
  }, [location.pathname]);
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <Header />
      <PreviewBanner />
      <main id="main">
        <Routes>
          <Route path="/" element={<Home catalog={catalog} />} />
          <Route path="/explore" element={<Explore catalog={catalog} />} />
          <Route
            path="/opportunities"
            element={<Navigate to="/explore" replace />}
          />
          <Route
            path="/opportunities/:id"
            element={<Details catalog={catalog} />}
          />
          <Route path="/login" element={<AuthPage />} />
          <Route path="/signup" element={<AuthPage signup />} />
          <Route path="/register" element={<Navigate to="/signup" replace />} />
          <Route
            path="/dashboard"
            element={
              <Guard>
                <Dashboard catalog={catalog} />
              </Guard>
            }
          />
          <Route
            path="/profile"
            element={
              <Guard>
                <Profile />
              </Guard>
            }
          />
          <Route
            path="/applications"
            element={
              <Guard>
                <Applications />
              </Guard>
            }
          />
          <Route
            path="/saved"
            element={
              <Guard>
                <Saved catalog={catalog} />
              </Guard>
            }
          />
          <Route
            path="/admin"
            element={
              <Guard adminOnly>
                <Admin />
              </Guard>
            }
          />
          <Route path="/setup" element={<Setup />} />
          <Route
            path="*"
            element={
              <div className="container section">
                <Empty title="This page took a different path.">
                  Let’s get you back to your next opportunity.
                </Empty>
              </div>
            }
          />
        </Routes>
      </main>
      <Footer />
    </>
  );
}
