// Each SDK operation must retain an event-loop handle and have a bounded wait.
export async function syncOperation(stage, action, { timeoutMs = 45000 } = {}) {
  let timer;
  try {
    return await Promise.race([
      Promise.resolve().then(action),
      new Promise((_, reject) => {
        timer = setTimeout(() => {
          const error = new Error(`Discovery sync timed out during ${stage}.`);
          error.code = "discovery/timeout";
          error.stage = stage;
          reject(error);
        }, timeoutMs);
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}
export function safeSyncError(error, stage) {
  const code =
    typeof error?.code === "number"
      ? String(error.code)
      : /^[a-z][a-z0-9/-]{0,60}$/i.test(error?.code || "")
        ? error.code
        : "sync/failed";
  let guidance = "Check Firebase Admin credentials and project access.";
  if (error?.code === "discovery/timeout")
    guidance =
      "The operation did not finish within 45 seconds. Check your connection and Admin credentials, then retry. Completed cards are safe to skip on reruns.";
  else if (error?.message?.startsWith("Privacy policy mismatch"))
    guidance =
      "Run npm run deploy from this checkout before syncing.";
  else if (error?.message?.startsWith("Firebase Admin credentials unavailable"))
    guidance =
      "Firebase CLI login is separate from Firebase Admin credentials. Use the application-default credentials configured for your student imports.";
  return { stage, code, guidance };
}
