import { useState } from "react";
import { ShieldCheck, Users, ExternalLink, Copy, Activity } from "lucide-react";
import {
  collection,
  query,
  limit,
  getDocsFromServer,
} from "firebase/firestore";
import { auth, db, configured } from "./firebase";
import { useSession } from "./session";
import { withTimeout } from "./authSupport";
const project = () => auth?.app?.options?.projectId || "codovate-dev";
const consoleUrl = (path) =>
  "https://console.firebase.google.com/project/" +
  encodeURIComponent(project()) +
  "/" +
  path;
export function AdminAccounts() {
  const { user, admin } = useSession();
  const [uid, setUid] = useState(""),
    [action, setAction] = useState("grant"),
    [message, setMessage] = useState("");
  if (!admin) return <p role="alert">Administrator access required.</p>;
  const valid = /^[a-zA-Z0-9_-]{1,128}$/.test(uid.trim()),
    self = uid.trim() === user?.uid;
  const command =
    valid && !self
      ? "node scripts/set-admin.mjs " +
        project() +
        ' "' +
        uid.trim() +
        '" ' +
        action
      : "";
  async function copy() {
    try {
      await navigator.clipboard.writeText(command);
      setMessage(
        "Command copied. Review and run it in your trusted terminal. No account access has changed yet.",
      );
    } catch {
      setMessage(
        "Copy unavailable. Select the command below and copy it manually.",
      );
    }
  }
  return (
    <div className="admin-operations">
      <section className="panel admin-operations-hero">
        <div className="admin-section-icon">
          <Users size={24} />
        </div>
        <div>
          <h2>User accounts & access</h2>
          <p>
            Manage account status in Firebase Authentication and assign
            administrator access with the trusted operator tool.
          </p>
          <a
            className="button"
            href={consoleUrl("authentication/users")}
            target="_blank"
            rel="noopener noreferrer"
          >
            Open user management <ExternalLink size={16} />
          </a>
        </div>
      </section>
      <div className="admin-operation-grid">
        <section className="panel">
          <h3>Account directory</h3>
          <p>
            Find registered users, check their sign-in providers and review
            account status in Firebase Authentication.
          </p>
          <a
            className="text-link"
            href={consoleUrl("authentication/users")}
            target="_blank"
            rel="noopener noreferrer"
          >
            View registered accounts ↗
          </a>
        </section>
        <section className="panel">
          <h3>Enable or suspend login</h3>
          <p>
            Open a user in Firebase Authentication and use the account controls
            to enable or disable sign-in. Disabling an account preserves its
            stored records.
          </p>
          <a
            className="text-link"
            href={consoleUrl("authentication/users")}
            target="_blank"
            rel="noopener noreferrer"
          >
            Manage account status ↗
          </a>
        </section>
        <section className="panel">
          <h3>Authentication settings</h3>
          <p>
            Manage Google and email/password sign-in settings and authorized
            domains in the Firebase project.
          </p>
          <a
            className="text-link"
            href={consoleUrl("authentication/providers")}
            target="_blank"
            rel="noopener noreferrer"
          >
            Open authentication settings ↗
          </a>
        </section>
      </div>
      <section className="panel admin-role-tool">
        <h3>
          <ShieldCheck size={20} /> Administrator access
        </h3>
        <p>
          Copy a verified user’s UID from Firebase Authentication, choose the
          access change, then run the generated command in your authenticated
          terminal.
        </p>
        <div className="form-grid">
          <label>
            Target user UID
            <input
              value={uid}
              maxLength={128}
              onChange={(e) => {
                setUid(e.target.value);
                setMessage("");
              }}
              placeholder="Paste the exact Firebase user UID"
            />
          </label>
          <label>
            Access change
            <select
              value={action}
              onChange={(e) => {
                setAction(e.target.value);
                setMessage("");
              }}
            >
              <option value="grant">Grant administrator access</option>
              <option value="revoke">Revoke administrator access</option>
            </select>
          </label>
        </div>
        {uid && !valid && (
          <p role="alert">
            Use the exact UID containing letters, numbers, underscores or
            hyphens.
          </p>
        )}
        {self && (
          <p role="alert">
            This is your current account. Use a different administrator account
            for access changes to avoid locking yourself out.
          </p>
        )}
        {command && (
          <>
            <pre className="admin-command">{command}</pre>
            <button className="button secondary" onClick={copy}>
              <Copy size={16} />
              Copy access command
            </button>
          </>
        )}
        {message && <p role="status">{message}</p>}
        <p className="hint">
          Copying the command does not execute it. The account must sign out and
          sign in after the command succeeds.
        </p>
      </section>
      <section className="panel admin-own-account">
        <h3>Your administrator account</h3>
        <dl>
          <div>
            <dt>Account</dt>
            <dd>{user?.email || "Signed-in administrator"}</dd>
          </div>
          <div>
            <dt>User UID</dt>
            <dd>{user?.uid}</dd>
          </div>
          <div>
            <dt>Access</dt>
            <dd>Verified administrator</dd>
          </div>
        </dl>
      </section>
      <p className="admin-operation-note">
        This no-billing setup uses Firebase Console for login-account
        operations. The website does not list other students’ private contact
        details or learning notes.
      </p>
    </div>
  );
}
export function AdminSystem() {
  const { admin } = useSession();
  const [busy, setBusy] = useState(false),
    [status, setStatus] = useState(""),
    [error, setError] = useState("");
  if (!admin) return <p role="alert">Administrator access required.</p>;
  async function check() {
    if (!db || busy) return;
    setBusy(true);
    setStatus("");
    setError("");
    try {
      await withTimeout(
        getDocsFromServer(query(collection(db, "opportunities"), limit(1))),
        "admin/check-timeout",
      );
      setStatus("Live Firestore read succeeded.");
    } catch {
      setError(
        "Firestore could not be reached. Check your connection, account access and deployed rules.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="admin-operations">
      <section className="panel">
        <h2>Platform configuration</h2>
        <dl className="admin-system-details">
          <div>
            <dt>Firebase project</dt>
            <dd>{project()}</dd>
          </div>
          <div>
            <dt>Web configuration</dt>
            <dd>{configured ? "Configuration present" : "Not configured"}</dd>
          </div>
          <div>
            <dt>User management</dt>
            <dd>Firebase Console and trusted operator tools</dd>
          </div>
          <div>
            <dt>Database</dt>
            <dd>Cloud Firestore</dd>
          </div>
        </dl>
        <a
          className="button secondary"
          href={consoleUrl("overview")}
          target="_blank"
          rel="noopener noreferrer"
        >
          Open Firebase project <ExternalLink size={16} />
        </a>
      </section>
      <section className="panel">
        <h3>
          <Activity size={20} /> Connection check
        </h3>
        <p>
          Run a live read to verify database connectivity. Configuration alone
          does not prove the service is reachable.
        </p>
        <button className="button" disabled={!db || busy} onClick={check}>
          {busy ? "Checking…" : "Check Firestore connection"}
        </button>
        {status && <p role="status">{status}</p>}
        {error && <p role="alert">{error}</p>}
      </section>
    </div>
  );
}
