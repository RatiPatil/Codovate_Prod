// Only the minimal administrator directory projection leaves the trusted operator.
export function directoryRow(account, profile, toTimestamp) {
  const rawName =
    typeof profile?.name === "string" && profile.name.trim()
      ? profile.name
      : account.displayName || "";
  const joinedAt = profile?.createdAt?.toMillis
    ? profile.createdAt
    : toTimestamp(new Date(account.metadata.creationTime));
  return {
    uid: account.uid,
    fullName: String(rawName).trim().slice(0, 200),
    joinedAt,
  };
}
export function sameDirectoryRow(a, b) {
  return (
    a?.uid === b.uid &&
    a?.fullName === b.fullName &&
    a?.joinedAt?.toMillis?.() === b.joinedAt?.toMillis?.()
  );
}

export function accountCounts(accounts) {
  return {
    registeredAccounts: accounts.length,
    enabledAccounts: accounts.filter((a) => !a.disabled).length,
    disabledAccounts: accounts.filter((a) => a.disabled).length,
  };
}
