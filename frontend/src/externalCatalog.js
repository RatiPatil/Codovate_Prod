import records from "./curatedOpportunities.json";
export const REVIEW_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
export function externalAvailable(item, now = Date.now()) {
  const checked = Date.parse(item.reviewedAt),
    deadline = item.deadline ? Date.parse(item.deadline) : Infinity;
  return (
    Number.isFinite(checked) &&
    checked <= now &&
    now < checked + REVIEW_WINDOW_MS &&
    now < deadline
  );
}
export function externalOpportunity(row) {
  return {
    ...row,
    external: true,
    status: "published",
    stipend: null,
    duration: "See official listing",
    description: row.summary,
    responsibilities:
      "Review the employer or organizer page for the complete responsibilities and application requirements.",
    createdAt: { seconds: Date.parse(row.reviewedAt) / 1000 },
  };
}
export function externalById(id) {
  const row = records.find((r) => r.id === id);
  return row ? externalOpportunity(row) : null;
}
export function mergeOpportunityCatalog(managed = [], now = Date.now()) {
  const ids = new Set(managed.map((r) => r.id));
  return [
    ...managed,
    ...records
      .filter((r) => !ids.has(r.id) && externalAvailable(r, now))
      .map(externalOpportunity),
  ];
}
