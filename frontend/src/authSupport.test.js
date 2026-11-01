import { describe, it, expect, vi, afterEach } from "vitest";
import { safeReturnPath, withTimeout } from "./authSupport";
afterEach(() => vi.useRealTimers());
describe("authentication redirects", () => {
  it("rejects external and authentication-loop destinations", () => {
    for (const value of [
      "https://example.com",
      "//example.com",
      "/login",
      "/LOGIN/",
      "/signup?next=x",
      "/\\example.com",
      "/dashboard\n",
    ])
      expect(safeReturnPath(value)).toBe("/dashboard");
  });
  it("preserves an internal opportunity destination", () =>
    expect(safeReturnPath("/opportunities/abc?ref=saved")).toBe(
      "/opportunities/abc?ref=saved",
    ));
});
describe("bounded requests", () => {
  it("fails a hung request with its specific stage code", async () => {
    vi.useFakeTimers();
    const pending = withTimeout(
      new Promise(() => {}),
      "app/profile-timeout",
      25,
    );
    const check = expect(pending).rejects.toMatchObject({
      code: "app/profile-timeout",
    });
    await vi.advanceTimersByTimeAsync(26);
    await check;
  });
  it("clears its timer when the request finishes", async () => {
    vi.useFakeTimers();
    await expect(
      withTimeout(Promise.resolve("ready"), "timeout"),
    ).resolves.toBe("ready");
    expect(vi.getTimerCount()).toBe(0);
  });
});
