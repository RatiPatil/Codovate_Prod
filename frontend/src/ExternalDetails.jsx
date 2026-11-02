import { Link } from "react-router-dom";
import { isOpen, typeLabel } from "./domain";
export function ExternalDetails({ item }) {
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
            <span>{item.location}</span>
            <span>{item.mode}</span>
            <span>{item.compensation}</span>
          </div>
          <h2>About the opportunity</h2>
          <p>{item.description}</p>
          <h2>Who can apply</h2>
          <p>{item.eligibility}</p>
          <h2>Skills</h2>
          <div className="skill-row">
            {item.skills.map((s) => (
              <span key={s}>{s}</span>
            ))}
          </div>
          <p className="hint">
            Source checked: {new Date(item.reviewedAt).toLocaleDateString()}.
            Availability can change; review the original listing.
          </p>
        </article>
        <aside className="panel apply-panel">
          <span className="eyebrow blue">YOUR NEXT STEP</span>
          <h2>Apply with {item.organization}</h2>
          <p>
            {item.deadline
              ? "Deadline: " +
                new Date(item.deadline).toLocaleString(undefined, {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                  timeZoneName: "short",
                })
              : "The employer has not stated a deadline. Check the official listing."}
          </p>
          {!isOpen(item) && (
            <p className="notice">
              This listing needs a fresh review or its deadline has passed.
              Check the original page for current availability.
            </p>
          )}
          <a
            className="button full"
            href={item.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            {isOpen(item)
              ? "Apply on official website"
              : "Check original listing"}
          </a>
          <p className="hint">
            Your application is handled by the employer or organizer. Codovate
            does not submit it or track its outcome.
          </p>
        </aside>
      </div>
    </div>
  );
}
