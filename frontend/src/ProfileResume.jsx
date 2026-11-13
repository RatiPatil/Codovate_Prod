import { useEffect, useRef, useState } from "react";
import { Upload, ArrowUpRight, Check } from "lucide-react";
import { saveResume, resumeDownloadUrl, resumeError } from "./resumeData";
export default function ProfileResume({ user, profile }) {
  const [mode, setMode] = useState(profile?.resumeUrl ? "link" : "pdf"),
    [file, setFile] = useState(null),
    [url, setUrl] = useState(profile?.resumeUrl || "");
  const [busy, setBusy] = useState(false),
    [opening, setOpening] = useState(false),
    [progress, setProgress] = useState(0),
    [error, setError] = useState(""),
    [message, setMessage] = useState("");
  const input = useRef(null),
    locked = useRef(false),
    dirty = useRef(false);
  useEffect(() => {
    if (!dirty.current) setUrl(profile?.resumeUrl || "");
  }, [profile?.resumeUrl]);
  async function save(e) {
    e.preventDefault();
    if (locked.current) return;
    locked.current = true;
    setBusy(true);
    setError("");
    setMessage("");
    setProgress(0);
    try {
      const result = await saveResume(
        user.uid,
        { mode, file, url },
        setProgress,
      );
      dirty.current = false;
      setUrl(result.resumeUrl);
      setFile(null);
      if (input.current) input.current.value = "";
      setMessage(
        mode === "pdf"
          ? "Your PDF résumé has been uploaded and saved to your profile."
          : "Your résumé link has been saved to your profile.",
      );
    } catch (e) {
      setError(resumeError(e));
    } finally {
      locked.current = false;
      setBusy(false);
    }
  }
  async function open() {
    setError("");
    setOpening(true);
    const popup = window.open("about:blank", "_blank");
    if (popup) popup.opener = null;
    try {
      const link = await resumeDownloadUrl(profile);
      if (!popup)
        throw new Error(
          "Allow pop-ups to view your saved résumé, then try again.",
        );
      popup.location.href = link;
    } catch (e) {
      popup?.close();
      setError(resumeError(e));
    } finally {
      setOpening(false);
    }
  }
  return (
    <section className="panel profile-resume" aria-label="Your résumé">
      <h2>Your résumé</h2>
      <p className="hint">
        Save your résumé separately from your profile details. It stays private
        to you and authorized application reviewers.
      </p>
      {(profile?.resumePath || profile?.resumeUrl) && (
        <div className="resume-saved-state">
          <Check size={16} />
          <span>
            {profile.resumeUrl ? "Saved résumé link" : "Saved PDF résumé"}
          </span>
          <button
            type="button"
            className="text-link"
            onClick={open}
            disabled={opening || busy}
          >
            {opening ? "Opening…" : "View current résumé"}
            <ArrowUpRight size={15} />
          </button>
        </div>
      )}
      <form onSubmit={save}>
        <fieldset disabled={busy}>
          <legend>Choose how to add your résumé</legend>
          <div className="type-tabs">
            <button
              type="button"
              aria-pressed={mode === "pdf"}
              className={mode === "pdf" ? "active" : ""}
              onClick={() => {
                setMode("pdf");
                setError("");
                setMessage("");
              }}
            >
              Upload PDF
            </button>
            <button
              type="button"
              aria-pressed={mode === "link"}
              className={mode === "link" ? "active" : ""}
              onClick={() => {
                setMode("link");
                setError("");
                setMessage("");
              }}
            >
              Use résumé link
            </button>
          </div>
          {mode === "pdf" ? (
            <>
              <label className="upload-zone">
                <Upload size={22} />
                <span>
                  {file
                    ? file.name
                    : profile?.resumePath
                      ? "Choose a replacement PDF"
                      : "Choose your résumé PDF"}
                </span>
                <input
                  ref={input}
                  type="file"
                  name="resume"
                  aria-label="Résumé PDF"
                  accept="application/pdf,.pdf"
                  onChange={(e) => {
                    setFile(e.target.files?.[0] || null);
                    setMessage("");
                  }}
                />
              </label>
              <p className="hint">
                PDF only, up to 5 MB. Select a file, then click Save résumé.
                Saving a PDF replaces any previous résumé link.
              </p>
              {file && (
                <button
                  type="button"
                  className="text-link"
                  onClick={() => {
                    setFile(null);
                    if (input.current) input.current.value = "";
                  }}
                >
                  Clear selected PDF
                </button>
              )}
              {busy && (
                <>
                  <progress
                    aria-label="Résumé upload progress"
                    value={progress}
                    max={100}
                  />
                  <p className="hint">
                    {progress < 100
                      ? `Uploading PDF · ${progress}%`
                      : "Upload complete · saving to your profile…"}
                  </p>
                </>
              )}
            </>
          ) : (
            <>
              <label>
                HTTPS résumé link
                <input
                  type="url"
                  pattern="https://.*"
                  maxLength={500}
                  required
                  value={url}
                  onChange={(e) => {
                    dirty.current = true;
                    setUrl(e.target.value);
                    setMessage("");
                  }}
                  placeholder="https://…"
                />
              </label>
              <p className="hint">
                Use a résumé link from your file provider and allow reviewers to
                open it. Saving a link does not require Firebase Storage.
              </p>
            </>
          )}
          <button className="button" disabled={mode === "pdf" && !file}>
            {busy ? "Saving résumé…" : "Save résumé"}
            <Check size={16} />
          </button>
        </fieldset>
      </form>
      {error && (
        <p className="notice" role="alert">
          {error}
        </p>
      )}
      {message && (
        <p className="notice success" role="status">
          {message}
        </p>
      )}
    </section>
  );
}
