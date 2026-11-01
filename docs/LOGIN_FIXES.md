# Authentication recovery fixes

## Confirmed defects

- The sign-in form enforced an eight-character minimum even though existing Firebase accounts can have six- or seven-character passwords. The minimum now applies only to new registrations; existing login credentials reach Firebase unchanged.
- A successful Auth sign-in followed by denied/missing account data was shown as a generic login failure. Account connection errors now use a separate recovery screen with retry, sign-out and setup help.
- Missing server responses could leave authentication or profile loading waiting indefinitely. Auth restoration/token retrieval, profile reads/writes, email/password operations and reset-email requests now have bounded waiting and stage-specific errors. Google consent popups remain under the user's control.
- A missing cached profile could be mistaken for a completed server read. The listener waits for server confirmation or a timeout, and includes metadata updates.
- Stale callbacks after retry/account changes are ignored. Retry establishes a fresh session subscription.
- Auth-page return destinations could send users back to an authentication route. Return paths reject authentication loops, external URLs and backslash/newline variants.
- Popup blocking, disabled accounts, invalid email, provider conflicts and password-policy errors now have explicit messages. Local IP users are directed to the authorized localhost address for Google sign-in.

## What this does not change

These fixes do not weaken Firestore rules, skip Firebase authentication, grant admin roles, seed data or deploy cloud configuration. The latest read-only live check still returned HTTP 403 for the expected published-opportunity query; the Firebase integration remains unconnected. Real Google OAuth and the owner's own credentials have not been tested.

A signed-in user whose database is inaccessible should see **You're signed in** with the specific account connection error. They should not be told their password is wrong. Retry is useful after network/rule fixes; repeating a password cannot resolve a database permission error.

## Verification

- 30 frontend tests pass: password requirements, incorrect credentials, denied profile setup, popup blocking, recovery/retry, stale callbacks, missing-cache handling, bounded waits, safe return paths and the existing application checks.
- Production build passes.
- Five Firebase Auth/Firestore emulator integration checks pass: an existing six-character password signs in, the owner profile can be created transactionally, repeated setup preserves it, global profile access remains denied, and incorrect credentials are rejected.

Run the integration check using the Firebase Emulator Suite with Java installed:

```bash
firebase emulators:exec --only auth,firestore --project demo-codovate "npm --prefix scripts run test:login"
```

Install script/test dependencies first with `npm --prefix scripts ci`. The test refuses to run without the local emulator host variables and uses only the demo project.

## Local update

```powershell
git pull origin main
npm run setup
npm run firebase:setup
npm run dev
```

Use **http://localhost:5173**. The setup command requires the Google account that can deploy to codovate-dev. If it fails, retain the exact Firebase CLI error. Deploying the repository code alone does not deploy Firebase rules, enable login providers or provision Storage.
