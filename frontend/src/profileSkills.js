// Imported program defaults describe learning areas, never confirmed experience.
export function programSkills(profile) {
  const values = profile?.suggestedSkills;
  if (
    profile?.importSource !== "student_workbook_v1" ||
    !Array.isArray(values) ||
    values.length > 20 ||
    values.some(
      (v) =>
        typeof v !== "string" || !v.trim() || v.length > 60 || /[\r\n]/.test(v),
    ) ||
    new Set(values).size !== values.length
  )
    return [];
  return values;
}
export function visibleSkills(member) {
  return member?.skills?.length ? member.skills : member?.suggestedSkills || [];
}
