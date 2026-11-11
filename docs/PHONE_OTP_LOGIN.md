# Phone OTP login

`/phone-login` uses Firebase Authentication SMS sign-in and the existing auth-page classes. Email/password and Google login remain available. No theme or CSS changes are required.

## Flow and identity

Enter a name and an international phone number (including country code), complete Firebase reCAPTCHA, request an SMS, then enter the six-digit code. Firebase verifies the code before the existing idempotent profile transaction runs. New phone identities create student accounts with an empty email; Firestore accepts an empty email only when the Firebase token has a phone number. No client-written admin claim or mobileVerified flag is introduced. The existing private profile `mobile` field remains unverified contact data, distinct from the Auth phone identity.

An existing email/Google account is not automatically merged by matching a contact phone number. Signing in with an unlinked phone number can create a separate UID. Account linking is outside this change. Existing administrators must use their currently linked provider; a new phone UID has no admin claim.

The SDK manages SMS challenges and session tokens. Codes and confirmation objects are kept only in component memory, never written to Firestore, URLs or browser storage by this component. reCAPTCHA is cleared after requests and on unmount. Resending invalidates the component's previous challenge. A 60-second client cooldown reduces accidental repeat requests; Firebase quotas and abuse controls remain authoritative. No SMS is automatically sent on page load.

## Required cloud setup

1. Verify the intended project and existing Blaze billing account. This change does not create or attach a billing account.
2. Enable Phone in Firebase Authentication sign-in providers.
3. Configure the SMS region allowlist for intended recipients (India for +91 recipients), inspect quotas and billing alerts, and authorize the actual production domain.
4. Deploy the updated Firestore rules before releasing the frontend. The email-free identity rule is required for first-time phone users.
5. Build with the existing project's web configuration and deploy to the application's verified hosting destination. Existing GitHub Actions validate changes but do not deploy the website.
6. Use Firebase fictional test phone numbers/codes first. Then verify an authorized real SMS sign-in, existing-account login, logout, denied admin access, denied cross-user reads, invalid/expired codes, resend, and profile recovery on the production domain.

Phone authentication uses Firebase's browser reCAPTCHA flow. Do not disable app verification in production. Real delivery, quotas, billing, providers and deployed rules cannot be verified by a passing frontend build. Connect Firebase with authorized project access to perform these cloud steps; never put service-account JSON, access tokens, passwords or OTPs in chat or git.

## Local verification

Run `npm test` and `npm run build`. The rule suite includes successful phone-only profile creation, rejection of missing identity claims, and rejection of forged email. Run it through the existing Auth/Firestore/Storage emulator CI command in `.github/workflows`.
