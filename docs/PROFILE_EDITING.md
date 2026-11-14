# Professional student profile editing

My profile now groups personal/academic details, career direction/collaboration, skills, self-reported achievements, passions and the independently saved résumé. The summary uses the existing real completeness calculation. No achievements or interests are invented, and experience is chosen by the student.

`profileForm.js` is the central input contract: uppercase normalized full names; required college/degree containing letters; Unicode city names without digits; graduation year 2000–2100 as four digits (not scientific notation or decimals); HTTPS portfolio URLs without embedded credentials; bounded introduction and 20 case-insensitively unique skills with no silent truncation; 10-digit Indian mobile numbers starting 6–9; known career enums, at least one goal, valid seeking/passions, and an explicit just-starting selection when no skills are supplied. Errors identify/focus the affected field; failed validation does not start a database write. Native validation is replaced for this form so these messages remain consistent.

Career role, domain, experience, year, goals, seeking, availability and mode can now be edited in My profile. Existing Firestore fields and schema are reused without a migration. The entire profile editor is disabled while its save is pending. Résumé saving stays separate and full-profile edits do not overwrite résumé paths or links.

`profileData.js` performs one transaction: reads the private profile, discovery preferences and existing public card before writing. Private career/academic/interest changes synchronize to saved discovery preferences. The public detail map is updated only if a public card exists and the student already enabled detail sharing. Name/skills continue to update the existing discovery card under the established policy. No discovery preference, card or share permission is created automatically. Mobile-sharing and administrator-name projections remain in the same transaction; creation time, user identity and résumé fields are preserved.

Mobile privacy now offers a retry after listener failure and clears the stale error when fresh settings arrive. The form will not overwrite an unknown privacy choice. No phone number is copied into public discovery details.

Tests exercise invalid input boundaries, normalization, privacy choices, beginner profiles, atomic public/private synchronization, preservation of résumé fields and existing privacy/interest controls. Production persistence still depends on deployment of the repository's existing rules and a valid signed-in account.
