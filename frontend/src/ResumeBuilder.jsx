import { useState } from "react";
import { useSession } from "./session";
import {
  resumeTemplates,
  resumeFromProfile,
  resumeHtml,
} from "./resumeTemplates";
export function ResumeBuilder() {
  const { user, profile, loading } = useSession();
  if (loading) return <p role="status">Loading your profile…</p>;
  return (
    <Builder
      key={user?.uid || "guest"}
      initial={resumeFromProfile(profile, user?.email)}
    />
  );
}
function Builder({ initial }) {
  const [data, setData] = useState(initial),
    [template, setTemplate] = useState("student"),
    [message, setMessage] = useState("");
  function download(e) {
    e.preventDefault();
    const blob = new Blob([resumeHtml(data, template)], {
      type: "text/html;charset=utf-8",
    });
    const url = URL.createObjectURL(blob),
      a = document.createElement("a");
    a.href = url;
    a.download = "codovate-resume-" + template + ".html";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setMessage(
      "Résumé downloaded. Open the HTML file in your browser, review it, then Print → Save as PDF.",
    );
  }
  return (
    <>
      <div className="resource-grid">
        {resumeTemplates.map((t) => (
          <section className="panel resource-card" key={t.id}>
            <h2>{t.name}</h2>
            <p>{t.description}</p>
            <button
              className={"button " + (template === t.id ? "" : "secondary")}
              aria-pressed={template === t.id}
              onClick={() => setTemplate(t.id)}
            >
              Use {t.name.toLowerCase()}
            </button>
          </section>
        ))}
      </div>
      <form className="panel community-form" onSubmit={download}>
        <h2>Your résumé details</h2>
        <p>
          Your saved profile fills the initial fields when this page opens.
          Edits here stay in this tab until you download; they are not saved to
          Firebase.
        </p>
        <div className="form-grid">
          {[
            ["name", "Full name", 100],
            ["email", "Email", 320],
            ["phone", "Phone (optional)", 40],
            ["city", "Location (optional)", 100],
            ["portfolio", "Portfolio / LinkedIn (optional)", 500],
          ].map(([key, label, max]) => (
            <label key={key}>
              {label}
              <input
                name={key}
                type={key === "email" ? "email" : "text"}
                required={["name", "email"].includes(key)}
                maxLength={max}
                value={data[key]}
                onChange={(e) => setData({ ...data, [key]: e.target.value })}
              />
            </label>
          ))}
        </div>
        {[
          ["summary", "Profile summary", 1500],
          ["education", "Education", 2000],
          ["skills", "Skills", 1500],
          ["projects", "Projects — title, contribution and outcome", 4000],
          ["experience", "Internships / experience", 4000],
          ["achievements", "Achievements / certifications", 2000],
        ].map(([key, label, max]) => (
          <label key={key}>
            {label}
            <textarea
              rows={key === "projects" || key === "experience" ? 5 : 3}
              maxLength={max}
              value={data[key]}
              onChange={(e) => setData({ ...data, [key]: e.target.value })}
            />
          </label>
        ))}
        <button className="button">Download editable résumé</button>
        <p className="hint">
          Open the downloaded file and use Print → Save as PDF. Templates use
          simple text sections; no hiring or ATS-score guarantee.
        </p>
        {message && (
          <p role="status" className="notice success">
            {message}
          </p>
        )}
      </form>
    </>
  );
}
