# Résumé templates and real opportunity links

The existing theme, colours, typography, layout and logo are retained. No shared stylesheet was changed.

## Résumé templates

`/resume` offers Student essentials, Technical projects and Experience first. The signed-in profile fills initial fields; signed-out students can also use the builder. Names, contact information, education, skills, projects, experience and achievements are editable. Text is escaped before creating an editable standalone HTML file. Open the downloaded HTML in a browser and use Print → Save as PDF. Review page breaks and content before submitting. Empty sections are omitted; no external fonts/assets or scripts are fetched by the export. There is no ATS-score or hiring guarantee.

Draft edits stay in component memory; leaving/reloading the page loses them. They are not silently uploaded or stored in a second database. Downloads contain only the details entered by the student. Existing Firebase profile and résumé-link/PDF workflows remain available; upload/share the completed PDF or add its HTTPS link through My profile.

## Curated real listings

`frontend/src/curatedOpportunities.json` contains seven short summaries checked against official employer/organizer pages on 2 November 2026:

| Record | Official page |
| --- | --- |
| Amazon Systems Development Engineer Intern – 2027, 10498158 | https://www.amazon.jobs/en/jobs/10498158/systems-development-engineer-intern-2027 |
| Amazon Data Engineer Intern – 2027, 10496769 | https://amazon.jobs/en/jobs/10496769/data-engineer-intern-2027 |
| Stripe Software Engineer, Intern, 8031833 | https://stripe.com/careers/listing/software-engineer-intern/8031833?gh_jid=8031833 |
| Amazon Software Development Engineer I, 10580008 | https://www.amazon.jobs/en/jobs/10580008/software-development-engineer-i |
| Amazon Software Development Engineer I, Payments, 10580014 | https://www.amazon.jobs/en/jobs/10580014/software-development-engineer-i |
| PayPal AI Hackathon | https://paypalaihackathon.devpost.com/ |
| LaunchPad Hacks | https://launchpad-hacks.devpost.com/ |

The job records explicitly require 1+ years of professional experience; do not advertise them as zero-experience fresher vacancies. The job/internship sources did not state deadlines or compensation, so the cards do not invent either. Hackathon eligibility and regional restrictions are summarized with links to complete rules. Deadlines are stored in UTC and shown in the visitor's local timezone. PayPal: 12 November, noon PST = 20:00 UTC. LaunchPad: 20 November, 5pm EST = 22:00 UTC.

Homepage previews and Explore show these curated links separately from Codovate-managed applications. Type, keyword, mode and category filters apply. Closing-soon sorts known deadlines first. Stipend/prize ordering applies only to managed listings; no compensation is estimated for external listings. Applying opens the original source in a new tab with noopener/noreferrer. It does not create a Codovate application or imply employer partnership, acceptance or application tracking.

This is a reviewed snapshot, not an automatically scraped feed. Entries disappear at their known deadline or seven days after review, whichever comes first. A minute timer updates visibility in open tabs. Persistent official portal links remain available when the snapshot expires. Review each original page and update/remove entries before refreshing `reviewedAt`; never bump dates without checking. The employer/organizer may close earlier. The seven-day review window is an internal freshness policy, not an application deadline.

`database/curated-opportunities.schema.json` is an executable array contract for the bundled public dataset; it is not a Firestore collection or another database. Schema tests reject unsafe links, wrong field types, extra fields, duplicate IDs and unsupported source hosts. Add legitimate source domains deliberately in validation when extending the dataset. The thirteen Firestore collection contracts and access policies remain unchanged. No production documents were seeded or deleted.

## Release

Run `npm test`, `npm --prefix scripts run test:schema` and `npm run build`. Build with the intended ignored Firebase configuration before hosting deployment. This release does not change DNS, VPS, paid services or live hosting. Existing pending Firestore changes from prior releases must still be deployed before that updated application is used; this feature adds no new Firestore rules/indexes.
