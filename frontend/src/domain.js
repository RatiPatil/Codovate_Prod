export const types = ["internship", "job", "competition", "hackathon"];
export const typeLabel = {
  internship: "Internships",
  job: "Fresher jobs",
  competition: "Competitions",
  hackathon: "Hackathons",
};
export function deadlineMillis(item) {
  const value = item.closesAt ?? item.deadline;
  if (typeof value?.toMillis === "function") return value.toMillis();
  if (typeof value?.seconds === "number") return value.seconds * 1000;
  return Date.parse(value);
}
export function isOpen(item, now = Date.now()) {
  const deadline = deadlineMillis(item);
  return (
    item.status === "published" && Number.isFinite(deadline) && deadline > now
  );
}
export function filterOpportunities(
  items,
  {
    search = "",
    type = "all",
    mode = "all",
    category = "all",
    sort = "newest",
    openOnly = true,
  } = {},
) {
  const term = search.trim().toLowerCase();
  return items
    .filter(
      (o) =>
        (type === "all" || o.type === type) &&
        (mode === "all" || o.mode === mode) &&
        (category === "all" || o.category === category) &&
        (!openOnly || isOpen(o)) &&
        [o.title, o.organization, o.location, ...(o.skills || [])]
          .join(" ")
          .toLowerCase()
          .includes(term),
    )
    .sort((a, b) =>
      sort === "deadline"
        ? deadlineMillis(a) - deadlineMillis(b)
        : sort === "stipend"
          ? b.stipend - a.stipend
          : (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0),
    );
}
export function completion(p = {}) {
  p = { ...(p || {}), resumePath: p?.resumePath || p?.resumeUrl || "" };
  return Math.round(
    ([
      "name",
      "college",
      "degree",
      "graduationYear",
      "city",
      "bio",
      "skills",
      "resumePath",
    ].filter((k) => (Array.isArray(p[k]) ? p[k].length : !!p[k])).length /
      8) *
      100,
  );
}
export function validWebLink(value) {
  if (!value) return true;
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}
export function money(amount) {
  return amount > 0
    ? "₹" + new Intl.NumberFormat("en-IN").format(amount)
    : "Not specified";
}
export function dateLabel(value) {
  return new Date(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
export function errorMessage(e) {
  return (
    {
      "app/auth-timeout":
        "Sign-in took too long. Check your connection and retry. If your account is already signed in, reload to restore it.",
      "app/data-timeout":
        "The requested data did not load in time. Check your connection and refresh.",
      "app/profile-timeout":
        "Your account data did not load in time. Check your connection and retry.",
      "app/session-error":
        "Your account could not be loaded. Retry the connection or sign out.",
      "auth/configuration-not-found":
        "Authentication is not configured for this project. The administrator needs to enable the sign-in providers.",
      "auth/password-does-not-meet-requirements":
        "Choose a password that meets the project's password policy.",
      "auth/popup-blocked":
        "Your browser blocked Google sign-in. Allow pop-ups for this site, then try again.",
      "auth/cancelled-popup-request":
        "Another sign-in window was opened. Finish that window or try again.",
      "auth/user-disabled":
        "This account has been disabled. Contact the platform administrator.",
      "auth/invalid-email": "Enter a valid email address.",
      "auth/wrong-password": "The email or password is incorrect.",
      "auth/user-not-found": "The email or password is incorrect.",
      "auth/weak-password":
        "Choose a password with at least 8 characters for a new account.",
      "auth/account-exists-with-different-credential":
        "This email already uses another sign-in method. Use the method you originally registered with.",
      "app/check-timeout":
        "Firebase did not respond in time. Check your connection and the project setup, then retry.",
      "failed-precondition":
        "Firestore needs its indexes or database setup completed. Run npm run firebase:setup and check Firebase Console.",
      unavailable:
        "Firestore is unavailable. Check your internet connection and that the database exists in this project.",
      "auth/invalid-credential": "The email or password is incorrect.",
      "auth/email-already-in-use":
        "An account already exists with this email. Please sign in.",
      "auth/popup-closed-by-user":
        "The Google sign-in window was closed. Try again.",
      "auth/unauthorized-domain":
        "Add localhost to Authentication → Settings → Authorized domains in your new Firebase project.",
      "permission-denied":
        "Access was denied. Check that the new Firebase security rules are deployed and your role is correct.",
      "auth/operation-not-allowed":
        "Enable this sign-in provider in your new Firebase project.",
      "auth/too-many-requests": "Too many attempts. Please try again later.",
      "auth/network-request-failed":
        "Could not connect. Check your internet connection.",
      "auth/invalid-api-key":
        "The Firebase API key is invalid. Check frontend/.env.local.",
      "storage/unauthorized":
        "Résumé upload is unavailable or was denied. You can save an HTTPS résumé link instead.",
    }[e?.code] || "Something went wrong. Check your connection and try again."
  );
}
export function skillInputError(raw) {
  const skills = [
    ...new Set(
      raw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    ),
  ];
  if (skills.length > 20) return "Add up to 20 skills.";
  if (skills.some((s) => s.length > 60))
    return "Keep each skill under 61 characters.";
  return "";
}
