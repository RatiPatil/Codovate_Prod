export const types = ["internship", "job", "competition", "hackathon"];
export const typeLabel = {
  internship: "Internships",
  job: "Fresher jobs",
  competition: "Competitions",
  hackathon: "Hackathons",
};
export function isOpen(item, now = Date.now()) {
  return (
    item.status === "published" &&
    Number.isFinite(Date.parse(item.deadline)) &&
    Date.parse(item.deadline) > now
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
        ? Date.parse(a.deadline) - Date.parse(b.deadline)
        : sort === "stipend"
          ? b.stipend - a.stipend
          : (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0),
    );
}
export function completion(p = {}) {
  p = p || {};
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
        "Résumé upload was denied. Deploy storage.rules to your new Firebase project.",
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
