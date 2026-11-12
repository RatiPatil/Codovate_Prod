// Admin-only projection. Never copies contacts, inferred skills or credentials.
const blankDetails = () => ({
  desiredRole: "",
  domain: "",
  experience: "",
  college: "",
  degree: "",
  year: "",
  location: "",
  photoUrl: "",
  achievements: [],
  seeking: [],
  passions: [],
});
const domains = [
  "Web Development",
  "AI/ML",
  "Data Science",
  "Cyber Security",
  "Startups",
  "Research",
  "Hackathons",
  "Other",
];
const seeking = [
  "Hackathon Teammates",
  "Project Collaborators",
  "Startup Co-founders",
  "Research Partners",
];
const passions = [
  "AI Products",
  "Hackathons",
  "Open Source",
  "Research",
  "Entrepreneurship",
  "Community Projects",
];
function text(value, max) {
  return typeof value === "string" &&
    value.length <= max &&
    !/[\r\n]/.test(value)
    ? value.trim()
    : "";
}
function tags(value, max, allowed) {
  return Array.isArray(value)
    ? [
        ...new Set(
          value
            .filter(
              (v) =>
                typeof v === "string" &&
                v.trim() &&
                v.length <= 60 &&
                !/[\r\n]/.test(v) &&
                (!allowed || allowed.includes(v)),
            )
            .map((v) => v.trim()),
        ),
      ].slice(0, max)
    : [];
}
function avatar(value) {
  try {
    const u = new URL(value);
    return u.protocol === "https:" &&
      !u.username &&
      !u.password &&
      !u.port &&
      ["lh3.googleusercontent.com", "avatars.githubusercontent.com"].includes(
        u.hostname,
      ) &&
      u.href.length <= 500
      ? u.href
      : "";
  } catch {
    return "";
  }
}
export function studentCard(uid, profile) {
  if (
    !text(profile.name, 100) ||
    !Array.isArray(profile.skills) ||
    profile.skills.length > 20 ||
    profile.skills.some((v) => !text(v, 60)) ||
    new Set(profile.skills).size !== profile.skills.length
  )
    return null;
  const career = profile.careerPreferences || {},
    card = profile.teammateCard || {};
  const details = {
    ...blankDetails(),
    desiredRole: text(career.desiredRole, 100),
    domain: domains.includes(career.domain) ? career.domain : "",
    experience: ["Beginner", "Intermediate", "Advanced"].includes(
      career.experience,
    )
      ? career.experience
      : "",
    college: text(profile.college, 180),
    degree: text(profile.degree, 100),
    year: text(career.yearOfStudy, 40),
    location: text(profile.city, 100) || text(profile.taluka, 100),
    photoUrl: avatar(card.photoUrl),
    achievements: tags(card.achievements, 6),
    seeking: tags(career.seeking, 6, seeking),
    passions: tags(card.passions, 6, passions),
  };
  return { uid, name: profile.name, skills: [...profile.skills], details };
}
export async function publishStudent({ db, uid, timestamp, apply = false }) {
  return db.runTransaction(async (tx) => {
    const profileRef = db.doc(`users/${uid}`),
      publicRef = db.doc(`memberProfiles/${uid}`),
      prefRef = db.doc(`discoveryPreferences/${uid}`);
    const [profile, current, preferences] = await Promise.all([
      tx.get(profileRef),
      tx.get(publicRef),
      tx.get(prefRef),
    ]);
    if (!profile.exists) return "missing";
    // Existing cards and explicit private choices belong to the student.
    // In particular, a hidden card must not be recreated on a later sync.
    if (current.exists || preferences.data()?.discoverable === false)
      return "student_managed";
    const card = studentCard(uid, profile.data());
    if (!card) return "ineligible";
    if (apply) {
      const updatedAt = timestamp();
      const saved = preferences.data();
      const raw = saved?.details;
      const details = raw
        ? studentCard(uid, {
            ...profile.data(),
            college: raw.college,
            degree: raw.degree,
            city: raw.location,
            taluka: "",
            careerPreferences: {
              desiredRole: raw.desiredRole,
              domain: raw.domain,
              experience: raw.experience,
              yearOfStudy: raw.year,
              seeking: raw.seeking,
            },
            teammateCard: {
              photoUrl: raw.photoUrl,
              achievements: raw.achievements,
              passions: raw.passions,
            },
          }).details
        : card.details;
      const shareDetails = saved ? saved.shareDetails === true : true;
      tx.set(prefRef, {
        uid,
        details,
        shareDetails,
        discoverable: true,
        updatedAt,
      });
      tx.create(publicRef, {
        uid,
        name: card.name,
        skills: card.skills,
        ...(shareDetails ? { details } : {}),
        updatedAt,
      });
    }
    return apply ? "published" : "eligible";
  });
}

