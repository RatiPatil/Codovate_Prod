# Codovate UI and schema refinement

## Interface

- Replace long marketing sections and overlapping text panels with a shorter search-led hero and three visual category tiles.
- Move opportunity discovery close to the top, add working homepage category tabs and show up to six current records.
- Use one card hierarchy: type, title, organization, location/duration, skills and compensation, with a clear details link.
- Simplify login, dashboard, profile, discovery headings and footer copy. Preserve the original logo/assets and existing Firebase auth, private résumé, application and admin workflows.
- Rebuild responsive styling around a restrained lavender, sage, sand and charcoal palette; remove the retired orbit artwork and duplicate marketing sections.
- Keep selected category navigation active when a search is added to the URL.

## Database

Add JSON Schema contracts and example documents for users, opportunities, applications and bookmarks; a read-only validator; schema tests; and CI schema checks. Strengthen skill and graduation-year rules. No cloud database has been connected, seeded or modified by this refinement.

## Validation

- Production build.
- 12 frontend tests, including homepage category switching and skill input validation.
- 8 schema tests and 4 validated example documents.
- 31 Firestore/Storage emulator security checks.
- Desktop browser inspection of homepage, category switching, search, details and sign-in layout using the managed preview.

Real-project Firebase checks remain pending the new configuration and deployed rules. Responsive layouts are implemented; this revision's browser inspection used the available desktop viewport.
