import records from "./hackathonDirectory.json";
export { records as hackathonDirectory };
export function directoryStatus(row, now = Date.now()) {
  if (row.deadline && Date.parse(row.deadline) <= now) return "closed";
  if (row.registrationOpensAt && Date.parse(row.registrationOpensAt) > now) return "upcoming";
  if (row.registrationOpensAt && row.deadline) return "open";
  return "unverified";
}
export function filterHackathonDirectory(rows, filters = {}, now = Date.now()) {
  const term = (filters.search || "").trim().toLowerCase();
  return rows.filter(row =>
    (!filters.group || filters.group === "all" || row.group === filters.group) &&
    (!filters.mode || filters.mode === "all" || row.modes.includes(filters.mode)) &&
    (!filters.category || filters.category === "all" || row.interests.includes(filters.category)) &&
    (!filters.availability || filters.availability === "all" || directoryStatus(row, now) === filters.availability) &&
    [row.title, row.summary, row.group, row.location, ...row.skills].join(" ").toLowerCase().includes(term),
  ).sort((a, b) => {
    if (filters.sort === "stipend") return (b.prizeINR ?? -1) - (a.prizeINR ?? -1) || a.title.localeCompare(b.title);
    if (filters.sort === "deadline") {
      const closing = row => row.deadline && Date.parse(row.deadline) > now ? Date.parse(row.deadline) : Infinity;
      return (closing(a) === closing(b) ? 0 : closing(a) - closing(b)) || a.title.localeCompare(b.title);
    }
    return (Date.parse(b.publishedAt) || 0) - (Date.parse(a.publishedAt) || 0) || a.title.localeCompare(b.title);
  });
}
