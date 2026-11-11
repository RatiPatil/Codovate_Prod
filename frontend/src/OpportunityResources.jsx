import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { CompanyLogo } from "./CareerPortals.jsx";
import { hackathonDirectory, directoryStatus } from "./hackathonCatalog.js";

export function OpportunityResources({ type = "all" }) {
  if (!["all", "hackathon"].includes(type)) return null;
  const rows = hackathonDirectory.filter(row => row.sourceUrl && ["open", "upcoming", "ongoing"].includes(directoryStatus(row))).slice(0, 6);
  return <section aria-label="Hackathon discovery previews">
    <p className="hint">Explore hackathon editions and organizer resources. Confirm registration status on the linked event page.</p>
    <div className="card-grid">
      {rows.map(row => <Link className="opportunity-card discovery-resource-card" key={row.id} to={"/explore?type=hackathon&search="+encodeURIComponent(row.title)} aria-label={`Explore ${row.title}`}>
        <span className="eyebrow">Hackathon reference</span>
        <div className="career-company-brand"><CompanyLogo company={{name:row.title,logo:row.logo,logoDark:row.logoDark}} /><h3>{row.title}</h3></div>
        <p className="organization">{row.schedule?.edition || row.summary}</p>
        <span className="text-link">View hackathon <ArrowUpRight size={15} /></span>
      </Link>)}
    </div>
    <Link className="button secondary" to="/explore?type=hackathon">Browse all hackathon resources <ArrowUpRight size={15} /></Link>
  </section>;
}
