import { syncOperation } from "./discovery-sync-runtime.mjs";
const transientCodes = new Set([
  "discovery/timeout",
  "auth/internal-error",
  "auth/network-request-failed",
  "auth/too-many-requests",
  "app/network-error",
  "app/network-timeout",
  "ECONNRESET",
  "ETIMEDOUT",
  "EAI_AGAIN",
  4,
  8,
  13,
  14,
]);
// Auth returns users in arbitrary order. Never associate profiles by array index.
export async function lookupStudentAccounts(
  auth,
  uids,
  { timeoutMs = 45000, attempts = 3, delayMs = 500, onRetry = () => {} } = {},
) {
  const accounts = new Map();
  const unique = [...new Set(uids)];
  for (let offset = 0; offset < unique.length; offset += 100) {
    const batch = unique.slice(offset, offset + 100);
    for (let attempt = 1; ; attempt++) {
      try {
        const result = await syncOperation(
          "Checking student accounts",
          () => auth.getUsers(batch.map((uid) => ({ uid }))),
          { timeoutMs },
        );
        for (const account of result.users)
          if (batch.includes(account.uid)) accounts.set(account.uid, account);
        break;
      } catch (error) {
        if (attempt >= attempts || !transientCodes.has(error.code)) throw error;
        onRetry({ attempt, attempts, batchSize: batch.length });
        await new Promise((resolve) => setTimeout(resolve, delayMs * attempt));
      }
    }
  }
  return accounts;
}
