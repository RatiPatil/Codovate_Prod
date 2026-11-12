export const knownStudyFields = [
  "CIVIL ENGINEERING",
  "CIVIL STRUCTURE",
  "COMPUTER SCIENCE AND ENGINEERING",
  "ELECTRICAL ENGINEERING",
  "ELECTRONICS AND TELECOMMUNICATION ENGINEERING",
  "MECHANICAL ENGINEERING",
  "MASTER OF BUSINESS ADMINISTRATION",
  "DESIGN ENGINEERING",
  "MASTER OF COMPUTER APPLICATIONS",
  "ARTIFICIAL INTELLIGENCE AND MACHINE LEARNING",
  "DATA SCIENCE",
];
export function normalizeStudyField(value) {
  const field = String(value || "")
    .normalize("NFKC")
    .trim()
    .replace(/\s+/g, " ")
    .toUpperCase();
  return field === "ELECTRONICS AND TELECOMMUNICATION ENGG"
    ? "ELECTRONICS AND TELECOMMUNICATION ENGINEERING"
    : field;
}
export function studyFieldLabel(value) {
  const acronyms = new Set([
    "AI",
    "ML",
    "MCA",
    "MBA",
    "BCA",
    "BBA",
    "IT",
    "CSE",
    "ECE",
    "EEE",
    "AI/ML",
  ]);
  return normalizeStudyField(value)
    .split(" ")
    .map((word, index) =>
      acronyms.has(word)
        ? word
        : index && ["AND", "OF", "THE"].includes(word)
          ? word.toLowerCase()
          : word.charAt(0) + word.slice(1).toLowerCase(),
    )
    .join(" ");
}

// Suggestions describe relevant opportunities, not confirmed student interests.
export function studyDomains(field) {
  const value = normalizeStudyField(field);
  if (/COMPUTER|MCA|INFORMATION|ARTIFICIAL|DATA SCIENCE|CYBER/.test(value))
    return ["Web Development", "AI/ML", "Data Science", "Cyber Security", "Hackathons", "Research"];
  if (/BUSINESS|MBA|COMMERCE|MANAGEMENT/.test(value))
    return ["Startups", "Data Science", "Research", "Hackathons"];
  if (/ELECTRONICS|ELECTRICAL|TELECOMMUNICATION/.test(value))
    return ["AI/ML", "Data Science", "Cyber Security", "Research", "Hackathons"];
  if (/MECHANICAL|CIVIL|DESIGN|ENGINEERING/.test(value))
    return ["Research", "Data Science", "Startups", "Hackathons"];
  return ["Research", "Startups", "Hackathons"];
}
