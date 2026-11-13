import { useEffect, useState } from "react";
import {
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";
import { configured, db } from "./firebase";
import {
  libraryRows,
  filterLibrary,
  projectSections,
  projectSourceLabels,
} from "./projectLibraryData";
export function ProjectLibrary({ manage = false }) {
  const [stored, setStored] = useState([]),
    [search, setSearch] = useState(""),
    [section, setSection] = useState(""),
    [kind, setKind] = useState(""),
    [shown, setShown] = useState(12),
    [error, setError] = useState(""),
    [busy, setBusy] = useState("");
  useEffect(() => {
    if (!configured || !db) return;
    return onSnapshot(
      query(collection(db, "projectLibrary"), orderBy("sortOrder"), limit(500)),
      (snapshot) => {
        setStored(snapshot.docs.map((d) => ({ ...d.data(), id: d.id })));
        setError("");
      },
      () =>
        setError(
          "The saved project library could not be loaded. Please refresh to retry.",
        ),
    );
  }, []);
  const rows = filterLibrary(libraryRows(stored, manage), {
    search,
    section,
    kind,
  });
  async function toggle(row) {
    if (busy) return;
    setBusy(row.id);
    setError("");
    try {
      await runTransaction(db, async (tx) => {
        const ref = doc(db, "projectLibrary", row.id),
          current = await tx.get(ref);
        tx.set(ref, {
          ...row,
          status: row.status === "published" ? "hidden" : "published",
          createdAt: current.exists()
            ? current.data().createdAt
            : serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      });
    } catch {
      setError(
        "Could not change this project. Check administrator access and retry.",
      );
    } finally {
      setBusy("");
    }
  }
  return (
    <section
      className="project-reference-library"
      aria-label="Final-year project library"
    >
      <header className="panel">
        <span className="eyebrow">EXPLORE · LEARN · BUILD</span>
        <h2>Final-year project library</h2>
        <p>
          Explore practice projects and ideas by technology. Start with a
          reference, understand the approach and build your own solution to a
          real problem.
        </p>
        <p className="hint">
          Repository links, collections and articles are labelled separately.
          “Idea only” means the document did not provide a source link. Starting
          points are suggested learning areas.
        </p>
      </header>
      <div className="project-library-filters">
        <label>
          Search project library
          <input
            type="search"
            placeholder="Project name, technology or idea"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setShown(12);
            }}
          />
        </label>
        <label>
          Technology / domain
          <select
            value={section}
            onChange={(e) => {
              setSection(e.target.value);
              setShown(12);
            }}
          >
            <option value="">All technologies</option>
            {projectSections.map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </label>
        <label>
          Reference type
          <select
            value={kind}
            onChange={(e) => {
              setKind(e.target.value);
              setShown(12);
            }}
          >
            <option value="">All reference types</option>
            {Object.entries(projectSourceLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>
      {(search || section || kind) && (
        <button
          className="text-link"
          onClick={() => {
            setSearch("");
            setSection("");
            setKind("");
            setShown(12);
          }}
        >
          Clear library filters
        </button>
      )}
      {error && <p role="alert">{error}</p>}
      <p role="status">
        {error ? "Library unavailable" : `${rows.length} projects and ideas`}
      </p>
      {!error && (
        <div className="project-grid">
          {rows.slice(0, shown).map((row) => (
            <article className="panel project-reference-card" key={row.id}>
              <div className="skill-row">
                <span>{row.section}</span>
                <span>{projectSourceLabels[row.sourceKind]}</span>
                {manage && row.status === "hidden" && <span>Hidden</span>}
              </div>
              <h3>{row.title}</h3>
              <p>{row.summary}</p>
              <details>
                <summary>Starting points</summary>
                <div className="skill-row">
                  {row.skills.map((skill) => (
                    <span key={skill}>{skill}</span>
                  ))}
                </div>
                <p className="hint">
                  Define a small scope, read the reference, build your own
                  version and document your tests and results.
                </p>
              </details>
              {row.notice && <p className="notice">{row.notice}</p>}
              <div className="project-reference-actions">
                {row.sourceUrl ? (
                  <a
                    className="button secondary"
                    href={row.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {row.sourceKind === "repository"
                      ? "View source"
                      : row.sourceKind === "collection"
                        ? "Browse collection"
                        : "Read reference"}
                  </a>
                ) : (
                  <p className="hint">No source link supplied</p>
                )}
                {manage && (
                  <button
                    className="text-link"
                    disabled={!!busy || !configured}
                    onClick={() => toggle(row)}
                  >
                    {row.status === "hidden" ? "Restore" : "Hide"}
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
      {!error && rows.length > shown && (
        <div className="project-library-pagination">
          <button
            className="button primary"
            onClick={() => setShown((value) => value + 12)}
          >
            Show more projects
          </button>
        </div>
      )}
      {!error && !rows.length && (
        <p>
          No projects match these filters. Try another technology or search.
        </p>
      )}
    </section>
  );
}
