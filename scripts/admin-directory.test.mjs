import { test } from "node:test";
import assert from "node:assert/strict";
import {
  directoryRow,
  sameDirectoryRow,
  accountCounts,
} from "./admin-directory-core.mjs";
const stamp = { toMillis: () => 100 };
const account = {
  uid: "student-1",
  displayName: "Fallback Name",
  email: "private@example.com",
  phoneNumber: "+919876543210",
  metadata: { creationTime: "2026-11-02T00:00:00Z" },
};
test("projection includes full name and identity, never contact or private profile fields", () => {
  const result = directoryRow(
    account,
    {
      name: "Full Student Name",
      email: account.email,
      mobile: account.phoneNumber,
      bio: "private",
      createdAt: stamp,
    },
    () => stamp,
  );
  assert.deepEqual(Object.keys(result).sort(), ["fullName", "joinedAt", "uid"]);
  assert.equal(result.fullName, "Full Student Name");
  assert(!JSON.stringify(result).includes("@"));
  assert(!JSON.stringify(result).includes("9876543210"));
});
test("missing profiles use Auth display names, not email addresses", () => {
  assert.equal(
    directoryRow(account, null, () => stamp).fullName,
    "Fallback Name",
  );
  assert.equal(
    directoryRow({ ...account, displayName: "" }, null, () => stamp).fullName,
    "",
  );
});
test("unchanged directory rows do not need rewrites", () => {
  const row = directoryRow(account, null, () => stamp);
  assert(sameDirectoryRow(row, { ...row, updatedAt: 123 }));
  assert(!sameDirectoryRow(row, { ...row, fullName: "Changed" }));
});
test("exact account counts include disabled and unactivated accounts without claiming active users", () => {
  assert.deepEqual(
    accountCounts([
      { disabled: false },
      { disabled: true },
      { disabled: false },
    ]),
    { registeredAccounts: 3, enabledAccounts: 2, disabledAccounts: 1 },
  );
});
