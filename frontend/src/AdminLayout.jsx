import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  LayoutDashboard,
  BriefcaseBusiness,
  Plus,
  FileText,
  GraduationCap,
  BookOpen,
  Users,
  Code2,
  Building2,
  CalendarDays,
  Bell,
  Megaphone,
  ShieldCheck,
  ArrowUpRight,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useSession } from "./session";
import "./admin.css";
export const adminModules = [
  {
    id: "study-fields",
    label: "Fields of study",
    group: "Content & learning",
    icon: GraduationCap,
    description: "Approve and remove fields used in teammate discovery.",
  },
  {
    id: "overview",
    label: "Overview",
    group: "Management",
    icon: LayoutDashboard,
    description: "Your administration workspace and quick actions.",
  },
  {
    id: "listings",
    label: "Opportunities",
    group: "Management",
    icon: BriefcaseBusiness,
    description: "Review, edit and close platform opportunities.",
  },
  {
    id: "publish",
    label: "Publish opportunity",
    group: "Management",
    icon: Plus,
    description: "Create a new internship, job, competition or hackathon.",
  },
  {
    id: "applications",
    label: "Applications",
    group: "Management",
    icon: FileText,
    description: "Review applications and communicate outcomes.",
  },
  {
    id: "placement",
    label: "Placement preparation",
    group: "Content & learning",
    icon: BookOpen,
    description:
      "Organize sections, review source material and publish lessons.",
  },
  {
    id: "resources",
    label: "Learning resources",
    group: "Content & learning",
    icon: GraduationCap,
    description: "Curate useful learning links for students.",
  },
  {
    id: "users",
    label: "User accounts",
    group: "System & access",
    icon: Users,
    description:
      "Manage login accounts and administrator access using trusted Firebase tools.",
  },
  {
    id: "system",
    label: "System settings",
    group: "System & access",
    icon: ShieldCheck,
    description:
      "Check the Firebase project configuration and live database connectivity.",
  },
  {
    id: "students",
    label: "Student privacy",
    group: "System & access",
    icon: Users,
    description: "Review profile privacy and student contact guidance.",
  },
  {
    id: "projects",
    label: "Projects",
    group: "Community",
    icon: Code2,
    description: "Moderate projects shared with the community.",
  },
  {
    id: "teams",
    label: "Teams",
    group: "Community",
    icon: Building2,
    description: "Moderate team discovery posts.",
  },
  {
    id: "mentoring",
    label: "Mentor sessions",
    group: "Mentoring",
    icon: GraduationCap,
    description: "Publish and manage guidance sessions.",
  },
  {
    id: "bookings",
    label: "Mentor bookings",
    group: "Mentoring",
    icon: CalendarDays,
    description: "Review booking requests and share confirmed session details.",
  },
  {
    id: "notifications",
    label: "Notifications",
    group: "Communications",
    icon: Bell,
    description: "Send private in-app notifications and review sent messages.",
  },
  {
    id: "updates",
    label: "Platform updates",
    group: "Communications",
    icon: Megaphone,
    description: "Publish news and updates for the community.",
  },
];
export const adminModule = (id) =>
  adminModules.find((m) => m.id === id) || adminModules.find((m) => m.id === "overview");
export function AdminLayout({ children }) {
  const { user, admin, logout } = useSession();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const selected = adminModule(params.get("tab"));
  const [open, setOpen] = useState(false),
    [error, setError] = useState("");
  if (!admin) return <p role="alert">Administrator access required.</p>;
  async function signOut() {
    setError("");
    try {
      await logout();
      navigate("/login", { replace: true });
    } catch {
      setError("Could not sign out. Please try again.");
    }
  }
  return (
    <div className="admin-console">
      <header className="admin-topbar">
        <Link
          to="/admin"
          className="admin-brand"
          aria-label="Codovate administration home"
        >
          <img src="/logo-light.png" alt="Codovate" />
          <span>Master admin</span>
        </Link>
        <button
          className="admin-menu-toggle"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          aria-controls="admin-sidebar"
          aria-label={open ? "Close admin navigation" : "Open admin navigation"}
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
        <div className="admin-topbar-actions">
          <Link to="/" className="button secondary small">
            View platform <ArrowUpRight size={16} />
          </Link>
          <button className="admin-signout" onClick={signOut}>
            <LogOut size={17} />
            <span>Sign out</span>
          </button>
        </div>
      </header>
      <div className="admin-console-grid">
        <aside
          id="admin-sidebar"
          className={"admin-sidebar " + (open ? "is-open" : "")}
        >
          <div className="admin-sidebar-title">
            <ShieldCheck size={18} />
            <span>ADMINISTRATION</span>
          </div>
          <nav aria-label="Administrator modules">
            {[...new Set(adminModules.map((m) => m.group))].map((group) => (
              <section className="admin-nav-group" key={group}>
                <h2>{group}</h2>
                {adminModules
                  .filter((m) => m.group === group)
                  .map((m) => (
                    <Link
                      key={m.id}
                      to={"/admin?tab=" + m.id}
                      aria-current={selected.id === m.id ? "page" : undefined}
                      onClick={() => setOpen(false)}
                    >
                      <m.icon size={17} />
                      <span>{m.label}</span>
                    </Link>
                  ))}
              </section>
            ))}
          </nav>
          <div className="admin-account">
            <ShieldCheck size={17} />
            <div>
              <strong>Verified administrator</strong>
              <span>{user?.email || "Signed in securely"}</span>
              <Link to="/profile">My account</Link>
            </div>
          </div>
        </aside>
        <div className="admin-content">
          <div className="admin-page-heading">
            <div>
              <p className="admin-breadcrumb">
                Administration / {selected.group}
              </p>
              <h1>
                {selected.id === "overview"
                  ? "Platform administration"
                  : selected.label}
              </h1>
              <p>{selected.description}</p>
            </div>
            <span className="admin-access-badge">
              <ShieldCheck size={16} /> Administrator
            </span>
          </div>
          {error && (
            <p role="alert" className="notice">
              {error}
            </p>
          )}
          {children}
          <footer className="admin-console-footer">
            Codovate administration · Student contact details and learning notes
            remain private.
          </footer>
        </div>
      </div>
    </div>
  );
}
