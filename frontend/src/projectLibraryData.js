import seed from "./projectLibrary.json";
export const projectSections = [...new Set(seed.map((row) => row.section))];
export const projectSourceLabels = {
  repository: "Source repository",
  collection: "Project collection",
  article: "Reference article",
  idea: "Idea only",
};
export function libraryRows(stored = [], manage = false) {
  const rows = new Map(seed.map((row) => [row.id, row]));
  for (const row of stored) rows.set(row.id, row);
  return [...rows.values()]
    .filter((row) => manage || row.status === "published")
    .sort(
      (a, b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title),
    );
}
export function filterLibrary(
  rows,
  { search = "", section = "", kind = "" } = {},
) {
  const term = search.normalize("NFKC").trim().toLowerCase();
  return rows.filter(
    (row) =>
      (!section || row.section === section) &&
      (!kind || row.sourceKind === kind) &&
      (!term ||
        [row.title, row.summary, row.section, ...row.skills]
          .join(" ")
          .normalize("NFKC")
          .toLowerCase()
          .includes(term)),
  );
}
