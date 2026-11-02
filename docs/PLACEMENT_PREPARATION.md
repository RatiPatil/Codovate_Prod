# Placement Preparation

Visit `/placement` or Administration → Placement preparation. The existing theme and logo are preserved. All 24 source-screen sections are available immediately; no external Drive material has been imported or republished. Empty sections say material is being prepared.

## Content workflow

An administrator with the existing trusted admin claim chooses a section, adds folders or readable articles, and saves as draft or published. Open folders to add nested content. Edit a record to revise its title, summary, lesson text, source URL or visibility. Parent, section, kind, creator and creation time are immutable. Use draft to withdraw an individual item; changing a folder to draft does not recursively unpublish its children. To withdraw a whole branch, withdraw the articles too. No destructive deletion is exposed.

Articles render as escaped text with preserved paragraph breaks; HTML/script execution and PDF embeds are not supported. A source URL is optional HTTPS attribution, not the primary reading experience. Upload original or licensed content for editorial conversion later. No new Storage bucket or billing requirement is introduced.

## Firestore contract

Collection `placementContent`, automatic document ID:
- sectionId: one of 24 stable IDs from frontend/src/placementSections.json
- parentId: empty for section root, otherwise existing same-section folder ID
- kind: folder or article
- title: required, up to 140 characters
- summary: up to 600 characters
- body: up to 40,000 characters; empty on folders; required for published articles
- sourceUrl: empty or HTTPS link up to 500 characters; empty on folders
- status: draft or published
- createdBy: authenticated admin UID
- createdAt, updatedAt: server timestamps

Rules enforce administrator-only writes, valid parents, immutable hierarchy and creator metadata, and published-only public reads. Draft queries require admin claims. Published content is public learning material: never include student contact details in lessons. Student profile privacy rules remain owner-only. Schema and a synthetic draft example are in database/.

Queries filter sectionId + status for students; composite index is in firestore.indexes.json. A bounded 501-document query detects sections over the current 500-item UI limit and reports it explicitly. This first stage is for establishing the library structure, before large-scale material ingestion. Aptitude now adds self-practice checkpoints and owner-only notes, bookmarks and progress; see APTITUDE_LIBRARY.md. Gems and redemption are not enabled.

## Deploy existing Firebase Hosting

After pulling main, build using the configured frontend/.env.local, then deploy rules, indexes and Hosting together. Do not run firebase:setup or deploy Storage for this module.

```powershell
git pull origin main
npm run build
npx --yes firebase-tools@15.34.2 deploy --only "firestore:rules,firestore:indexes,hosting" --project codovate-dev --account ratikantpatil413@gmail.com
```

Allow the composite index to finish building before testing published content. Rules changes intentionally change the exact rules hash checked by the student importer. Pull and deploy the matching revision before starting another import; finish an already-running import before deployment. No student records are seeded, deleted or altered by this module.
