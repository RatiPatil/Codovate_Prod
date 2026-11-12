export const knownStudyFields = [
  "CIVIL ENGINEERING",
  "CIVIL STRUCTURE",
  "COMPUTER SCIENCE AND ENGINEERING",
  "ELECTRICAL ENGINEERING",
  "ELECTRONICS AND TELECOMMUNICATION ENGINEERING",
  "MECHANICAL ENGINEERING",
  "MASTER OF BUSINESS ADMINISTRATION",
  "DESIGN ENGINEERING",
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
