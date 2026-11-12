import { useEffect, useState } from "react";
import { collection, doc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "./firebase";
import {
  knownStudyFields,
  normalizeStudyField,
  studyFieldLabel,
} from "./studyFields";
export function approvedStudyFields(records = []) {
  const fields = new Map(knownStudyFields.map((code) => [code, true]));
  for (const record of records)
    if (typeof record.code === "string")
      fields.set(record.code, record.enabled === true);
  return [...fields]
    .filter(([, enabled]) => enabled)
    .map(([code]) => code)
    .sort((a, b) => studyFieldLabel(a).localeCompare(studyFieldLabel(b)));
}
export function useStudyFieldCatalog() {
  const [records, setRecords] = useState([]),
    [error, setError] = useState("");
  useEffect(() => {
    if (!db) return;
    return onSnapshot(
      collection(db, "studyFields"),
      (snapshot) => {
        setRecords(snapshot.docs.map((d) => d.data()));
        setError("");
      },
      () =>
        setError("Field of study settings could not be loaded. Please retry."),
    );
  }, []);
  return { records, fields: approvedStudyFields(records), error };
}
export function StudyFieldAdmin() {
  const { records, fields, error } = useStudyFieldCatalog();
  const [name, setName] = useState(""),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  async function save(code, enabled) {
    if (busy) return;
    if (
      code.length < 3 ||
      code.length > 180 ||
      !/^[\p{L}][\p{L}\p{N} &().,'/-]+$/u.test(code)
    ) {
      setMessage("Enter a valid academic field, between 3 and 180 characters.");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      await setDoc(doc(db, "studyFields", encodeURIComponent(code)), {
        code,
        enabled,
      });
      setName("");
      setMessage(
        enabled
          ? "Field approved."
          : "Field removed from student filter choices.",
      );
    } catch {
      setMessage(
        "Could not save the field. Check administrator access and retry.",
      );
    } finally {
      setBusy(false);
    }
  }
  const disabled = records.filter((r) => r.enabled === false);
  return (
    <section className="panel study-field-admin">
      <h2>Fields of study</h2>
      <p>
        Approve academic fields shown in the Teams filter. Student-entered
        values require approval before appearing here.
      </p>
      {error && <p role="alert">{error}</p>}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          save(normalizeStudyField(name), true);
        }}
      >
        <label>
          Full field of study name
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            minLength={3}
            maxLength={180}
            placeholder="Master of Computer Applications"
          />
        </label>
        <button className="button" disabled={busy}>
          Add approved field
        </button>
      </form>
      {message && <p role="status">{message}</p>}
      <ul>
        {fields.map((code) => (
          <li key={code}>
            {studyFieldLabel(code)}{" "}
            <button
              className="text-link"
              disabled={busy}
              onClick={() => save(code, false)}
            >
              Remove
            </button>
          </li>
        ))}
      </ul>
      {disabled.length > 0 && (
        <details>
          <summary>Removed fields</summary>
          <ul>
            {disabled.map(({ code }) => (
              <li key={code}>
                {studyFieldLabel(code)}{" "}
                <button
                  className="text-link"
                  disabled={busy}
                  onClick={() => save(code, true)}
                >
                  Restore
                </button>
              </li>
            ))}
          </ul>
        </details>
      )}
    </section>
  );
}
