import { test } from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { syncOperation, safeSyncError } from "./discovery-sync-runtime.mjs";
test("waits for work and returns successful results", async () => {
  assert.equal(await syncOperation("read", () => Promise.resolve(7)), 7);
});
test("rejects stalled work with an actionable bounded timeout", async () => {
  await assert.rejects(
    syncOperation("credentials", () => new Promise(() => {}), {
      timeoutMs: 10,
    }),
    (error) =>
      error.code === "discovery/timeout" && error.stage === "credentials",
  );
});
test("propagates SDK errors without copying personal values into logs", async () => {
  const error = Object.assign(new Error("secret-token student@example.test"), {
    code: "auth/invalid-credential",
  });
  await assert.rejects(
    syncOperation("account", () => Promise.reject(error)),
    error,
  );
  const summary = JSON.stringify(safeSyncError(error, "account"));
  assert.ok(summary.includes("auth/invalid-credential"));
  assert.ok(!summary.includes("secret-token"));
  assert.ok(!summary.includes("student@example.test"));
});
test("CLI prints startup and failure diagnostics before any network access on invalid arguments", () => {
  const result = spawnSync(
    process.execPath,
    [
      fileURLToPath(new URL("./sync-student-discovery.mjs", import.meta.url)),
      "--project=wrong",
    ],
    { encoding: "utf8" },
  );
  assert.equal(result.status, 1);
  assert.match(result.stdout, /Starting student discovery sync/);
  assert.match(result.stderr, /FAILED/);
});
test("a stalled promise cannot silently exit the CLI with success", () => {
  const source = `import {syncOperation} from ${JSON.stringify(new URL("./discovery-sync-runtime.mjs", import.meta.url).href)}; try { await syncOperation('read',()=>new Promise(()=>{}),{timeoutMs:10}); } catch { console.log('TIMED_OUT'); process.exitCode=1; }`;
  const result = spawnSync(
    process.execPath,
    ["--input-type=module", "-e", source],
    { encoding: "utf8" },
  );
  assert.equal(result.status, 1);
  assert.match(result.stdout, /TIMED_OUT/);
});
