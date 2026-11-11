import records from "./hackathonDirectory.json";
export { records as hackathonDirectory };
export function localDate(now, timeZone = "UTC") {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now);
  const get = type => parts.find(part => part.type === type).value;
  return `${get("year")}-${get("month")}-${get("day")}`;
}
export function eventStatus(row, now = Date.now()) {
  const s = row.schedule;
  if (!s) return "unverified";
  const today = localDate(now, s.timeZone);
  if (s.state === "paused") return "paused";
  if (s.eventEndDate && s.eventEndDate < today) return "ended";
  if (s.eventStartDate && s.eventStartDate > today) return "upcoming";
  if (s.eventStartDate && s.eventEndDate && s.eventStartDate <= today) return "ongoing";
  return "unverified";
}
export function directoryStatus(row, now = Date.now()) {
  const s = row.schedule;
  if (s) {
    const today = localDate(now, s.timeZone);
    if (eventStatus(row, now) === "ended" || s.registration === "closed" ||
        (s.registrationDeadlineDate && s.registrationDeadlineDate < today)) return "closed";
    if (s.registrationOpensDate && s.registrationOpensDate > today) return "upcoming";
    // Open registration is a time-limited observation, never inferred from future event dates.
    const reviewed = Date.parse(s.checkedOn + "T00:00:00Z");
    if (s.registration === "open" && now >= reviewed && now - reviewed < 7 * 86400000) return "open";
    if (eventStatus(row, now) === "upcoming") return "upcoming";
    if (eventStatus(row, now) === "ongoing") return "ongoing";
  }
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
      const closing = row => {
        if (directoryStatus(row, now) === "closed") return Infinity;
        if (row.schedule?.registrationDeadlineDate) return Date.parse(row.schedule.registrationDeadlineDate + "T23:59:59Z");
        return row.deadline && Date.parse(row.deadline) > now ? Date.parse(row.deadline) : Infinity;
      };
      return (closing(a) === closing(b) ? 0 : closing(a) - closing(b)) || a.title.localeCompare(b.title);
    }
    if (filters.sort === "eventDate") {
      const rank = row => row.schedule?.eventStartDate && eventStatus(row, now) !== "ended" ? Date.parse(row.schedule.eventStartDate) : Infinity;
      return (rank(a) === rank(b) ? 0 : rank(a) - rank(b)) || a.title.localeCompare(b.title);
    }
    return (Date.parse(b.publishedAt) || 0) - (Date.parse(a.publishedAt) || 0) || a.title.localeCompare(b.title);
  });
}
