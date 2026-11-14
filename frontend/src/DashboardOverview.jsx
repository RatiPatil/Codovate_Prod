import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  ArrowRight,
  Check,
  ChevronRight,
  FileText,
  Bookmark,
  Compass,
  GraduationCap,
  Code2,
  Building2,
} from "lucide-react";
import { completion, isOpen } from "./domain";
export function DashboardOverview({
  profile,
  applications,
  saved,
  catalog,
  renderOpportunity,
}) {
  const progress = completion(profile);
  const steps = [
    [
      "Education & skills",
      !!profile?.college && !!profile?.skills?.length,
      "/profile",
      "Introduce your strengths and academic background.",
    ],
    [
      "Your résumé",
      !!(profile?.resumePath || profile?.resumeUrl),
      "/profile",
      "Keep a current résumé ready for applications.",
    ],
    [
      "First application",
      !applications.loading &&
        !applications.error &&
        applications.items.length > 0,
      applications.items.length ? "/applications" : "/explore",
      "Find an opportunity and take the next step.",
    ],
  ];
  const recommendations = (catalog.items || [])
    .filter(isOpen)
    .map((o) => ({
      ...o,
      score: o.skills.filter((skill) =>
        profile?.skills?.some((s) => s.toLowerCase() === skill.toLowerCase()),
      ).length,
    }))
    .filter((o) => o.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);
  const count = (data) =>
    data.loading
      ? "…"
      : data.error
        ? "—"
        : data.items.length.toLocaleString("en-IN");
  const links = [
    [
      "Placement preparation",
      "Build confidence with structured preparation.",
      "/placement",
      GraduationCap,
    ],
    [
      "Project library",
      "Find an idea for your next practical project.",
      "/projects?view=library",
      Code2,
    ],
    [
      "Find a team",
      "Meet students with shared interests.",
      "/teams",
      Building2,
    ],
    [
      "Mentor sessions",
      "Explore guidance for your next challenge.",
      "/mentoring",
      Compass,
    ],
  ];
  return (
    <div className="overview-content">
      <section className="dashboard-callout overview-profile">
        <div>
          <span className="eyebrow">YOUR NEXT CHAPTER</span>
          <h2>
            {progress === 100
              ? "Your profile is ready. What’s next?"
              : "Make your next opportunity count."}
          </h2>
          <p>
            {progress === 100
              ? "Explore opportunities, sharpen your skills, or find people to build with."
              : "Complete your profile so your skills, interests and goals tell your story."}
          </p>
          <Link className="button" to="/profile">
            {progress === 100 ? "View your profile" : "Complete your profile"}
            <ArrowRight size={16} />
          </Link>
        </div>
        <div
          className="progress-circle"
          role="progressbar"
          aria-label="Profile completeness"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress}
          style={{ "--progress": `${progress}%` }}
        >
          <strong>{progress}%</strong>
          <span>profile complete</span>
        </div>
      </section>
      <section className="stats-grid overview-stats" aria-label="Your activity">
        {[
          [
            "Applications",
            count(applications),
            "/applications",
            FileText,
            "Track your application progress",
          ],
          [
            "Saved opportunities",
            count(saved),
            "/saved",
            Bookmark,
            "Pick up where you left off",
          ],
          [
            "Opportunities to explore",
            catalog.loading && !catalog.items.length
              ? "…"
              : catalog.error && !catalog.items.length
                ? "—"
                : catalog.items.filter(isOpen).length.toLocaleString("en-IN"),
            "/explore",
            Compass,
            "Available in the loaded catalog",
          ],
        ].map(([label, value, to, Icon, note]) => (
          <Link to={to} className="stat panel" key={label}>
            <div className="overview-stat-label">
              <Icon size={17} />
              <span>{label}</span>
            </div>
            <strong>{value}</strong>
            <small>{note}</small>
            <ArrowUpRight size={17} />
          </Link>
        ))}
      </section>
      <div className="overview-columns">
        <section className="panel checklist overview-checklist">
          <span className="eyebrow">KEEP MOVING FORWARD</span>
          <h2>Your next steps</h2>
          {steps.map(([title, done, to, description]) => (
            <Link key={title} to={to}>
              <span className={done ? "check done" : "check"}>
                {done ? <Check size={15} /> : <ChevronRight size={15} />}
              </span>
              <span className="overview-step-copy">
                <strong>
                  {title}
                  {done && <small>Complete</small>}
                </strong>
                <span>{description}</span>
              </span>
              <ArrowUpRight size={16} />
            </Link>
          ))}
        </section>
        <section className="panel overview-launchpad">
          <span className="eyebrow">BUILD YOUR NEXT STEP</span>
          <h2>Your workspace, at a glance</h2>
          <div>
            {links.map(([title, description, to, Icon]) => (
              <Link to={to} key={title}>
                <span className="overview-action-icon">
                  <Icon size={19} />
                </span>
                <span>
                  <strong>{title}</strong>
                  <small>{description}</small>
                </span>
                <ArrowUpRight size={16} />
              </Link>
            ))}
          </div>
        </section>
      </div>
      {recommendations.length > 0 && (
        <section className="overview-recommendations">
          <div className="section-heading">
            <div>
              <span className="eyebrow">MATCHING YOUR SKILLS</span>
              <h2>Opportunities worth a look</h2>
            </div>
            <Link className="text-link" to="/explore">
              Explore all
              <ArrowRight size={16} />
            </Link>
          </div>
          <div className="resource-grid">
            {recommendations.map(renderOpportunity)}
          </div>
          <p className="hint">
            Based on shared skills in the loaded catalog. Review each listing
            for eligibility and availability.
          </p>
        </section>
      )}
    </div>
  );
}
