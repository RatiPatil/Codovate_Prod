import { useEffect, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import records from "./curatedOpportunities.json";
export const REVIEW_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
export function curatedRows(filters = {}, now = Date.now(), source = records) {
  const {
    type = "all",
    search = "",
    mode = "all",
    category = "all",
    sort = "newest",
  } = filters;
  return source
    .filter((o) => {
      const checked = Date.parse(o.reviewedAt),
        deadline = o.deadline ? Date.parse(o.deadline) : Infinity;
      return (
        Number.isFinite(checked) &&
        checked <= now &&
        now < checked + REVIEW_WINDOW_MS &&
        now < deadline &&
        (type === "all" || type === o.type) &&
        (mode === "all" || mode === o.mode) &&
        (category === "all" || category === o.category) &&
        [o.title, o.organization, o.location, ...o.skills]
          .join(" ")
          .toLowerCase()
          .includes(search.trim().toLowerCase())
      );
    })
    .sort((a, b) =>
      sort === "deadline"
        ? (Date.parse(a.deadline) || Infinity) -
          (Date.parse(b.deadline) || Infinity)
        : Date.parse(b.reviewedAt) - Date.parse(a.reviewedAt),
    );
}
export function CuratedOpportunities({ filters = {}, compact = false }) {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);
  const rows = curatedRows(filters, now);
  const shown = compact ? rows.slice(0, 3) : rows;
  return (
    <section
      className="section"
      aria-label="Real opportunities from official sources"
    >
      <div className="section-heading">
        <div>
          <span className="eyebrow">FROM OFFICIAL SOURCES</span>
          <h2>Real opportunities</h2>
        </div>
      </div>
      <p>
        Apply on the employer or organizer website. Availability can change;
        check the original requirements. These are curated links, not Codovate
        application submissions.
      </p>
      <div className="resource-grid">
        {shown.map((o) => (
          <article key={o.id} className="panel resource-card">
            <span className="eyebrow">
              {o.type} · {o.organization}
            </span>
            <h2>{o.title}</h2>
            <p>{o.summary}</p>
            <p>
              {o.location} · {o.mode}
            </p>
            <p>{o.eligibility}</p>
            <div className="skill-row">
              {o.skills.map((s) => (
                <span key={s}>{s}</span>
              ))}
            </div>
            <p className="hint">
              {o.compensation}
              <br />
              {o.deadline
                ? "Deadline: " +
                  new Date(o.deadline).toLocaleString(undefined, {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                    timeZoneName: "short",
                  })
                : "Deadline not stated — check the official page"}
              <br />
              Source checked:{" "}
              {new Date(o.reviewedAt).toLocaleDateString(undefined, {
                timeZone: "UTC",
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </p>
            <a
              className="button secondary"
              href={o.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              View official listing <ArrowUpRight size={16} />
            </a>
          </article>
        ))}
      </div>
      {!rows.length && (
        <p className="notice">
          No recently checked external listings match these filters. Browse the
          official career portals below or check Codovate listings.
        </p>
      )}
      <p className="hint">
        Listings are hidden after seven days without review, or at their stated
        deadline. Stipend sorting applies to Codovate listings below; external
        pay figures are not estimated.
      </p>
      <div className="career-controls">
        <a
          className="text-link"
          href="https://www.amazon.jobs/"
          target="_blank"
          rel="noopener noreferrer"
        >
          Amazon careers
        </a>
        <a
          className="text-link"
          href="https://stripe.com/careers/search"
          target="_blank"
          rel="noopener noreferrer"
        >
          Stripe careers
        </a>
        <a
          className="text-link"
          href="https://devpost.com/hackathons"
          target="_blank"
          rel="noopener noreferrer"
        >
          Devpost hackathons
        </a>
      </div>
    </section>
  );
}
