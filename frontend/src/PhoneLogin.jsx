import { useEffect, useRef, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { auth, configured } from "./firebase";
import { useSession } from "./session";
import { safeReturnPath, withTimeout } from "./authSupport";

export function fullName(value) {
  const normalized = value.trim().replace(/\s+/gu, " ");
  const parts = normalized.split(" ");
  if (normalized.length > 100 || parts.length < 2 ||
      parts.some(part => !/^[\p{L}\p{M}][\p{L}\p{M}'’.-]*$/u.test(part)))
    throw new Error("Enter your full name, including your first and last name.");
  return normalized;
}

export function phoneNumber(value) {
  const number = value.trim().replace(/[\s()-]/g, "");
  if (!/^\+[1-9]\d{7,14}$/.test(number))
    throw new Error("Enter a phone number with country code, for example +919876543210.");
  return number;
}
export function otpError(error) {
  const messages = {
    "auth/billing-not-enabled": "SMS login requires active billing on this Firebase project. Ask the administrator to check its Blaze billing account.",
    "auth/invalid-app-credential": "Firebase could not verify this website. Retry reCAPTCHA; if this continues, ask the administrator to check authorized domains and app verification settings.",
    "auth/missing-app-credential": "Website verification is missing. Reload this page and complete reCAPTCHA again.",
    "auth/app-not-authorized": "This website is not authorized to use Firebase Authentication. Ask the administrator to check the web app configuration and API key restrictions.",
    "auth/invalid-api-key": "Firebase Authentication configuration needs attention. Ask the administrator to check the web API key.",
    "auth/invalid-verification-code": "Incorrect code. Check the SMS and try again.",
    "auth/code-expired": "This code has expired. Request a new code.",
    "auth/session-expired": "This code has expired. Request a new code.",
    "auth/too-many-requests": "Too many attempts. Please wait before trying again.",
    "auth/quota-exceeded": "SMS delivery is temporarily unavailable. Use email or Google login.",
    "auth/operation-not-allowed": "Phone login is not enabled yet. Use email or Google login.",
    "auth/unauthorized-domain": "This website domain must be authorized in Firebase Authentication.",
    "auth/captcha-check-failed": "Verification failed. Please complete reCAPTCHA again.",
    "auth/invalid-phone-number": "Enter a valid phone number with country code.",
    "auth/network-request-failed": "Check your connection and try again.",
    "app/auth-timeout": "Verification could not be confirmed. Check your connection and retry.",
  };
  // Display only bounded SDK codes, never raw errors that may contain request data.
  const code = typeof error?.code === "string" && /^auth\/[a-z-]{1,64}$/.test(error.code)
    ? error.code : null;
  const message = messages[code || error?.code] || "Could not sign in. Please retry or use email or Google login.";
  return code ? `${message} (${code})` : message;
}

export function PhoneLogin() {
  const { user, loading, sessionError, createProfile, retrySession, logout } = useSession();
  const location = useLocation(), navigate = useNavigate();
  const destination = safeReturnPath(location.state?.from);
  const [number, setNumber] = useState("+91"), [name, setName] = useState("");
  const [confirmation, setConfirmation] = useState(null), [code, setCode] = useState("");
  const [busy, setBusy] = useState(false), [error, setError] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const captchaNode = useRef(null), verifier = useRef(null), mounted = useRef(false), pending = useRef(false);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; verifier.current?.clear(); verifier.current = null; };
  }, []);
  useEffect(() => {
    if (!cooldown) return;
    const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);
  async function send(event) {
    event.preventDefault();
    if (pending.current || cooldown || !configured) return;
    let address;
    try { fullName(name); address = phoneNumber(number); } catch (e) { setError(e.message); return; }
    pending.current = true; setBusy(true); setError("");
    // Invalidate the previous challenge before attempting another SMS.
    setConfirmation(null); setCode("");
    try {
      verifier.current?.clear();
      verifier.current = new RecaptchaVerifier(auth, captchaNode.current, { size: "normal" });
      const result = await signInWithPhoneNumber(auth, address, verifier.current);
      if (mounted.current) { setConfirmation(result); setNumber(address); setCooldown(60); }
    } catch (e) {
      if (mounted.current) setError(otpError(e));
    } finally {
      if (mounted.current) {
        verifier.current?.clear(); verifier.current = null;
        pending.current = false; setBusy(false);
      }
    }
  }
  async function verify(event) {
    event.preventDefault();
    if (pending.current || !confirmation) return;
    if (!/^\d{6}$/.test(code)) { setError("Enter the six-digit code from your SMS."); return; }
    let validatedName;
    try { validatedName = fullName(name); } catch (e) { setError(e.message); return; }
    pending.current = true; setBusy(true); setError("");
    let signedIn = false;
    try {
      const result = await withTimeout(confirmation.confirm(code), "app/auth-timeout", 25000);
      signedIn = true;
      await createProfile(result.user, validatedName);
      if (mounted.current) navigate(destination, { replace: true });
    } catch (e) {
      if (mounted.current) setError(signedIn ? "You're signed in, but your profile could not be loaded. Retry the account connection." : otpError(e));
    } finally {
      if (mounted.current) { pending.current = false; setBusy(false); }
    }
  }
  if (user && !busy && !sessionError && !error) return <Navigate to={destination} replace />;
  return <div className="auth-layout container">
    <div className="auth-story"><span className="eyebrow">YOUR NEXT CHAPTER</span><h1>A little ambition.<br /><em>A world of possibility.</em></h1><div className="auth-symbol" aria-hidden="true">✳</div><p>Where you study is just the beginning.</p></div>
    <div className="auth-card panel">
      <h2>Sign in with phone OTP.</h2>
      <p>We’ll send a verification code by SMS. A new number creates a student account. Existing email accounts stay separate unless linked through Firebase.</p>
      {!configured && <p role="alert">Firebase Authentication is not configured. <Link to="/setup">View setup</Link></p>}
      {error && <p className="notice error" role="alert">{error}</p>}
      {sessionError && !busy ? <div className="notice error" role="alert"><p>You're signed in, but the account connection needs attention.</p><button className="button secondary" onClick={() => { setError(""); retrySession(); }}>Retry account connection</button><button className="button secondary" onClick={() => logout().catch(() => setError("Could not sign out. Please retry."))}>Sign out</button></div> : <>
        <form onSubmit={send}>
          <label>Your full name<input name="name" placeholder="First and last name" autoComplete="name" required maxLength={100} value={name} disabled={busy || !!confirmation} onChange={e => setName(e.target.value)} /></label>
          <label>Phone number<input name="phone" type="tel" autoComplete="tel" required maxLength={24} value={number} disabled={busy || !!confirmation} onChange={e => setNumber(e.target.value)} /></label>
          <p className="hint">By requesting a code, you agree to receive a verification SMS. Carrier charges may apply. Google processes phone numbers for spam and abuse prevention.</p>
          <div ref={captchaNode} />
          <button className="button full" disabled={!configured || busy || cooldown > 0 || loading}>{busy ? "Please wait…" : cooldown ? `Resend in ${cooldown}s` : confirmation ? "Resend code" : "Send OTP"}</button>
        </form>
        {confirmation && <form onSubmit={verify}>
          <p role="status">Code sent to {number}.</p>
          <label>Verification code<input name="otp" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" required maxLength={6} value={code} disabled={busy} onChange={e => setCode(e.target.value)} /></label>
          <button className="button full" disabled={busy || !/^\d{6}$/.test(code)}>Verify and sign in</button>
          <button type="button" className="text-link" disabled={busy} onClick={() => { setConfirmation(null); setCode(""); setError(""); }}>Change phone number</button>
        </form>}
      </>}
      <p className="auth-switch"><Link to="/login" state={location.state}>Use email or Google instead</Link></p>
    </div>
  </div>;
}
