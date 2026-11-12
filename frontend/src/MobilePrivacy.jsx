import { useEffect, useState } from "react";
import {
  doc,
  onSnapshot,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";
export const mobileAudiences = {
  only_me: "Only me",
  none: "No one",
  everyone: "Everyone",
  connections: "My connections",
};
export function MobilePrivacy({ user, profile }) {
  const [audience, setAudience] = useState("only_me"),
    [mobile, setMobile] = useState(""),
    [ready, setReady] = useState(false),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  useEffect(() => {
    setMobile(
      String(profile?.mobile || "")
        .replace(/^\+91/, "")
        .replace(/\D/g, ""),
    );
  }, [profile?.mobile]);
  useEffect(() => {
    setReady(false);
    return onSnapshot(
      doc(db, "mobileSharing", user.uid),
      { includeMetadataChanges: true },
      (snapshot) => {
        if (snapshot.metadata.fromCache) {
          setReady(false);
          return;
        }
        setAudience(snapshot.exists() ? snapshot.data().visibility : "only_me");
        setReady(true);
      },
      () => {
        setReady(false);
        setMessage(
          "Could not load your mobile privacy settings. Please retry.",
        );
      },
    );
  }, [user.uid]);
  async function save(event) {
    event.preventDefault();
    if (!/^\d{10}$/.test(mobile)) {
      setMessage("Enter a 10-digit mobile number.");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      await runTransaction(db, async (tx) => {
        const ref = doc(db, "users", user.uid),
          current = await tx.get(ref);
        if (!current.exists()) throw new Error("missing profile");
        const number = "+91" + mobile;
        tx.update(ref, { mobile: number, updatedAt: serverTimestamp() });
        tx.set(doc(db, "mobileSharing", user.uid), {
          uid: user.uid,
          mobile: number,
          visibility: audience,
          updatedAt: serverTimestamp(),
        });
      });
      setMessage("Mobile number and visibility saved.");
    } catch {
      setMessage("Could not save your mobile privacy settings. Please retry.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="panel">
      <h2>Mobile number & privacy</h2>
      <form onSubmit={save}>
        <div className="form-grid">
          <label>
            Your mobile number (+91)
            <input
              type="tel"
              inputMode="numeric"
              autoComplete="tel-national"
              maxLength={10}
              value={mobile}
              onChange={(e) => setMobile(e.target.value.replace(/\D/g, ""))}
              required
            />
          </label>
          <label>
            Who can see your mobile number?
            <select
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              disabled={!ready}
            >
              {Object.entries(mobileAudiences).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <p className="hint">
          Only me is the default. No one hides your contact display; you can
          still edit it here. Everyone means signed-in Codovate members. My
          connections means accepted connections.
        </p>
        <button className="button" disabled={!ready || busy}>
          {busy ? "Saving…" : "Save mobile privacy"}
        </button>
        {message && <p role="status">{message}</p>}
      </form>
    </section>
  );
}
export function PeerMobile({ uid }) {
  const [open, setOpen] = useState(false),
    [state, setState] = useState({ mobile: "", loading: false });
  useEffect(() => {
    if (!open) return;
    setState({ mobile: "", loading: true });
    return onSnapshot(
      doc(db, "mobileSharing", uid),
      { includeMetadataChanges: true },
      (snapshot) => {
        setState({
          mobile:
            !snapshot.metadata.fromCache && snapshot.exists()
              ? snapshot.data().mobile
              : "",
          loading: snapshot.metadata.fromCache,
        });
      },
      () => setState({ mobile: "", loading: false }),
    );
  }, [open, uid]);
  return (
    <div>
      {!open ? (
        <button className="text-link" onClick={() => setOpen(true)}>
          View mobile number
        </button>
      ) : state.loading ? (
        <p className="hint">Checking mobile visibility…</p>
      ) : state.mobile ? (
        <a href={"tel:" + state.mobile}>{state.mobile}</a>
      ) : (
        <p className="hint">Mobile number is private or unavailable.</p>
      )}
    </div>
  );
}
