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
} from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  runTransaction,
  getDocsFromServer,
  setDoc,
  updateDoc,
  serverTimestamp,
  Timestamp,
  query,
  limit,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { auth, db, storage, configured } from "./firebase";
import { useSession } from "./session";
import { withTimeout, safeReturnPath } from "./authSupport";
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
  opportunityStatus,
  deadlineMillis,
  completion,
  isOpen,
  money,
  dateLabel,
  errorMessage,
  validWebLink,
  skillInputError,
} from "./domain";

import { httpsLink } from "./communityData";
import { useCareerPage } from "./careerData";
import {
  CareerPlanner,
  ResourceLibrary,
  StudentDirectory,
  CareerSpotlight,
} from "./Career";

import { Projects, Teams, ProjectDetails } from "./Community";

import { AdminAccounts, AdminSystem } from "./AdminOperations";
import { AdminLayout, adminModule } from "./AdminLayout";
import { Placement } from "./Placement";
import { CommunityCount } from "./CommunityCount";
import { TeamHub } from "./TeamHub";
import { PhoneLogin } from "./PhoneLogin";
import { PasswordRecovery } from "./PasswordRecovery";
import { Mentoring, BookingAdmin, Updates } from "./Growth";
import { Notifications, NotificationNav, AdminOverview } from "./Notifications";
import { useOpportunityCounts } from "./opportunityCounts.js";
import { Onboarding, OnboardingGate } from "./Onboarding.jsx";
import { splitFullName } from "./onboardingValidation";
import { needsOnboarding } from "./onboardingContract";
import { normalizeFullName } from "./profileNames";
import { OpportunityResources } from "./OpportunityResources.jsx";
import { HackathonDirectory } from "./HackathonDirectory.jsx";
import { hackathonDirectory } from "./hackathonCatalog.js";
import { externalById } from "./externalCatalog";
import { ExternalDetails } from "./ExternalDetails";
import { ResumeBuilder } from "./ResumeBuilder";
import { applicationDecision } from "./notificationData";

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
  ["/placement", "Placement prep"],
  ["/placement?section=career-portals", "Top Companies – Careers"],
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
                loc.pathname === to.split("?")[0] &&
                ["type", "section"].every(key =>
                  new URLSearchParams(loc.search).get(key) ===
                    new URLSearchParams(to.split("?")[1]).get(key))
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
      <p>Made for your next move.</p>
      <div>
        <Link to="/explore">Explore</Link>
        <Link to="/profile">Your profile</Link>
        <Link to="/learn">Learning library</Link>
        <Link to="/resume">Résumé templates</Link>
        <Link to="/projects">Project showcase</Link>
        <Link to="/updates">Updates</Link>
        {!configured && <Link to="/setup">Setup guide</Link>}
      </div>
      <small>© {new Date().getFullYear()} Codovate</small>
    </footer>
  );
}
function PreviewBanner() {
  return (
    !configured && (
      <div className="preview-banner">
        <span>
          <Sparkles size={14} /> Firebase not connected · Official listings
          available
        </span>
        <Link to="/setup">
          Setup <ArrowRight size={14} />
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
          {
            {
              internship: "Internship",
              job: "Job",
              competition: "Competition",
              hackathon: "Hackathon",
            }[item.type]
          }
        </span>
        {onSave && !item.external && (
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
      <div className="card-deadline">
        <span className="availability-dot" />{" "}
        {item.external ? "Check official availability" : opportunityStatus(item) === "closed" ? "Closed" : "Applications open"}
        {item.type === "hackathon" && Number.isFinite(deadlineMillis(item)) && <> · Closes {dateLabel(deadlineMillis(item))}</>}
      </div>
      <div className="card-bottom">
        <div>
          <strong>
            {item.external
              ? item.type === "hackathon"
                ? "See prize rules"
                : "Pay not stated"
              : money(item.stipend)}
          </strong>
          <small>
            {item.external
              ? "Official application"
              : ["competition", "hackathon"].includes(item.type)
                ? "Prize pool"
                : "/ month"}
          </small>
        </div>
        <Link
          to={"/opportunities/" + item.id}
          aria-label={"View " + item.title}
        >
          View details <ArrowUpRight size={15} />
        </Link>
      </div>
    </article>
  );
}
function Home({ catalog }) {
  const liveCounts = useOpportunityCounts();
  const [search, setSearch] = useState("");
  const [activeType, setActiveType] = useState("all");
  const navigate = useNavigate();
  const open = catalog.items.filter((o) => isOpen(o));
  const featured = filterOpportunities(open, { type: activeType });
  return (
    <div className="landing">
      <section className="intro container">
        <div className="intro-copy">
          <span className="intro-label">
            <span className="green-dot" /> FOR EVERY COLLEGE. FOR YOU.
          </span>
          <h1>
            Find your next
            <br />
            <em>big move.</em>
            <span className="heading-spark" aria-hidden="true">
              ✳
            </span>
          </h1>
          <p>
            Internships, jobs and challenges.
            <br />
            One place to get started.
          </p>
          <form
            className="hero-search"
            onSubmit={(e) => {
              e.preventDefault();
              navigate("/explore?search=" + encodeURIComponent(search));
            }}
          >
            <Search size={21} />
            <input
              aria-label="Search opportunities"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Role, skill or company"
            />
            <button className="button" type="submit">
              Search <ArrowRight size={17} />
            </button>
          </form>
          <CommunityCount />
          <div className="quick-search">
            <span>Try</span>
            {["Remote", "React", "Design"].map((term) => (
              <Link
                key={term}
                to={
                  term === "Remote"
                    ? "/explore?mode=Remote"
                    : "/explore?search=" + term
                }
              >
                {term}
                <ArrowUpRight size={12} />
              </Link>
            ))}
          </div>
        </div>
        <div className="launch-board" aria-label="Explore your next step">
          <Link
            className="launch-tile launch-intern"
            to="/explore?type=internship"
          >
            <div className="tile-top">
              <span>01 / GET EXPERIENCE</span>
              <ArrowUpRight size={23} />
            </div>
            <div className="tile-art briefcase-art" aria-hidden="true">
              <BriefcaseBusiness size={92} strokeWidth={1.2} />
              <span className="art-dot" />
            </div>
            <div className="tile-bottom">
              <h2>Internships</h2>
              <span>Start doing.</span>
            </div>
          </Link>
          <Link
            className="launch-tile launch-compete"
            to="/explore?type=competition"
          >
            <div className="tile-top">
              <span>02 / STAND OUT</span>
              <ArrowUpRight size={22} />
            </div>
            <div className="tile-art trophy-art" aria-hidden="true">
              <Trophy size={65} strokeWidth={1.3} />
              <span>✦</span>
            </div>
            <div className="tile-bottom">
              <h2>Competitions</h2>
            </div>
          </Link>
          <Link
            className="launch-tile launch-build"
            to="/explore?type=hackathon"
          >
            <Code2 size={34} strokeWidth={1.4} />
            <h2>Build. Solve. Repeat.</h2>
            <ArrowUpRight size={22} />
          </Link>
        </div>
      </section>
      <section
        className="category-strip container"
        aria-label="Explore by opportunity type"
      >
        {types.map((type) => {
          const Icon = categoryIcons[type];
          return (
            <Link
              className={"path-card " + type}
              key={type}
              to={"/explore?type=" + type}
            >
              <span className="path-icon">
                <Icon size={20} />
              </span>
              <h2>{typeLabel[type]}</h2>
              <span className="category-count" aria-live="polite">
                <strong>{type === "hackathon"
                  ? (hackathonDirectory.length + (liveCounts.counts[type] || 0)).toLocaleString("en-IN")
                  : Number.isInteger(liveCounts.counts[type]) ? liveCounts.counts[type].toLocaleString("en-IN") : liveCounts.loading ? "…" : "—"}</strong>
              </span>
              <ArrowUpRight size={16} />
            </Link>
          );
        })}
      </section>
      <section className="opportunities-section container">
        <div className="section-heading">
          <div>
            <span className="eyebrow">THE OPPORTUNITY BOARD</span>
            <h2>Worth a closer look.</h2>
          </div>
          <Link className="text-link" to="/explore">
            Explore all <ArrowRight size={16} />
          </Link>
        </div>
        <div className="board-toolbar">
          <div
            className="board-tabs"
            aria-label="Featured opportunity categories"
          >
            {[
              ["all", "All"],
              ["internship", "Internships"],
              ["job", "Jobs"],
              ["competition", "Competitions"],
              ["hackathon", "Hackathons"],
            ].map(([value, label]) => (
              <button
                key={value}
                onClick={() => setActiveType(value)}
                aria-pressed={activeType === value}
                className={activeType === value ? "active" : ""}
              >
                {label}
              </button>
            ))}
          </div>
          <span className="board-note">{featured.length ? "Recently added" : "Explore trusted sources"}</span>
        </div>
        {catalog.loading && !featured.length ? (
          <Loading />
        ) : catalog.error && !featured.length ? (
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
        ) : ["all", "hackathon"].includes(activeType) ? (
          <OpportunityResources type={activeType} />
        ) : (
          <Empty title="No published listings in this category yet">
            New verified listings will appear here when published.
          </Empty>
        )}
      </section>
      <CareerSpotlight />
      <section className="profile-invite container">
        <span className="invite-icon">
          <UserRound size={29} />
        </span>
        <div>
          <h2>Your skills deserve a spotlight.</h2>
          <p>Build your profile. Be ready for what’s next.</p>
        </div>
        <Link className="button" to="/signup">
          Create your profile <ArrowRight size={16} />
        </Link>
      </section>
    </div>
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
    ...(type === "hackathon" ? { availability: params.get("availability") || "all", group: params.get("group") || "all", openOnly: false } : {}),
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
        <span className="eyebrow blue">EXPLORE</span>
        <h1>{typeLabel[type] || "Explore opportunities."}</h1>
        <p>Find something that fits you.</p>
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
          {type === "hackathon" && <>
            <label>Registration status<select value={filters.availability} onChange={e => change("availability", e.target.value)}>
              <option value="all">All statuses</option><option value="open">Open now</option><option value="upcoming">Coming soon</option><option value="ongoing">Event in progress</option><option value="closed">Closed</option><option value="unverified">Dates not announced / verify</option>
            </select></label>
            <label>Hackathon section<select value={filters.group} onChange={e => change("group", e.target.value)}>
              <option value="all">All sections</option>{[...new Set(hackathonDirectory.map(row => row.group))].map(group => <option key={group}>{group}</option>)}
            </select></label>
          </>}
          <button className="text-link" onClick={() => setParams(type === "hackathon" ? { type: "hackathon" } : {})}>
            Clear all filters
          </button>
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
              {type === "hackathon" && <option value="eventDate">Event date — upcoming first</option>}
              <option value="stipend">Highest stipend / prize</option>
            </select>
          </div>
          {type === "hackathon" && <p className="hint">Listing filters apply to loaded opportunities. Section filters below apply to the reference directory; dated opportunities remain visible separately.</p>}
          {rows.length > 0 && <p className="result-count">
            {rows.length} matching loaded opportunities
          </p>}
          {notice && (
            <Notice kind="info">
              {notice} {!user && <Link to="/login">Sign in</Link>}
            </Notice>
          )}
          {catalog.loading && !catalog.items.length ? (
            <Loading />
          ) : catalog.error && !rows.length ? (
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
          ) : type === "hackathon" ? null : (
            <Empty title="No matching opportunities">
              Try another skill or remove a filter. New listings appear here when published.
            </Empty>
          )}
          {type === "hackathon" && <HackathonDirectory filters={filters} />}
          {configured && (
            <div className="career-controls">
              <button
                className="button secondary"
                disabled={catalog.loading}
                onClick={catalog.retry}
              >
                Refresh opportunities
              </button>
              {catalog.more && (
                <button
                  className="button"
                  disabled={catalog.loading}
                  onClick={catalog.loadMore}
                >
                  Load more opportunities
                </button>
              )}
              <p className="hint">
                Filters search loaded listings. Load more to explore older
                opportunities.
              </p>
            </div>
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
    const external = externalById(id);
    if (external || !configured) {
      setItem(external || catalog.items.find((o) => o.id === id) || null);
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
  if (item?.external) return <ExternalDetails item={item} />;
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
              Preview listing. Connect Firebase to enable applications.
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
            {applied || success ? "You’re in the running." : "Make your move."}
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
              {user &&
                (!(profile?.resumePath || profile?.resumeUrl) ||
                  !profile?.college) && (
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
function AccountRecovery() {
  const { user, sessionError, retrySession, logout } = useSession();
  const profileIssue = !!user && sessionError?.source === "profile";
  const [signingOut, setSigningOut] = useState(false),
    [signOutError, setSignOutError] = useState("");
  async function leave() {
    setSigningOut(true);
    setSignOutError("");
    try {
      await logout();
    } catch (e) {
      setSignOutError(errorMessage(e));
    } finally {
      setSigningOut(false);
    }
  }
  return (
    <div className="container section setup-page">
      <div className="panel account-recovery">
        <span className="eyebrow blue">ACCOUNT CONNECTION</span>
        <h1>
          {profileIssue
            ? "You’re signed in."
            : user
              ? "Your session needs attention."
              : "We couldn’t restore your session."}
        </h1>
        <p>
          {profileIssue
            ? "Your account data couldn’t load. Your sign-in worked; the workspace needs its database connection restored."
            : user
              ? "We couldn’t verify your current session. Retry or sign out and sign in again."
              : "Check your connection, then try again."}
        </p>
        <Notice>{errorMessage(sessionError)}</Notice>
        {signOutError && <Notice>{signOutError}</Notice>}
        <div className="recovery-actions">
          <button className="button" onClick={retrySession}>
            Try again <ArrowRight size={16} />
          </button>
          {user ? (
            <button
              className="button secondary"
              onClick={leave}
              disabled={signingOut}
            >
              {signingOut ? "Signing out…" : "Sign out"}
            </button>
          ) : (
            <Link
              className="button secondary"
              to="/login"
              onClick={retrySession}
            >
              Back to sign in
            </Link>
          )}
          <Link className="text-link" to="/setup">
            Connection help
          </Link>
        </div>
        {profileIssue && (
          <p className="hint">
            If access is denied, the platform administrator must deploy the
            Firebase rules. Re-entering your password will not fix database
            permissions.
          </p>
        )}
      </div>
    </div>
  );
}
function Guard({ children, adminOnly = false, allowOnboarding = false }) {
  const { user, profile, admin, loading, sessionError } = useSession();
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
  if (sessionError) return <AccountRecovery />;
  if (!user)
    return (
      <Navigate
        to="/login"
        state={{ from: loc.pathname + loc.search }}
        replace
      />
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
  if (!allowOnboarding && !adminOnly && !admin && (!profile || needsOnboarding(profile))) {
    return <Navigate to="/onboarding" replace state={{ from: loc.pathname + loc.search }} />;
  }
  return children;
}
function AuthPage({ signup = false }) {
  const { user, createProfile, sessionError, loading } = useSession();
  const navigate = useNavigate();
  const loc = useLocation();
  const [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  const from = safeReturnPath(loc.state?.from);
  if (sessionError && !busy) return <AccountRecovery />;
  if (loading && !busy) return <Loading />;
  if (user && !busy && !error) return <Navigate to={from} replace />;
  async function ensureProfile(u, name) {
    await createProfile(u, name);
  }
  async function submit(e) {
    e.preventDefault();
    if (!configured || busy) return;
    const data = new FormData(e.currentTarget);
    setBusy(true);
    setError("");
    let authenticatedUser = null;
    try {
      const result = await withTimeout(
        signup
          ? createUserWithEmailAndPassword(
              auth,
              data.get("email").trim(),
              data.get("password"),
            )
          : signInWithEmailAndPassword(
              auth,
              data.get("email").trim(),
              data.get("password"),
            ),
        "app/auth-timeout",
        25000,
      );
      authenticatedUser = result.user;
      await ensureProfile(result.user, data.get("name"));
      navigate(from, { replace: true });
    } catch (e) {
      // Profile failures are owned by SessionProvider. Keep its recovery screen
      // mounted here instead of navigating to another copy during the same render.
      if (!authenticatedUser || auth.currentUser?.uid !== authenticatedUser.uid)
        setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  async function google() {
    if (!configured || busy) return;
    setBusy(true);
    setError("");
    let authenticatedUser = null;
    try {
      const result = await signInWithPopup(auth, new GoogleAuthProvider());
      authenticatedUser = result.user;
      await ensureProfile(result.user);
      navigate(from, { replace: true });
    } catch (e) {
      // Profile failures are owned by SessionProvider. Keep its recovery screen
      // mounted here instead of navigating to another copy during the same render.
      if (!authenticatedUser || auth.currentUser?.uid !== authenticatedUser.uid)
        setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  function reset() {
    navigate("/forgot-password", {
      state: {
        ...loc.state,
        email: document.querySelector("#auth-email")?.value || "",
      },
    });
  }

  return (
    <div className="auth-layout container">
      <div className="auth-story">
        <span className="eyebrow">YOUR NEXT CHAPTER</span>
        <h1>
          A little ambition.
          <br />
          <em>A world of possibility.</em>
        </h1>
        <div className="auth-symbol" aria-hidden="true">
          ✳
        </div>
        <p>Where you study is just the beginning.</p>
      </div>
      <div className="auth-card panel">
        <h2>{signup ? "Create your account." : "Welcome back."}</h2>
        <p>
          {signup
            ? "Create your free student account."
            : "Good to see you again."}
        </p>
        {!configured && (
          <Notice kind="info">
            New Firebase connection pending.{" "}
            <Link to="/setup">See what to configure.</Link>
          </Notice>
        )}
        {window.location.hostname === "127.0.0.1" &&
          import.meta.env.VITE_USE_EMULATORS !== "true" && (
            <Notice kind="info">
              For Google sign-in, open this app on{" "}
              <a href={window.location.href.replace("127.0.0.1", "localhost")}>
                localhost
              </a>
              , the domain authorized for this project.
            </Notice>
          )}
        {error && (
          <Notice>
            {error}
            {user && <Link to="/profile"> Open profile setup</Link>}
          </Notice>
        )}
        {message && <Notice kind="success">{message}</Notice>}
        <button
          className="button secondary full google-button"
          disabled={!configured || busy}
          onClick={google}
        >
          <span className="google-g" aria-hidden="true">
            G
          </span>{" "}
          Continue with Google
        </button>
        <Link className="button secondary full" to="/phone-login" state={loc.state}><span aria-hidden="true">📱</span>{" "}Continue with phone OTP</Link>
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
              minLength={signup ? 8 : undefined}
              type="password"
              autoComplete={signup ? "new-password" : "current-password"}
              placeholder={signup ? "At least 8 characters" : "Your password"}
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
          ["/planner", "Career planner", CheckCircle2],
          ["/resume", "Résumé templates", FileText],
          ["/placement", "Placement preparation", GraduationCap],
          ["/projects?view=mine", "My projects", Code2],
          ["/teams", "Find a team", Building2],
          ["/mentoring", "Mentor sessions", GraduationCap],
          ["/updates", "Platform updates", Sparkles],
          ["/profile", "My profile", UserRound],
          ...(admin ? [["/admin", "Administration", ShieldCheck]] : []),
        ].map(([to, label, Icon]) => (
          <NavLink key={to} to={to}>
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
        <NotificationNav />
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
function RoleHome({ catalog }) {
  const { admin } = useSession();
  return admin ? (
    <Navigate to="/admin" replace />
  ) : (
    <Dashboard catalog={catalog} />
  );
}
function Dashboard({ catalog }) {
  const { user, profile, admin } = useSession();
  const profileCompletion = completion(profile);
  const apps = useOwned("applications", user.uid),
    saved = useOwned("bookmarks", user.uid);
  return (
    <Workspace
      title={"Hi, " + (profile?.name?.split(" ")[0] || "there") + "."}
      subtitle="Your activity at a glance."
    >
      <section className="dashboard-callout">
        <div>
          <span className="eyebrow">YOUR PROFILE</span>
          <h2>Ready for your next opportunity?</h2>
          <p>{profileCompletion === 100 ? "Your profile is ready. Keep your details up to date as you grow." : "Add your skills and résumé to start applying."}</p>
          <Link className="button" to="/profile">
            {profileCompletion === 100 ? "View your profile" : "Complete your profile"} <ArrowRight size={16} />
          </Link>
        </div>
        <div className="progress-circle" role="progressbar" aria-label="Profile completeness" aria-valuemin={0} aria-valuemax={100} aria-valuenow={profileCompletion} style={{"--progress":`${profileCompletion}%`}}>
          <strong>{profileCompletion}%</strong>
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
          [
            "Add your résumé",
            !!(profile?.resumePath || profile?.resumeUrl),
            "/profile",
          ],
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
      <div className="career-controls">
        <Link className="button" to="/planner">
          Plan your next step <CheckCircle2 size={16} />
        </Link>
        <Link className="button secondary" to="/learn">
          Build a new skill <GraduationCap size={16} />
        </Link>
      </div>
      <section className="dashboard-paths">
        <Link to="/projects?view=mine">
          <span className="path-symbol">
            <Code2 size={22} />
          </span>
          <div>
            <h2>Show what you can build.</h2>
            <p>Add a project to your portfolio.</p>
          </div>
          <ArrowUpRight size={18} />
        </Link>
        <Link to="/teams">
          <span className="path-symbol sage">
            <Building2 size={22} />
          </span>
          <div>
            <h2>Meet your next teammates.</h2>
            <p>Find a shared idea. Start building.</p>
          </div>
          <ArrowUpRight size={18} />
        </Link>
      </section>
      <div className="career-controls">
        <Link className="button secondary" to="/mentoring">
          Find mentor guidance <GraduationCap size={16} />
        </Link>
        <Link className="button secondary" to="/updates">
          What’s new at Codovate <Sparkles size={16} />
        </Link>
      </div>
      {profile?.skills?.length > 0 && (
        <section className="section">
          <div className="section-heading">
            <div>
              <span className="eyebrow">BASED ON YOUR SKILLS</span>
              <h2>Worth a closer look.</h2>
            </div>
          </div>
          <div className="resource-grid">
            {catalog.items
              .filter(isOpen)
              .map((o) => ({
                ...o,
                score: o.skills.filter((skill) =>
                  profile.skills.some(
                    (s) => s.toLowerCase() === skill.toLowerCase(),
                  ),
                ).length,
              }))
              .filter((o) => o.score > 0)
              .sort((a, b) => b.score - a.score)
              .slice(0, 4)
              .map((o) => (
                <Card item={o} key={o.id} />
              ))}
          </div>
          <p className="hint">
            Suggestions use exact skill matches from the loaded opportunity
            catalog. <Link to="/explore">Browse all opportunities</Link>.
          </p>
        </section>
      )}
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
      subtitle="Track every application in one place."
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
      title="Saved opportunities"
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
    try { data.name = normalizeFullName(data.name); if (profile?.nameParts) data.nameParts = splitFullName(data.name); }
    catch (failure) { setError(failure.message); return; }
    const skillsError = skillInputError(data.skills);
    if (skillsError) {
      setError(skillsError);
      return;
    }
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
      data.resumeUrl = httpsLink(data.resumeUrl);
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
      await runTransaction(db, async (transaction) => {
        const profileRef = doc(db, "users", user.uid);
        const memberRef = doc(db, "memberProfiles", user.uid);
        const current = await transaction.get(profileRef);
        const publicCard = await transaction.get(memberRef);
        if (!current.exists())
          throw new Error("Your profile is unavailable. Please retry.");
        if (publicCard.exists())
          transaction.update(memberRef, {
            uid: user.uid,
            name: data.name,
            skills: data.skills,
            updatedAt: serverTimestamp(),
          });
        transaction.update(profileRef, {
          ...data,
          resumePath,
          updatedAt: serverTimestamp(),
        });
        transaction.set(doc(db, "adminUsers", user.uid), {
          uid: user.uid,
          fullName: data.name,
          joinedAt: current.data().createdAt,
          updatedAt: serverTimestamp(),
        });
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
        profile.resumeUrl
          ? httpsLink(profile.resumeUrl, true)
          : await getDownloadURL(ref(storage, profile.resumePath)),
        "_blank",
        "noopener,noreferrer",
      );
    } catch (e) {
      setError(errorMessage(e));
    }
  }
  return (
    <Workspace title="My profile" subtitle="Keep your details up to date.">
      <div className="profile-summary panel">
        <div className="profile-avatar">
          {(profile?.name || user.email || "S")[0].toUpperCase()}
        </div>
        <div>
          <h2>{profile?.name?.toUpperCase() || "Complete your profile"}</h2>
          <p>{user.email}</p>
          <span className="pill">{admin ? "Administrator" : "Student"}</span>
        </div>
        <strong>{completion(profile)}% complete</strong>
      </div>
      {profile?.careerPreferences && <section className="panel onboarding-profile-details" aria-label="Career and collaboration profile">
        <h2>Career & collaboration</h2>
        <div className="form-grid">
          <div><strong>Professional direction</strong><p>{profile.careerPreferences.desiredRole} · {profile.careerPreferences.domain}</p><p>{profile.careerPreferences.experience} · {profile.careerPreferences.yearOfStudy}</p></div>
          <div><strong>Career goals</strong><p>{profile.careerPreferences.goals.join(" · ") || "Not selected"}</p></div>
          <div><strong>Collaboration</strong><p>{profile.careerPreferences.mode} · {profile.careerPreferences.availability}</p><p>{profile.careerPreferences.seeking.join(" · ") || "Exploring opportunities"}</p></div>
        </div>
        <p className="hint">Your preferences stay private. Manage teammate discovery and optional shared details in Find a team.</p>
        <Link className="button secondary" to="/teams?hub=people">Find teammates <ArrowUpRight size={15} /></Link>
      </section>}
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
              defaultValue={(profile?.name || user.displayName || "").toUpperCase()}
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
          Use an HTTPS résumé link if file uploads are unavailable. PDF uploads
          require Firebase Storage and are limited to 5 MB.
        </p>
        <label>
          HTTPS résumé link (no upload required)
          <input
            name="resumeUrl"
            type="url"
            pattern="https://.*"
            maxLength={500}
            defaultValue={profile?.resumeUrl || ""}
            placeholder="https://…"
          />
        </label>
        <p className="hint">
          Allow reviewers to open this link. It is stored in your private
          profile and shared with administrators when you apply. Access to the
          external file is controlled by its provider.
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
        {file && (
          <button
            type="button"
            className="text-link"
            onClick={(e) => {
              setFile(null);
              const input = e.currentTarget.form.elements.namedItem("resume");
              if (input) input.value = "";
            }}
          >
            Clear selected PDF
          </button>
        )}
        {(profile?.resumePath || profile?.resumeUrl) && (
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
  const listingPage = useCareerPage("opportunities", null, true);
  const appPage = useCareerPage("applications", null, true);
  const listings = listingPage.items,
    apps = appPage.items;
  const [adminParams, setAdminParams] = useSearchParams();
  const tab = adminModule(adminParams.get("tab")).id;
  const setTab = (value) => setAdminParams({ tab: value });
  const [editing, setEditing] = useState(null),
    [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  async function publish(e) {
    e.preventDefault();
    const form = e.currentTarget;
    const d = Object.fromEntries(new FormData(form));
    const skillsError = skillInputError(d.skills);
    if (skillsError) {
      setError(skillsError);
      return;
    }
    if (Date.parse(d.deadline) <= Date.now()) {
      setError("Choose a future application deadline.");
      return;
    }
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const payload = {
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
        status: editing?.status || "published",
        updatedAt: serverTimestamp(),
      };
      if (editing)
        await updateDoc(doc(db, "opportunities", editing.id), payload);
      else
        await setDoc(doc(collection(db, "opportunities")), {
          ...payload,
          createdBy: user.uid,
          createdAt: serverTimestamp(),
        });
      form.reset();
      setEditing(null);
      listingPage.refresh();
      setMessage("Opportunity saved.");
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
      if (collectionName === "applications")
        await applicationDecision(user.uid, id, value);
      else
        await updateDoc(doc(db, collectionName, id), {
          status: value,
          updatedAt: serverTimestamp(),
        });
      (collectionName === "opportunities" ? listingPage : appPage).refresh();
      setMessage("Status updated.");
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  async function resume(path, url) {
    try {
      window.open(
        url ? httpsLink(url, true) : await getDownloadURL(ref(storage, path)),
        "_blank",
        "noopener,noreferrer",
      );
    } catch (e) {
      setError(errorMessage(e));
    }
  }
  return (
    <AdminLayout>
      {error && <Notice>{error}</Notice>}
      {message && <Notice kind="success">{message}</Notice>}
      {tab === "overview" ? (
        <AdminOverview open={setTab} />
      ) : tab === "users" ? (
        <AdminAccounts />
      ) : tab === "system" ? (
        <AdminSystem />
      ) : tab === "notifications" ? (
        <Notifications manage />
      ) : tab === "placement" ? (
        <Placement manage />
      ) : tab === "resources" ? (
        <ResourceLibrary manage />
      ) : tab === "students" ? (
        <StudentDirectory />
      ) : tab === "projects" ? (
        <Projects manage />
      ) : tab === "teams" ? (
        <Teams manage />
      ) : tab === "mentoring" ? (
        <Mentoring manage />
      ) : tab === "bookings" ? (
        <BookingAdmin />
      ) : tab === "updates" ? (
        <Updates manage />
      ) : tab === "publish" ? (
        <form
          key={editing?.id || "new-listing"}
          className="panel profile-form"
          onSubmit={publish}
        >
          <h2>{editing ? "Edit opportunity" : "A new opportunity"}</h2>
          <div className="form-grid">
            {[
              ["title", "Opportunity title"],
              ["organization", "Organization"],
              ["location", "Location"],
              ["duration", "Duration"],
            ].map(([name, label]) => (
              <label key={name}>
                {label}
                <input
                  required
                  maxLength={180}
                  name={name}
                  defaultValue={editing?.[name]}
                />
              </label>
            ))}
            <label>
              Type
              <select name="type" defaultValue={editing?.type}>
                {types.map((t) => (
                  <option key={t} value={t}>
                    {typeLabel[t]}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Category
              <select name="category" defaultValue={editing?.category}>
                {categories.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </label>
            <label>
              Work mode
              <select name="mode" defaultValue={editing?.mode}>
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
                defaultValue={editing?.stipend ?? 0}
              />
            </label>
            <label>
              Application deadline
              <input
                required
                name="deadline"
                type="datetime-local"
                defaultValue={
                  editing
                    ? new Date(
                        Date.parse(editing.deadline) -
                          new Date(editing.deadline).getTimezoneOffset() *
                            60000,
                      )
                        .toISOString()
                        .slice(0, 16)
                    : ""
                }
              />
            </label>
            <label>
              Skills (comma separated)
              <input
                name="skills"
                required
                maxLength={1200}
                defaultValue={editing?.skills?.join(", ")}
              />
            </label>
          </div>
          {[
            ["description", "About the opportunity"],
            ["responsibilities", "Responsibilities / challenge brief"],
            ["eligibility", "Eligibility"],
          ].map(([name, label]) => (
            <label key={name}>
              {label}
              <textarea
                name={name}
                required
                maxLength={6000}
                rows={4}
                defaultValue={editing?.[name]}
              />
            </label>
          ))}
          <button disabled={busy} className="button">
            {busy
              ? "Saving…"
              : editing
                ? "Save changes"
                : "Publish opportunity"}
            <Plus size={16} />
          </button>
          {editing && (
            <button
              type="button"
              className="button secondary"
              onClick={() => setEditing(null)}
            >
              Cancel editing
            </button>
          )}
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
                <button
                  className="button secondary"
                  disabled={busy}
                  onClick={() => {
                    setEditing(o);
                    setTab("publish");
                  }}
                >
                  Edit
                </button>
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
                  onClick={() => resume(a.resumePath, a.resumeUrl)}
                >
                  View résumé <ArrowUpRight size={15} />
                </button>
              </article>
            ))
          )}
        </div>
      )}
      {["listings", "applications"].includes(tab) &&
        (() => {
          const page = tab === "listings" ? listingPage : appPage;
          return (
            <div className="career-controls">
              {page.error && <Notice>{errorMessage(page.error)}</Notice>}
              {page.loading && <span role="status">Loading records…</span>}
              <button
                className="button secondary"
                disabled={page.loading}
                onClick={page.refresh}
              >
                Refresh records
              </button>
              {page.more && (
                <button
                  className="button"
                  disabled={page.loading}
                  onClick={page.loadMore}
                >
                  Load more records
                </button>
              )}
            </div>
          );
        })()}
      <p className="hint">
        Roles are assigned through trusted Firebase Admin custom claims.
        Students cannot grant themselves access.
      </p>
    </AdminLayout>
  );
}
function Setup() {
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState(null);
  const projectId = auth?.app?.options?.projectId || "codovate-dev";
  async function checkDatabase() {
    setChecking(true);
    setResult(null);
    let timer;
    try {
      await Promise.race([
        getDocsFromServer(
          query(
            collection(db, "opportunities"),
            where("status", "==", "published"),
            limit(1),
          ),
        ),
        new Promise((_, reject) => {
          timer = setTimeout(
            () =>
              reject(
                Object.assign(new Error("Connection timed out"), {
                  code: "app/check-timeout",
                }),
              ),
            12000,
          );
        }),
      ]);
      setResult({
        ok: true,
        message:
          "Live Firestore read succeeded for " +
          projectId +
          ". No data was written.",
      });
    } catch (e) {
      setResult({ ok: false, message: errorMessage(e) });
    } finally {
      clearTimeout(timer);
      setChecking(false);
    }
  }
  return (
    <div className="container section setup-page">
      <span className="eyebrow blue">FIREBASE CONNECTION</span>
      <h1>Project setup.</h1>
      <p>
        Project: <strong>{projectId}</strong>. Authentication, Firestore and
        private résumé storage.
      </p>
      <div className="panel">
        <h2>Connection status</h2>
        <Notice kind={configured ? "success" : "info"}>
          {configured
            ? "Web configuration loaded. Verify the live database below."
            : "Local configuration is not loaded yet. Run the setup command below, then restart the app."}
        </Notice>
        <button
          className="button secondary"
          disabled={!configured || checking}
          onClick={checkDatabase}
        >
          {checking ? "Checking Firestore…" : "Check live Firestore"}
          <ShieldCheck size={16} />
        </button>
        {result && (
          <Notice kind={result.ok ? "success" : "error"}>
            {result.message}
          </Notice>
        )}
        <h2>1. Connect and deploy database protections</h2>
        <p>From the repository folder, run:</p>
        <pre>npm run firebase:setup</pre>
        <p>
          Sign in with the Google account that owns {projectId}. Setup fetches
          the correct web configuration, saves the ignored local environment
          file, and deploys the included Firestore rules, indexes and Storage
          rules. It does not import sample data or deploy the website.
        </p>
        <h2>2. Enable the Firebase services</h2>
        <p>
          In Firebase Console, create the Firestore database and Storage bucket
          if needed. Enable Google and Email/Password in Authentication. Use{" "}
          <code>localhost</code> as an authorized domain.
        </p>
        <h2>3. Start and verify</h2>
        <pre>npm run dev</pre>
        <p>
          Open <code>http://localhost:5173</code>. Create your account, save
          your profile and upload a résumé. Administrators publish opportunities
          and review applications; roles are assigned with the documented
          trusted operator tool.
        </p>
        <Notice kind="info">
          A loaded configuration is not proof that services, rules and login
          providers are ready. The live check verifies a server read only. Never
          put service-account private keys in this app or GitHub.
        </Notice>
      </div>
    </div>
  );
}
export default function App() {
  const { admin } = useSession();
  const catalog = useOpportunities();
  const location = useLocation();
  const adminScreen = admin && location.pathname === "/admin";
  const onboardingScreen = location.pathname === "/onboarding";
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
    document.title = adminScreen
      ? "Codovate — Admin console"
      : "Codovate — Your next chapter starts here";
  }, [location.pathname, adminScreen]);
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      {onboardingScreen && <header className="onboarding-brand-bar"><Logo /><span><ShieldCheck size={15} aria-hidden="true" />Your profile. Your next chapter.</span></header>}
      {!adminScreen && !onboardingScreen && <Header />}
      {!adminScreen && !onboardingScreen && <PreviewBanner />}
      <main id="main">
        <OnboardingGate>
        <Routes>
          <Route path="/onboarding" element={<Guard allowOnboarding><Onboarding /></Guard>} />
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
          <Route path="/phone-login" element={<PhoneLogin />} />
          <Route path="/signup" element={<AuthPage signup />} />
          <Route path="/forgot-password" element={<PasswordRecovery />} />
          <Route path="/register" element={<Navigate to="/signup" replace />} />
          <Route
            path="/dashboard"
            element={
              <Guard>
                <RoleHome catalog={catalog} />
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
          <Route
            path="/planner"
            element={
              <Guard>
                <Workspace
                  title="Your career planner"
                  subtitle="Turn your ambitions into small, achievable steps."
                >
                  <CareerPlanner />
                </Workspace>
              </Guard>
            }
          />
          <Route
            path="/learn"
            element={
              <Workspace
                title="The learning library"
                subtitle="Practical resources for your next opportunity."
              >
                <ResourceLibrary />
              </Workspace>
            }
          />
          <Route
            path="/projects"
            element={
              <Workspace
                title="Student projects"
                subtitle="Build your portfolio. Discover what your peers are creating."
              >
                <Projects />
              </Workspace>
            }
          />
          <Route
            path="/teams"
            element={
              <Guard>
                <Workspace
                  title="The student community"
                  subtitle="Find teammates who share your curiosity."
                >
                  <TeamHub />
                </Workspace>
              </Guard>
            }
          />
          <Route path="/projects/:id" element={<ProjectDetails />} />
          <Route
            path="/mentoring"
            element={
              <Workspace
                title="Mentor sessions"
                subtitle="Guidance for the next step in your career."
              >
                <Mentoring />
              </Workspace>
            }
          />
          <Route
            path="/updates"
            element={
              <Workspace
                title="What’s new at Codovate"
                subtitle="Useful news, without the noise."
              >
                <Updates />
              </Workspace>
            }
          />
          <Route
            path="/notifications"
            element={
              <Guard>
                <Workspace
                  title="Notifications"
                  subtitle="Updates that matter to you."
                >
                  <Notifications />
                </Workspace>
              </Guard>
            }
          />
          <Route
            path="/resume"
            element={
              <Workspace
                title="Résumé templates"
                subtitle="Turn your education, skills and projects into a clear résumé."
              >
                <ResumeBuilder />
              </Workspace>
            }
          />
          <Route
            path="/placement"
            element={
              <Workspace
                title="Placement Preparation"
                subtitle="A clear path from learning to your next opportunity."
              >
                <Guard>
                  <Placement />
                </Guard>
              </Workspace>
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
        </OnboardingGate>
      </main>
      {!adminScreen && !onboardingScreen && <Footer />}
    </>
  );
}
