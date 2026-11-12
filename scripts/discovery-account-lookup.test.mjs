import { test } from "node:test";
import assert from "node:assert/strict";
import { lookupStudentAccounts } from "./discovery-account-lookup.mjs";
test("uses bounded bulk requests and maps unordered results by UID", async () => {
  const batches = [],
    uids = Array.from({ length: 205 }, (_, i) => `student-${i}`);
  const auth = {
    getUsers: async (batch) => {
      batches.push(batch);
      return {
        users: batch.toReversed().map(({ uid }) => ({ uid })),
        notFound: [],
      };
    },
  };
  const result = await lookupStudentAccounts(auth, uids);
  assert.deepEqual(
    batches.map((b) => b.length),
    [100, 100, 5],
  );
  assert.equal(result.size, 205);
  assert.equal(result.get("student-17").uid, "student-17");
});
test("missing Auth identities are absent, never mistaken for another student", async () => {
  const result = await lookupStudentAccounts(
    {
      getUsers: async () => ({
        users: [{ uid: "second" }],
        notFound: [{ uid: "first" }],
      }),
    },
    ["first", "second"],
  );
  assert.equal(result.has("first"), false);
  assert.equal(result.get("second").uid, "second");
});
test("retries transient failures and reports progress without exposing identities", async () => {
  let calls = 0;
  const updates = [];
  const auth = {
    getUsers: async () => {
      calls++;
      if (calls < 3)
        throw Object.assign(new Error("temporary"), {
          code: "auth/internal-error",
        });
      return { users: [{ uid: "student" }] };
    },
  };
  const result = await lookupStudentAccounts(auth, ["student"], {
    delayMs: 0,
    onRetry: (value) => updates.push(value),
  });
  assert.equal(calls, 3);
  assert.ok(result.has("student"));
  assert.equal(updates.length, 2);
  assert.ok(!JSON.stringify(updates).includes('"student"'));
});
test("retries a stalled lookup and remains bounded", async () => {
  let calls = 0;
  const auth = {
    getUsers: () => {
      calls++;
      return new Promise(() => {});
    },
  };
  await assert.rejects(
    lookupStudentAccounts(auth, ["student"], {
      timeoutMs: 5,
      delayMs: 0,
      attempts: 2,
    }),
    (error) => error.code === "discovery/timeout",
  );
  assert.equal(calls, 2);
});
test("fails immediately for permanent credential errors", async () => {
  let calls = 0;
  await assert.rejects(
    lookupStudentAccounts(
      {
        getUsers: async () => {
          calls++;
          throw Object.assign(new Error("unauthorized"), {
            code: "auth/invalid-credential",
          });
        },
      },
      ["student"],
      { delayMs: 0 },
    ),
    (error) => error.code === "auth/invalid-credential",
  );
  assert.equal(calls, 1);
});
