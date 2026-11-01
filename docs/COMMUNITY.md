# Student projects and team discovery

## Product flows

The /projects showcase displays only public, non-hidden projects. Signed-in students can switch to My projects, create a private draft, add repository/demo links, edit details, explicitly publish, make a project private again, or permanently delete after confirmation. Each project has a direct /projects/:id spotlight with repository/demo links and a copy-link control for public projects. Private/hidden links remain protected by the same rules. An admin can view and edit all projects, hide them from the public showcase, restore visibility eligibility or delete. A hidden project cannot be edited or restored by its student owner; owners may delete their own content.

The /teams directory requires sign-in. Students can create and edit a team brief, list the skills/roles they seek and open/close recruiting. My teams includes the owner's closed and hidden records. Other signed-in students can send one introduction per team and track it under My requests. The owner can accept or decline pending introductions in Review requests. The applicant can withdraw a pending or accepted introduction. Decisions re-read the document transactionally, so a stale owner screen cannot overwrite a withdrawal or prior decision. Successful project/team saves open the owner's list; sending an introduction opens My requests.

Acceptance records the owner's decision about an introduction. This release does not provision team chat, a collaboration workspace, a member roster/capacity system, contact sharing, email/push notifications or hackathon team submissions. No screen advertises those as available. Declined/withdrawn requests cannot currently be resubmitted; deterministic request records are retained. Teams are closed rather than deleted, preserving request references. Administrators can hide teams; restoring returns them to closed so recruiting does not restart automatically.

## Document contracts

All fields are required; unknown fields are rejected by Security Rules and JSON Schema. createdAt and updatedAt are Firestore server timestamps. Browser forms validate meaningful input; rules independently check ownership and bounds. Lengths below are maximum string lengths unless otherwise specified.

| Collection | Fields / constraints |
| --- | --- |
| projects | studentId (128), studentName (100), title (1–120), summary (1–2000), category, skills (up to 20 unique strings, each 1–60), repoUrl/demoUrl (empty or HTTPS, 500), visibility private/public, moderation visible/hidden, timestamps |
| teams | studentId, studentName, title, summary, category, skills with the same limits; lookingFor (1–180), status open/closed/hidden, timestamps |
| teamRequests | studentId (applicant, 128), studentName (100), ownerId (128), teamId (128), teamTitle (120), note (1–1000), status pending/accepted/declined/withdrawn, timestamps. ID = studentId_teamId |

Categories: Web & apps, AI & data, Design, Hardware, Social impact, Other. Student identity snapshots must match the authenticated profile when created and cannot subsequently change. Creating a project with moderation visible does not make it public unless its visibility is explicitly public. Only trusted custom-claim admins may hide/restore content.

Rules authorize a new request only when the team exists and is open, snapshots match the team/profile, the owner differs from the applicant, the ID matches, and the initial state is pending. Neither applicant nor owner can rewrite another person's note, identity or creation time. Missing-document request reads are permitted to authenticated callers to support transactions; existing request data remains restricted.

## Query and index matrix

Implementation: frontend/src/careerData.js, communityData.js and Community.jsx.

| Screen | Equality filters before createdAt descending | Composite index |
| --- | --- | --- |
| Public showcase | visibility = public, moderation = visible | Both filters + createdAt |
| My projects | studentId = auth.uid | studentId + createdAt |
| Team discovery | status = open | status + createdAt |
| My teams | studentId = auth.uid | studentId + createdAt |
| My requests | studentId = auth.uid | studentId + createdAt |
| Owner inbox | teamId = selected team, ownerId = auth.uid | teamId + ownerId + createdAt |
| Admin inbox | teamId = selected team | teamId + createdAt |
| Admin project/team moderation | none | Automatic createdAt descending |

All indexes are declared in firestore.indexes.json. Queries use 24-record cursor pages plus a lookahead; no global scans or fabricated counts. Search operates on loaded records and refresh is explicit. Rules reject unrestricted student queries. During account/scope changes the hook hides old rows immediately and ignores stale responses.

## UI stability

Screens share form/card controls, lavender/sage illustrations and bounded fields. Visibility choices explain data sharing. Failed writes preserve drafts; successful writes close editors. A synchronous action lock prevents double submit while a request is pending. Hidden content cannot be inadvertently republished by its owner. HTTPS links open with noopener noreferrer; no new public emails or resumes are introduced.

The sidebar has bounded vertical scrolling on short desktops and horizontal navigation on mobile. Card grids collapse to one column; long text wraps. A top-level render-error recovery screen supplies reload/home controls. Resource validation now shows actionable form messages and closes an editor if its resource is deleted.

## Connection and acceptance

This repository release does not change live Firebase data or policies. Deploy updated rules/indexes through the Antigravity handoff before using these modules. Collections appear on their first authorized write. Example records are not imported into production.

Use student A, student B and admin accounts for live acceptance. Verify A's private project is denied to B and guests; public+visible projects appear; hidden projects disappear; A cannot reverse moderation. Create a team as A, request it as B, confirm duplicate denial and review as A. Test accept/decline on separate requests, withdrawal, stale decisions, closed-team refusal and third-student privacy. Verify admin moderation/inbox queries after indexes are ready. Check forms/navigation/deep links on real mobile and desktop devices. Emulator results do not certify live-cloud completion.
