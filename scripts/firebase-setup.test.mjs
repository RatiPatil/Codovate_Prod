import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  verifyProjectConfig,
  environmentText,
  saveLocalConfig,
} from "./firebase-setup-lib.mjs";
const config = {
  apiKey: "example-public-web-key",
  authDomain: "example-test.firebaseapp.com",
  projectId: "example-test",
  storageBucket: "example-test.firebasestorage.app",
  messagingSenderId: "123",
  appId: "1:123:web:abcdef",
};
test("checks identity before writing any configuration", () => {
  assert.equal(verifyProjectConfig(config, config), config);
  assert.throws(
    () =>
      verifyProjectConfig({ ...config, projectId: "wrong-project" }, config),
    /different project/,
  );
  assert.throws(
    () => verifyProjectConfig({ ...config, apiKey: "key\nOTHER=true" }, config),
    /invalid/,
  );
});
test("creates correct Vite environment names and turns emulators off", () => {
  const text = environmentText(config);
  for (const name of [
    "API_KEY",
    "AUTH_DOMAIN",
    "PROJECT_ID",
    "STORAGE_BUCKET",
    "MESSAGING_SENDER_ID",
    "APP_ID",
  ])
    assert.match(text, new RegExp("VITE_FIREBASE_" + name + "="));
  assert.match(text, /VITE_FIREBASE_ENABLED=true/);
  assert.match(text, /VITE_USE_EMULATORS=false/);
});
test("preserves unrelated settings and replaces managed keys idempotently", () => {
  const first = environmentText(
    config,
    "VITE_OTHER=keep\nVITE_FIREBASE_PROJECT_ID=old\nVITE_USE_EMULATORS=true\n",
  );
  assert.match(first, /VITE_OTHER=keep/);
  assert.equal(first.match(/VITE_FIREBASE_PROJECT_ID=/g).length, 1);
  assert.equal(environmentText(config, first), first);
});
test("writes the environment atomically to the selected checkout", async () => {
  const root = await mkdtemp(join(tmpdir(), "codovate-config-test-"));
  try {
    const file = await saveLocalConfig(root, config);
    assert.equal(await readFile(file, "utf8"), environmentText(config));
    await saveLocalConfig(root, config);
    assert.equal(await readFile(file, "utf8"), environmentText(config));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
