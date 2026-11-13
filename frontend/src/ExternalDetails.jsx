import { SaveOpportunityButton } from "./OpportunitySave";
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
          {item.logo && (
            <img
              src={item.logo}
              alt={item.organization + " logo"}
              width="64"
              height="64"
              style={{
                objectFit: "contain",
                ...(item.logoDark
                  ? {
                      background: "#17151f",
                      padding: "8px",
                      borderRadius: "8px",
                      width: "144px",
                    }
                  : {}),
              }}
            />
          )}
          <h1>{item.title}</h1>
          <p className="organization">{item.organization}</p>
          <div className="detail-facts">
            <span>{item.location}</span>
            <span>{item.mode}</span>
            <span>{item.compensation}</span>
          </div>
          {item.competitionKind === "practice" && (
            <p className="pill">Ongoing learning competition · no cash prize</p>
          )}
          <h2>About the opportunity</h2>
          <p>{item.description}</p>
          {!!item.responsibilities?.length && (
            <>
              <h2>What you’ll do</h2>
              <ul>
                {item.responsibilities.map((value) => (
                  <li key={value}>{value}</li>
                ))}
              </ul>
            </>
          )}
          {item.duration !== "See official listing" && (
            <>
              <h2>Duration</h2>
              <p>{item.duration}</p>
            </>
          )}
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
          <SaveOpportunityButton item={item} />
          {item.deadlineNote && <p>{item.deadlineNote}</p>}
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
              : "No fixed entry deadline is stated here. Check the official listing and any country-specific dates."}
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
