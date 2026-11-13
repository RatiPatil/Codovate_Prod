# Final-year project library

The 90 entries from `Final Year Projects.docx` are stored separately from student portfolios:

- `projectLibrary/{id}`: curated practice references and original ideas; admin writes only. Public reference metadata contains no student information. `hidden` is a display state, not private content.
- `projects/{id}`: existing student-owned portfolio projects, with their original privacy and moderation rules.

The supplied document contains 69 repository links, 4 collections, 1 article and 16 ideas without source URLs. Topic pages and reference articles are labelled accurately. Promotional paragraphs are not projects and were excluded. The Spring Boot heading did not include individual project entries or URLs, so no projects were invented for it. `sourceTitle` retains the original label when the display title was clarified. Suggested starting points and brief scopes are editorial guidance, not claims about repository contents. Repository availability and licences should be checked at the source before reuse.

The to-do source `snyk-labs/nodejs-goof` is intentionally vulnerable and is labelled for isolated security training. The original criminal-face wording is clarified as face-recognition practice, without attributing criminality to appearance.

## Database contract

`database/project-library.schema.json` validates the bundled array; `$defs.projectLibrary` in `database/firestore.schema.json` validates each Firestore document. IDs are stable hashes of source section and original title. Rules enforce field bounds, approved sections, source types, HTTPS source hosts, immutable creation timestamps and admin-only mutations. Hiding overrides bundled records by ID. Deleted seed documents fall back to the bundled reference; use `status: hidden` to remove a seed reference from the student UI.

## Deploy and import

```powershell
git pull origin main
npm run deploy
npm run projects:import
npm run projects:import -- --apply
```

The import requires trusted Firebase Admin application-default credentials. All 90 records are validated before any writes. A single batch creates missing records only; existing admin edits and hidden entries are preserved. Reruns skip existing records. The bundled library provides initial references before import, while Firestore stores publishing decisions and metadata after import. No user documents, student projects or memberships are modified.
