import sections from "./placementSections.json";
export { sections };
export function placementInput(raw) {
  const d = Object.fromEntries(
    [
      "sectionId",
      "parentId",
      "kind",
      "title",
      "summary",
      "body",
      "sourceUrl",
      "status",
    ].map((k) => [k, String(raw[k] ?? "").trim()]),
  );
  if (
    !sections.some((s) => s.id === d.sectionId) ||
    !["folder", "article"].includes(d.kind) ||
    !["draft", "published"].includes(d.status) ||
    !d.title ||
    d.title.length > 140 ||
    d.summary.length > 600 ||
    d.body.length > 40000 ||
    !/^[a-zA-Z0-9_-]{0,128}$/.test(d.parentId)
  )
    throw new Error(
      "Choose a section, type, visibility and a title of up to 140 characters. Summary: 600 characters; lesson: 40,000.",
    );
  if (d.kind === "folder" && (d.body || d.sourceUrl))
    throw new Error(
      "Folders contain lessons; keep their lesson text and source link empty.",
    );
  if (d.kind === "article" && d.status === "published" && !d.body)
    throw new Error("Add lesson text before publishing an article.");
  if (d.sourceUrl) {
    let u;
    try {
      u = new URL(d.sourceUrl);
    } catch {
      throw new Error("Enter a valid HTTPS source link.");
    }
    if (
      u.protocol !== "https:" ||
      u.username ||
      u.password ||
      d.sourceUrl.length > 500
    )
      throw new Error("Enter a valid HTTPS source link.");
  }
  if (raw.sourceNote !== undefined)
    d.sourceNote = String(raw.sourceNote).trim();
  if (raw.level !== undefined) d.level = raw.level;
  if (raw.minutes !== undefined) d.minutes = Number(raw.minutes);
  if (raw.practice !== undefined) d.practice = raw.practice;
  if (
    (d.sourceNote?.length || 0) > 600 ||
    (d.level !== undefined &&
      !["Foundation", "Intermediate", "Reference"].includes(d.level)) ||
    (d.minutes !== undefined &&
      (!Number.isInteger(d.minutes) || d.minutes < 1 || d.minutes > 60))
  )
    throw new Error("Invalid lesson metadata.");
  if (
    d.practice !== undefined &&
    (!Array.isArray(d.practice) ||
      d.practice.length > 6 ||
      d.practice.some(
        (q) =>
          !q ||
          typeof q.prompt !== "string" ||
          !q.prompt.trim() ||
          q.prompt.length > 1500 ||
          !Array.isArray(q.options) ||
          q.options.length !== 4 ||
          q.options.some(
            (o) => typeof o !== "string" || !o.trim() || o.length > 300,
          ) ||
          !Number.isInteger(q.answerIndex) ||
          q.answerIndex < 0 ||
          q.answerIndex > 3 ||
          typeof q.explanation !== "string" ||
          !q.explanation.trim() ||
          q.explanation.length > 2000,
      ))
  )
    throw new Error(
      "Check question text, four options, answer and explanation.",
    );
  if (d.kind === "folder" && d.practice?.length)
    throw new Error("Practice questions belong to articles.");
  return d;
}
