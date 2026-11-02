import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth, configured } from "./firebase";
import { withTimeout } from "./authSupport";
export function recoveryEmail(value) {
  const email = String(value || "").trim();
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    throw new Error("Enter a valid email address.");
  return email;
}
export function PasswordRecovery() {
  const loc = useLocation();
  const [email, setEmail] = useState(loc.state?.email || ""),
    [busy, setBusy] = useState(false),
    [cooldown, setCooldown] = useState(0),
    [message, setMessage] = useState(""),
    [error, setError] = useState("");
  useEffect(() => {
    if (!cooldown) return;
    const timer = setTimeout(() => setCooldown((n) => n - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);
  async function submit(e) {
    e.preventDefault();
    if (busy || cooldown) return;
    setError("");
    setMessage("");
    try {
      const address = recoveryEmail(email);
      if (!configured || !auth)
        throw new Error("Firebase Authentication is not configured.");
      setBusy(true);
      try {
        await withTimeout(
          sendPasswordResetEmail(auth, address, {
            url: window.location.origin + "/login",
          }),
          "app/auth-timeout",
          25000,
        );
      } catch (e) {
        if (e.code !== "auth/user-not-found") throw e;
      }
      setMessage(
        "If this email has an account, a secure, one-time password reset link has been requested. Check your inbox and spam folder.",
      );
      setCooldown(60);
    } catch (e) {
      setError(
        e.code === "auth/too-many-requests"
          ? "Too many attempts. Please wait and try again later."
          : e.code === "auth/unauthorized-continue-uri" ||
              e.code === "auth/invalid-continue-uri"
            ? "This website domain needs to be authorized in Firebase Authentication. Contact Codovate support."
            : e.code === "app/auth-timeout" ||
                e.code === "auth/network-request-failed"
              ? "The request could not be confirmed. Check your connection and try again."
              : e.message || "Could not request a reset link. Try again.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="container section">
      <section className="panel recovery-panel">
        <span className="eyebrow">ACCOUNT RECOVERY</span>
        <h1>Get back to your next step.</h1>
        <p>
          Enter your registered email. Firebase will send a secure password
          reset link.
        </p>
        <form onSubmit={submit}>
          <label>
            Email address
            <input
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              maxLength={254}
            />
          </label>
          {error && (
            <p role="alert" className="hub-error">
              {error}
            </p>
          )}
          {message && (
            <p role="status" className="hub-success">
              {message}
            </p>
          )}
          <button
            className="button full"
            disabled={!configured || busy || cooldown > 0}
          >
            {busy
              ? "Requesting link…"
              : cooldown
                ? `Resend in ${cooldown}s`
                : "Send reset link"}
          </button>
        </form>
        <p className="hint">
          Use the newest email and complete the reset before the link expires.
          If you normally use Google, you can continue with Google on the login
          page.
        </p>
        <Link className="text-link" to="/login" state={loc.state}>
          Back to login
        </Link>
      </section>
    </div>
  );
}
