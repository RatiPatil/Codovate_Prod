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
  return d;
}
