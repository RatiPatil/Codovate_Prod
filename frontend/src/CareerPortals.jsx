import { ExternalLink } from "lucide-react";
import { useState } from "react";
import groups from "./careerPortals.json";

export function CareerPortals() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const term = search.trim().toLowerCase();
  const visible = groups.filter(group => !category || group.title === category)
    .map(group => ({ ...group, companies: group.companies.filter(company =>
      [company.name, company.description, group.title, ...company.roles].join(" ").toLowerCase().includes(term),
    ) })).filter(group => group.companies.length);
  const count = visible.reduce((total, group) => total + group.companies.length, 0);
  return <div className="career-portals">
    <div className="panel career-portals-intro">
      <span className="eyebrow">APPLY AT THE SOURCE</span>
      <h2>Find your next opportunity directly.</h2>
      <p>Explore company career pages by industry and role. Bookmark this directory and set up job alerts on the portals you follow.</p>
      <p className="hint">Role tags describe areas to explore, not confirmed vacancies. Eligibility, locations and openings are set by each employer.</p>
    </div>
    <div className="form-grid career-portals-controls">
      <label>Search companies or roles
        <input type="search" placeholder="Company, Python, Data, Design…" value={search} onChange={event => setSearch(event.target.value)} />
      </label>
      <label>Industry
        <select value={category} onChange={event => setCategory(event.target.value)}>
          <option value="">All industries</option>
          {groups.map(group => <option key={group.title}>{group.title}</option>)}
        </select>
      </label>
    </div>
    <p role="status">{count} {count === 1 ? "listing" : "listings"} across {visible.length} {visible.length === 1 ? "industry" : "industries"}</p>
    {!count && <div className="panel"><h3>No matching companies</h3><p>Try a different company, role or industry.</p><button className="button secondary" onClick={() => { setSearch(""); setCategory(""); }}>Clear filters</button></div>}
    {visible.map(group => <section key={group.title} aria-label={group.title}>
      <div className="career-portals-group"><h3>{group.title}</h3><span className="pill">{group.companies.length} listings</span></div>
      <div className="placement-grid">
        {group.companies.map(company => <article className="panel career-portal-card" key={company.name}>
          <h4>{company.name}</h4>
          <p className="career-company-intro">{company.description}</p>
          <ul className="career-portal-roles" aria-label={`${company.name} role areas`}>
            {company.roles.map(role => <li className="pill" key={role}>{role}</li>)}
          </ul>
          {company.note && <p className="hint">{company.note}</p>}
          {company.url ? <a className="button secondary" href={company.url} target="_blank" rel="noopener noreferrer" aria-label={`Visit ${company.name} ${["HAL", "BSNL", "Tata Robotics", "MPL"].includes(company.name) ? "official site" : "careers"} (opens in a new tab)`}>{["HAL", "BSNL", "Tata Robotics", "MPL"].includes(company.name) ? "Official site" : "View careers"} <ExternalLink size={15} aria-hidden="true" /></a> : <p className="hint">Career link pending verification</p>}
        </article>)}
      </div>
    </section>)}
    <aside className="panel"><h3>Make your search a habit</h3><p>Review your saved company portals every two to three weeks. Use location and experience filters, tailor your résumé to each role, and enable job alerts where available.</p><p className="hint">Links and recruitment arrangements can change. Confirm the employer and application destination before sharing personal information. This directory does not guarantee openings or response times.</p></aside>
  </div>;
}
