# Rebuild verification — 1 November 2026

## Passed locally

- `npm run setup` / clean frontend dependency installation.
- `npm run build`: production bundle generated successfully; Firebase modules split into separate chunks; fonts bundled locally.
- `npm test`: 10 tests covering opportunity filtering, sorting, expiry, profile completion including missing first-login profiles, secure portfolio URLs, preview navigation, logo preservation, Google-button availability, and unconfigured workspace guards.
- Firebase Firestore/Storage emulator rules: 26 allowed/denied-operation checks. Includes private profile isolation, privilege escalation denial, admin-only publishing, public query constraints, application ownership/duplicates/expiry, admin status-only edits, bookmark ownership and private PDF upload/read rules.
- Headless Chromium preview: homepage, search, category filtering, detail view, refresh and Back navigation, disconnected sign-in/guards; 20 route/viewport combinations at 320, 390, 768 and 1440 px with no horizontal document overflow or browser exceptions.
- Headless Chromium with Firebase Auth/Firestore/Storage emulators: administrator registration/sign-in and custom claim, opportunity publishing, separate student registration, profile save, PDF résumé upload, reload persistence, bookmark, application submission, and administrator review/status change. Student workspace pages also checked at mobile width. No browser exceptions.
- Original logo and icon files are unchanged; only the public sitemap was updated.
- `git diff --check` passed.

## Pending new project connection

The emulator checks do not validate a real Firebase project's credentials, provider configuration, billing, authorized domains, deployed rules/indexes or Storage bucket CORS. Real Google OAuth, password-reset email delivery and final end-to-end acceptance must be checked after the new project is supplied and configured. No old project data was accessed or migrated by the rebuild.

This is the implemented student opportunity/application core, not full Unstop/Internshala feature parity. See README scope and DATABASE.md for schema and limitations. No VPS or Hosting deployment is part of this local rebuild.
