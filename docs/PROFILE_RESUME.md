# Independent résumé saving

My profile now has a separate **Your résumé → Save résumé** form. Full-profile name, skills, mobile/privacy, interests, discovery projections and admin-directory updates are no longer prerequisites for saving the résumé. Full-profile saves do not write résumé fields, preserving a separately saved link or PDF.

Choose **Upload PDF**, select a nonempty PDF up to 5 MB, then **Save résumé**. The client checks the filename, MIME type when available, and PDF header. Upload progress is displayed. The authenticated user's fixed private Storage path remains `resumes/{uid}/resume.pdf`. Only after upload success does a narrow Firestore transaction update `resumePath`, clear `resumeUrl`, and set server `updatedAt`. Clearing the previous URL prevents View current résumé from opening an old link instead of the new PDF. Storage and Firestore do not support one cross-service atomic transaction: a metadata-write failure is shown as an error, with the selected file retained for retry. Replacing a PDF uses the existing fixed Storage object path.

Alternatively choose **Use résumé link**, enter an HTTPS URL, then **Save résumé**. This updates only `resumeUrl` and `updatedAt`; it requires no Storage upload and preserves any existing PDF path as a fallback. The link takes precedence while nonempty. The external host controls access, so grant intended reviewers permission there.

A saved PDF/link indicator and **View current résumé** use the persisted profile snapshot. PDF opening creates its tab before fetching the download URL to avoid asynchronous popup blocking. File upload and metadata operations have bounded waits; failures never show a success message. Selected files/links remain available after failure. The file input resets only after success.

Firestore and Storage paths, schema and rules remain unchanged. The owner can save/read their résumé; application administrators can review files under the existing Storage policy. Résumé metadata is not added to public teammate cards. Firebase Storage must be configured and accessible for uploads; this UI does not provision a missing bucket or change billing. Provider/configuration failures are displayed and the independently saved HTTPS-link option remains available.

Tests cover PDF validation, upload-before-metadata ordering, stale URL clearing, independent link writes, failed uploads/writes, saved-state rehydration and retained drafts. `npm --prefix scripts run test:resume-save` uses Firestore emulator port 8080 to verify persistence, preservation of unrelated fields, safe paths and private access. These checks do not establish production bucket availability.

Release: `git pull origin main`, then `npm run deploy`. No data import or database migration is required. Verify with the signed-in student's real PDF/link after deployment.
