import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import companies from "./careerPortals.json";
import { CompanyLogo } from "./CareerPortals.jsx";
import { hackathonDirectory, directoryStatus } from "./hackathonCatalog.js";

export function OpportunityResources({ type = "all", search = "" }) {
  const term = search.trim().toLowerCase();
  let cards = [];
  if (["internship", "job"].includes(type)) {
    const seen = new Set();
    cards = companies.flatMap(group => group.companies).filter(company => {
      if (!company.url || seen.has(company.name)) return false;
      seen.add(company.name);
      return [company.name, company.description, ...company.roles].join(" ").toLowerCase().includes(term);
    }).slice(0, 6).map(company => ({ title:company.name, summary:company.description, label:"Company career portal", href:company.url, company }));
  } else if (type === "hackathon") {
    cards = [...hackathonDirectory].filter(row => row.sourceUrl && ["open", "upcoming", "ongoing"].includes(directoryStatus(row)))
      .slice(0, 6).map(row => ({title:row.title,summary:row.schedule?.edition || row.summary,label:"Hackathon reference",to:"/explore?type=hackathon&search="+encodeURIComponent(row.title)}));
  } else if (type === "competition") {
    cards = hackathonDirectory.filter(row => ["Kaggle Competitions","HackerRank College Competitions","Topcoder Hackathons","Unstop (Dare2Compete)"].includes(row.title))
      .map(row => ({title:row.title.replace(" Hackathons", " Challenges"),summary:row.summary,label:"Challenge platform",href:row.sourceUrl}));
  } else {
    cards = [
      {title:"Top Companies – Careers",summary:"Explore 223 company listings, learn what each business does and visit its career portal.",label:"Company directory",to:"/placement?section=career-portals"},
      {title:"Hackathons and event dates",summary:"Browse hackathons by mode, interest, edition dates and registration status.",label:"Hackathon directory",to:"/explore?type=hackathon"},
      {title:"Competitions and challenges",summary:"Discover platforms for coding, data science and campus challenges.",label:"Challenge discovery",to:"/explore?type=competition"},
      {title:"Prepare for your next opportunity",summary:"Build skills with the placement preparation library, learning resources and interview topics.",label:"Preparation library",to:"/placement"},
    ];
  }
  return <section aria-label="Opportunity discovery resources">
    <p className="hint">{["internship","job"].includes(type) ? "Explore employer career pages while new verified listings are added. Open roles, eligibility and work modes are confirmed by each company." : "Explore these directories and platforms. Resources are separate from verified open opportunity listings."}</p>
    <div className="card-grid">
      {cards.map(card => {
        const ResourceLink = card.href ? "a" : Link;
        const destination = card.href ? {href:card.href,target:"_blank",rel:"noopener noreferrer"} : {to:card.to};
        return <ResourceLink className="opportunity-card discovery-resource-card" key={card.title} {...destination} aria-label={`${card.href ? "Visit" : "Explore"} ${card.title}`}>
          <span className="eyebrow">{card.label}</span>
          <div className="career-company-brand">{card.company && <CompanyLogo company={card.company} />}<h3>{card.title}</h3></div>
          <p className="organization">{card.summary}</p>
          <span className="text-link">{card.href ? "Visit official website" : "Explore"} <ArrowUpRight size={15} /></span>
        </ResourceLink>;
      })}
    </div>
    {["internship","job"].includes(type) && <Link className="button secondary" to="/placement?section=career-portals">Browse all company career portals <ArrowUpRight size={15} /></Link>}
    {type === "hackathon" && <Link className="button secondary" to="/explore?type=hackathon">Browse all hackathon resources <ArrowUpRight size={15} /></Link>}
  </section>;
}
