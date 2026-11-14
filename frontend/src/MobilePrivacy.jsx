import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "./firebase";
export const mobileAudiences = {
  only_me: "Only me",
  none: "No one",
  everyone: "Everyone",
  connections: "My connections",
};
export function mobileFormValues(mobile, visibility) {
  if (!Object.hasOwn(mobileAudiences, visibility))
    throw new Error("Wait for mobile privacy settings to load, then retry.");
  if (!/^[6-9]\d{9}$/.test(mobile || ""))
    throw new Error("Enter a 10-digit mobile number starting with 6, 7, 8 or 9.");
  return { mobile: "+91" + mobile, visibility };
}
export function MobilePrivacyFields({ user, profile }) {
  const [audience, setAudience] = useState("only_me"),
    [mobile, setMobile] = useState(""),
    [ready, setReady] = useState(false),
    [message, setMessage] = useState(""),
    [revision, retry] = useState(0);
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
        setMessage("");
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
  }, [user.uid, revision]);
  return (
    <>
      <label>
        Your mobile number (+91)
        <input
          name="mobile"
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          minLength={10}
          maxLength={10}
          pattern="[0-9]{10}"
          value={mobile}
          onChange={(e) => setMobile(e.target.value.replace(/\D/g, ""))}
          required
        />
      </label>
      <label>
        Who can see your mobile number?
        <select
          name="mobileVisibility"
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
      {message && (
        <p className="hint" role="alert">
          {message} <button type="button" className="text-link" onClick={()=>retry(v=>v+1)}>Retry privacy settings</button>
        </p>
      )}
    </>
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
