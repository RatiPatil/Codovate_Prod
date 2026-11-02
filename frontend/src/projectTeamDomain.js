export function teamInput(raw) {
  const title = String(raw.title || "").trim(),
    description = String(raw.description || "").trim(),
    capacity = Number(raw.capacity),
    recruitment = raw.recruitment || "recruiting";
  const requiredSkills = [
    ...new Set(
      (Array.isArray(raw.requiredSkills)
        ? raw.requiredSkills
        : String(raw.requiredSkills || "").split(",")
      )
        .map((s) => String(s).trim())
        .filter(Boolean),
    ),
  ];
  if (!title || title.length > 100 || !description || description.length > 2000)
    throw new Error(
      "Add a team name and a description of up to 2,000 characters.",
    );
  if (!Number.isInteger(capacity) || capacity < 2 || capacity > 12)
    throw new Error("Choose a capacity from 2 to 12.");
  if (!["open", "recruiting", "closed"].includes(recruitment))
    throw new Error("Choose a valid recruitment status.");
  if (
    requiredSkills.length > 20 ||
    requiredSkills.some((s) => s.length > 60 || /[\r\n]/.test(s))
  )
    throw new Error("Add up to 20 short, single-line required skills.");
  return { title, description, capacity, recruitment, requiredSkills };
}
export const teamStatus = (t) =>
  t.lifecycle === "archived" || t.recruitment === "closed"
    ? "Closed"
    : t.members.length >= t.capacity
      ? "Full"
      : t.recruitment === "open"
        ? "Open"
        : "Recruiting";
export function teamSnapshot(t) {
  return Object.fromEntries(
    [
      "ownerId",
      "title",
      "description",
      "requiredSkills",
      "capacity",
      "recruitment",
      "lifecycle",
      "members",
      "roles",
      "version",
    ].map((k) => [k, t[k]]),
  );
}
export function teamListing(id, t, updatedAt) {
  return {
    teamId: id,
    ownerId: t.ownerId,
    title: t.title,
    description: t.description,
    requiredSkills: t.requiredSkills,
    capacity: t.capacity,
    memberCount: t.members.length,
    recruitment: t.recruitment,
    lifecycle: t.lifecycle,
    version: t.version,
    updatedAt,
  };
}
