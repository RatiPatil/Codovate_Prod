import { documentResumeTemplates, originalResumeUrl } from "./resumeTemplates";
export function ResumeBuilder() {
  return (
    <section aria-label="Word résumé templates">
      <p>
        Choose a Word template, preview the original document and download your
        own editable copy.
      </p>
      <div className="resource-grid resume-document-grid">
        {documentResumeTemplates.map((template) => (
          <article
            className="panel resource-card resume-document-card"
            key={template.id}
          >
            <iframe
              title={template.name + " template preview"}
              src={
                "https://drive.google.com/file/d/" +
                template.driveId +
                "/preview"
              }
              loading="lazy"
              referrerPolicy="no-referrer"
            />
            <span className="pill">
              {template.fileType} · {template.audience}
            </span>
            <h2>{template.name}</h2>
            <p>{template.description}</p>
            <div className="resume-document-actions">
              <a
                className="button secondary"
                href={originalResumeUrl(template)}
                target="_blank"
                rel="noopener noreferrer"
              >
                Open preview
              </a>
              <a
                className="button"
                href={originalResumeUrl(template, true)}
                target="_blank"
                rel="noopener noreferrer"
              >
                Download Word
              </a>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
