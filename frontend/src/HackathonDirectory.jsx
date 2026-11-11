import { ExternalLink } from "lucide-react";
import { hackathonDirectory, filterHackathonDirectory, directoryStatus, eventStatus } from "./hackathonCatalog.js";
import { money, dateLabel } from "./domain";
import "./placement.css";
const statusLabels = { open: "Registration open — check organizer", upcoming: "Coming soon — check registration", ongoing: "Event in progress — check registration", closed: "Registration / edition closed", unverified: "Dates / registration unconfirmed" };
const eventLabels = { upcoming: "Upcoming event", ongoing: "Event in progress", ended: "Past edition", paused: "On hiatus", unverified: "Event dates unconfirmed" };
const displayDate = value => new Date(value + "T12:00:00Z").toLocaleDateString("en-IN", {day:"numeric",month:"short",year:"numeric",timeZone:"UTC"});
export function HackathonDirectory({ filters = {} }) {
  const rows = filterHackathonDirectory(hackathonDirectory, filters);
  const groups = [...new Set(hackathonDirectory.map(row => row.group))].filter(group => rows.some(row => row.group === group));
  return <section aria-label="Hackathon discovery directory" className="hackathon-directory">
    <div className="panel">
      <span className="eyebrow">BUILD · CONNECT · SHOW YOUR WORK</span>
      <h2>Hackathons to explore</h2>
      <p>Build a working project, meet collaborators and mentors, and strengthen your portfolio. Beginners can contribute through coding, design, research and presenting.</p>
      <p className="hint">This reference directory includes recurring events, programs and platforms. Edition dates are shown with sources where confirmed. Future event dates do not guarantee open registration. Typical modes and suggested interests help you explore; check the selected edition with its organizer.</p>
      <details><summary>Getting started</summary><p>Choose a challenge that interests you, read eligibility and team-size rules, and build a small team with complementary skills. Prepare a demo and a clear explanation of what you built. Travel, meals, recruitment outcomes and prizes vary by event.</p></details>
    </div>
    <p role="status">{rows.length} reference resources match your filters</p>
    {filters.sort === "stipend" && <p className="hint">Only confirmed INR cash prizes are ranked. Unannounced prizes are not counted as zero or mixed with other currencies.</p>}
    {filters.sort === "newest" && <p className="hint">Undated references appear alphabetically; they are not labeled as newly announced events.</p>}
    {!rows.length && <div className="panel"><h3>No matching hackathon resources</h3><p>Try another mode, interest, section or status. No dates or prize amounts are assumed for unannounced editions.</p></div>}
    {groups.map(group => <section key={group} aria-label={group}>
      <div className="career-portals-group"><h3>{group}</h3><span className="pill">{rows.filter(row => row.group === group).length} resources</span></div>
      <div className="placement-grid">
        {rows.filter(row => row.group === group).map(row => <article className="panel career-portal-card" key={row.id}>
          <span className="pill">{row.kind === "event-series" ? "Recurring event" : row.kind === "platform" ? "Discovery platform" : "Program / resource"}</span>
          <h4>{row.title}</h4><p>{row.summary}</p>
          <span className="pill">{statusLabels[directoryStatus(row)]}</span>
          {row.schedule && <div className="hackathon-schedule">
            {row.schedule.edition && <strong>{row.schedule.edition}</strong>}
            <p>{eventLabels[eventStatus(row)]}{row.schedule.eventStartDate && <> · {displayDate(row.schedule.eventStartDate)}{row.schedule.eventEndDate && row.schedule.eventEndDate !== row.schedule.eventStartDate ? ` – ${displayDate(row.schedule.eventEndDate)}` : ""}</>}</p>
            {row.schedule.dateText && <p>{row.schedule.dateText}</p>}
            {row.schedule.registrationOpensDate && <p>Participant registration opens: {displayDate(row.schedule.registrationOpensDate)}</p>}
            <p className="hint">{row.schedule.note}</p>
            {row.schedule.sourceUrl && <a href={row.schedule.sourceUrl} target="_blank" rel="noopener noreferrer">Date source ↗</a>}
            <p className="hint">Checked {displayDate(row.schedule.checkedOn)} · Dates shown as announced locally; exact cutoff times may vary.</p>
          </div>}
          <p className="hint">Typical format: {row.location}<br />Registration closes: {row.schedule?.registrationDeadlineDate ? displayDate(row.schedule.registrationDeadlineDate) : row.deadline ? dateLabel(row.deadline) : "Not announced"}<br />Cash prize: {row.prizeINR === null ? "Not announced" : money(row.prizeINR)}</p>
          <ul className="career-portal-roles" aria-label={`${row.title} interests`}>{row.interests.map(interest => <li className="pill" key={interest}>{interest}</li>)}</ul>
          <p className="hint">{row.note}</p>
          {row.sourceUrl ? <a className="button secondary" href={row.sourceUrl} target="_blank" rel="noopener noreferrer" aria-label={`Visit ${row.title} resource (opens in a new tab)`}>Visit resource <ExternalLink size={15} aria-hidden="true" /></a> : <p className="hint">Official link not confirmed</p>}
        </article>)}
      </div>
    </section>)}
  </section>;
}
