# Aptitude learning library

## What is delivered

Aptitude now contains six topic folders, 33 short teaching lessons and 35 self-practice checkpoint questions with explanations. The existing theme, logo and Placement Preparation navigation are preserved. Lessons use readable headings, worked examples and pitfalls. One supplied Data Interpretation chart is rebuilt as an accessible table with three independently checked answers.

Students can save completion, bookmarks, private notes and practice results to Firestore. Recent saved records provide a Continue link and bookmarked-lesson links. These are self-reported learning records, not verified assessment credentials. They award no gems, points, money or redemption rights. Progress and notes are owner-only, including against administrator browser clients.

Administrators can edit source notes, reading time, level and up to six four-option checkpoint questions per article, along with draft/published visibility. Answers and explanations are public study material once published. No high-stakes test scoring is claimed.

## Uploaded source coverage

All 25 supplied files are inventoried in database/aptitude/source-inventory.json with file hashes, source page counts, extraction method and review state. There are 2,247 source pages/sections: 24 PDFs and one DOCX. Three scanned PDFs (571 pages) were OCR-processed. Text-only extraction does not preserve every formula, chart, illustration or multi-column ordering. Twenty-five pages have no extracted text; those pages may be covers, blanks or illustration-only pages and are explicitly marked in the review pack rather than discarded.

The separate Codovate_Aptitude_Source_Review.json contains 25 draft source folders and 128 draft reference articles, covering all source text/OCR output with numbered source-page boundaries. Long pages are split without dropping characters. All 153 records are drafts. This review pack is supplied separately, not published in the public repository or bundled into the student website. Do not change every draft to published at once. Compare each topic to the original, reconstruct required visuals, verify equations/answers, remove irrelevant front matter, then publish an edited lesson. Original page images and PDFs are not embedded in student lessons.

The 33 starter lessons are original teaching adaptations with checked examples. They are not a claim that 2,247 pages of books have been fully rewritten or verified. The source material contains apparent errors (for example the printed unit-digit cycle for powers of 2 in Basics of Quantitative Ability); the starter explains the relevant concepts without copying those errors. The publishing-cost case includes only three independently checked questions; other source questions remain in review.

## Database

`placementContent` gains optional sourceNote (600 chars), minutes (1–60), level (Foundation/Intermediate/Reference), and practice (0–6 validated questions). Each question has prompt, exactly four options, answerIndex (0–3) and explanation. Existing folder/lesson contracts remain compatible. Parent, kind, section and provenance remain immutable.

`placementProgress/{studentId}_{lessonId}`: studentId, lessonId, completed, bookmarked, note (up to 1,000 chars), practiceScore, practiceTotal, updatedAt. Score and total are integers between 0 and 6 with score <= total. Owner-only reads/writes; no admin access; arbitrary reward fields rejected. Notes are plain escaped text. Failed progress reads disable writes so unseen notes are not overwritten. Failed writes keep current work on screen for retry. Queries for recent learning are bounded to 100 records; content queries retain the explicit 500-item section limit. Starter plus source pack total 192 records, within that limit.

## Import and live release (Windows terminal)

Finish any running student import before pulling/deploying. Use the same authenticated account and ADC already configured for student imports. Existing content is never overwritten; reruns skip it. A conflicting existing hierarchy stops preflight before writes. All records are schema-validated, unknown fields rejected, same-section folder parents checked, and cycles rejected before any writes. The deployed rules must exactly match checked-out firestore.rules. Neither importer touches Authentication or student profiles.

Save the separately provided review pack to D:\Private\Codovate_Aptitude_Source_Review.json. Then:

```powershell
cd "D:\Downloads\Codovate-Fresh"
git pull origin main
npm --prefix scripts ci
npx --yes firebase-tools@15.34.2 deploy --only "firestore:rules,firestore:indexes" --project codovate-dev --account ratikantpatil413@gmail.com
node scripts/import-placement.mjs --dry-run
node scripts/import-placement.mjs --apply --project=codovate-dev
node scripts/import-placement.mjs --file="D:\Private\Codovate_Aptitude_Source_Review.json" --dry-run
node scripts/import-placement.mjs --file="D:\Private\Codovate_Aptitude_Source_Review.json" --apply --project=codovate-dev
npm run build
npx --yes firebase-tools@15.34.2 deploy --only hosting --project codovate-dev --account ratikantpatil413@gmail.com
```

Starter dry-run: 39 records = 6 folders + 33 published articles. Review-pack dry-run: 153 draft records = 25 folders + 128 reference articles. If the starter folders do not exist, the review import refuses to create orphan records. Progress prints every 10 records; final created/existing/failed counts are explicit. Retry failed imports with the same file; do not run concurrent copies. Read-only default does not connect to Firebase. Apply is restricted to codovate-dev and refuses emulator variables.

Open /placement?section=aptitude after release. Sign in as a student to check private notes/bookmarks; sign in with a trusted admin claim to review sources under Administration → Placement preparation → Aptitude. Firebase console login alone does not grant in-app admin claims. No Storage, VPS, additional database or billing-enabled service is needed for these learning features.

## Verification limits

Local emulator tests cover content validation, checkpoint rules, owner-only progress, cross-account/admin denial, malformed scores and rejection of client-minted reward fields. Teaching content/schema/import tests and browser checks cover the reader and data pipeline. Cloud writes and live Hosting release require operator Firebase credentials, which are not present in the development workspace. Offline previews show the checked starter only when Firebase is disabled; a configured production app reads Firestore and reports errors instead of masking them with a static fallback.
