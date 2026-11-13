import { useState, useRef } from "react";
import { useSession } from "./session";
import {
  resumeTemplates,
  resumeFromProfile,
  resumeHtml,
  originalResumeUrl,
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
  const editor = useRef(null);
  const selected = resumeTemplates.find((t) => t.id === template);
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
      <section className="panel">
        <h2>Choose your résumé template</h2>
        <p>
          Select a template to edit your details below. Eight supplied Word
          documents are available alongside three quick layouts.
        </p>
        <p className="hint">
          For the exact original design, download the Word document and edit it
          in Microsoft Word, LibreOffice or Google Docs. The editor below uses
          an adapted layout with the relevant sections.
        </p>
      </section>
      <div className="resource-grid">
        {resumeTemplates.map((t) => (
          <section className="panel resource-card" key={t.id}>
            <h2>{t.name}</h2>
            {t.fileType && (
              <span className="pill">
                {t.fileType} · {t.audience}
              </span>
            )}
            <p>{t.description}</p>
            <button
              className={"button " + (template === t.id ? "" : "secondary")}
              aria-pressed={template === t.id}
              onClick={() => {
                setTemplate(t.id);
                editor.current?.scrollIntoView?.({
                  behavior: "smooth",
                  block: "start",
                });
              }}
            >
              Use {t.name.toLowerCase()}
            </button>
          </section>
        ))}
      </div>
      <form ref={editor} className="panel community-form" onSubmit={download}>
        <h2>Your résumé details · {selected.name}</h2>
        {selected.driveId && (
          <div className="resume-source-actions">
            <a
              className="button secondary"
              href={originalResumeUrl(selected)}
              target="_blank"
              rel="noopener noreferrer"
            >
              Preview original
            </a>
            <a
              className="button secondary"
              href={originalResumeUrl(selected, true)}
              target="_blank"
              rel="noopener noreferrer"
            >
              Download editable Word ({selected.fileType})
            </a>
            <p className="hint">
              Replace all example names, contact details and work history with
              your own. For Google Docs, upload the downloaded file and open it
              with Google Docs to edit your copy.
            </p>
          </div>
        )}
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
          ["achievements", "Achievements & leadership", 2000],
          ["certifications", "Certifications — name, issuer and date", 2000],
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
        <details className="resume-section-guide">
          <summary>What should each résumé section include?</summary>
          <ul>
            <li>
              <strong>Contact:</strong> your name, professional email and
              relevant portfolio links.
            </li>
            <li>
              <strong>Summary:</strong> two or three lines about your strengths
              and target role.
            </li>
            <li>
              <strong>Education:</strong> qualification, institution and
              graduation year.
            </li>
            <li>
              <strong>Skills:</strong> capabilities you can demonstrate,
              tailored to the role.
            </li>
            <li>
              <strong>Projects:</strong> the problem, your contribution, tools
              and result.
            </li>
            <li>
              <strong>Experience:</strong> role, organization, dates and
              measurable achievements.
            </li>
            <li>
              <strong>Achievements and certifications:</strong> relevant awards,
              leadership and credentials.
            </li>
          </ul>
        </details>
        <details className="resume-preview">
          <summary>Preview your résumé</summary>
          <iframe
            title="Résumé preview"
            sandbox=""
            srcDoc={resumeHtml(data, template, false)}
          />
        </details>
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
