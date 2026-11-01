export const SESSION_TIMEOUT_MS = 12000;
export function withTimeout(promise, code, timeoutMs = SESSION_TIMEOUT_MS) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(
      () =>
        reject(Object.assign(new Error("The request timed out."), { code })),
      timeoutMs,
    );
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}
export function sessionFailure(error, source) {
  return {
    code: error?.code || "app/session-error",
    message: error?.message || "The account could not be loaded.",
    source,
  };
}
export function safeReturnPath(value) {
  if (
    typeof value !== "string" ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.includes("\\") ||
    /[\r\n]/.test(value)
  )
    return "/dashboard";
  const path = value.split(/[?#]/)[0].replace(/\/+$/, "").toLowerCase();
  if (["/login", "/signup", "/register", "/forgot-password"].includes(path))
    return "/dashboard";
  return value;
}
