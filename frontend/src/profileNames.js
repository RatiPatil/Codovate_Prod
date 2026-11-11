export function normalizeName(value) {
  return String(value || "")
    .trim()
    .replace(/\s+/gu, " ")
    .toUpperCase();
}

export function normalizeFullName(value) {
  const name = normalizeName(value);
  const parts = name.split(" ");
  if (
    name.length > 100 ||
    parts.length < 2 ||
    parts.some((part) => !/^[\p{L}\p{M}][\p{L}\p{M}'’.-]*$/u.test(part))
  ) {
    throw new Error(
      "Enter your full name, including your first and last name.",
    );
  }
  return name;
}
