import {
  knownStudyFields,
  normalizeStudyField,
  studyFieldLabel,
} from "./studyFields";
import {
  GraduationCap,
  MapPin,
  Handshake,
  X,
  SlidersHorizontal,
  ArrowDownWideNarrow,
  Bookmark,
  BookmarkCheck,
} from "lucide-react";
import { visibleSkills } from "./profileSkills";
import { useEffect, useState, useRef } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "./firebase";
import { useTeamFeed, connectMember } from "./teamHubData";
import {
  approvedAvatar,
  discoveryDraft,
  domains,
  experienceLevels,
  seekingOptions,
  passionOptions,
  emptyDetails,
  saveDiscovery,
  dismissPeer,
  savePeer,
  discoverPeers,
} from "./discoveryData";
function PeerAvatar({ name, photoUrl }) {
  const [failed, setFailed] = useState("");
  const url = approvedAvatar(photoUrl);
  return url && failed !== url ? (
    <img
      src={url}
      referrerPolicy="no-referrer"
      alt={`${name} profile photo`}
      loading="lazy"
      width={64}
      height={64}
      onError={() => setFailed(url)}
    />
  ) : (
    <div className="hub-avatar" aria-hidden="true">
      {String(name || "Student")
        .split(" ")
        .filter(Boolean)
        .map((v) => v[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()}
    </div>
  );
}
function PeerTags({ values = [], label }) {
  const [expanded, setExpanded] = useState(false);
  if (!values.length) return null;
  const shown = expanded ? values : values.slice(0, 3);
  return (
    <div className="skill-row peer-tags" aria-label={label}>
      {shown.map((value) => (
        <span key={value}>{value}</span>
      ))}
      {values.length > 3 && (
        <button
          type="button"
          className="peer-tag-toggle"
          aria-expanded={expanded}
          aria-label={`${expanded ? "Show fewer" : "Show all"} ${label.toLowerCase()}`}
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? "Show less" : `+${values.length - 3} more`}
        </button>
      )}
    </div>
  );
}

export function PeerDiscovery({
  user,
  profile,
  people,
  connections,
  city = "",
  onCityChange = () => {},
  onClearDirectoryFilters,
  fieldOfStudy = "",
  onStudyChange = () => {},
  connectionsReady = true,
  connectionsError = "",
  myPublic,
  act,
  busy,
  suggested = false,
  loadMore,
  canLoadMore,
}) {
  const [savedOnly, setSavedOnly] = useState(false);
  const shortlist = useTeamFeed(
    "teammateShortlists/" + user.uid + "/members",
    user.uid,
    [["saved", "==", true]],
    1968,
  );
  const savedIds = new Set(shortlist.items.map((item) => item.peerId));
  const [sort, setSort] = useState(suggested ? "recommended" : "name");
  const [search, setSearch] = useState(""),
    [skill, setSkill] = useState(""),
    [domain, setDomain] = useState(""),
    [experience, setExperience] = useState(""),
    [draft, setDraft] = useState(emptyDetails),
    [share, setShare] = useState(false),
    [saved, setSaved] = useState(emptyDetails),
    [prefError, setPrefError] = useState(""),
    [prefReady, setPrefReady] = useState(false);
  const savedSignature = useRef("");
  const dismissed = useTeamFeed(
    "discoveryDismissals/" + user.uid + "/members",
    user.uid,
    [["dismissed", "==", true]],
    1000,
  );
  useEffect(() => {
    setPrefReady(false);
    savedSignature.current = "";
    if (!db) return;
    return onSnapshot(
      doc(db, "discoveryPreferences", user.uid),
      { includeMetadataChanges: true },
      (s) => {
        if (!s.exists() && s.metadata.fromCache) {
          setPrefReady(false);
          return;
        }
        setPrefReady(true);
        const d = discoveryDraft(profile, user, s.data()?.details);
        const shared = !!s.data()?.shareDetails;
        const signature = JSON.stringify([d, shared]);
        if (signature !== savedSignature.current) {
          savedSignature.current = signature;
          setDraft(d);
          setSaved(d);
          setShare(shared);
        }
        setPrefError("");
      },
      () => {
        setPrefReady(false);
        setPrefError("Your saved discovery preferences could not be loaded.");
      },
    );
  }, [user.uid]);
  const candidates = discoverPeers(people.items, {
    uid: user.uid,
    search,
    skill,
    domain,
    fieldOfStudy,
    experience,
    dismissed: dismissed.items.map((x) => x.peerId),
    blocked: connections
      .filter((c) => c.status === "blocked")
      .map((c) => (c.fromId === user.uid ? c.toId : c.fromId)),
    suggested,
    mine: { skills: profile?.skills || [], details: saved },
  });
  const items = savedOnly
    ? candidates.filter((p) => savedIds.has(p.uid))
    : candidates;
  const sortedItems = [...items].sort((a, b) =>
    sort === "name"
      ? a.name.localeCompare(b.name)
      : sort === "skills"
        ? visibleSkills(b).length - visibleSkills(a).length ||
          a.name.localeCompare(b.name)
        : suggested
          ? b.match.score - a.match.score || a.name.localeCompare(b.name)
          : a.name.localeCompare(b.name),
  );
  const studyOptions = [
    ...new Set([
      ...knownStudyFields,
      ...people.items.map((person) =>
        normalizeStudyField(person.details?.fieldOfStudy),
      ),
      fieldOfStudy,
    ]),
  ]
    .filter(
      (value) =>
        value &&
        !["OTHER", "UNKNOWN", "NONE", "N/A", "NOT SPECIFIED"].includes(value) &&
        /\p{L}.*\p{L}/u.test(value),
    )
    .sort((a, b) => studyFieldLabel(a).localeCompare(studyFieldLabel(b)));
  const update = (key, value) => setDraft((d) => ({ ...d, [key]: value }));
  return (
    <>
      <details className="panel discovery-settings">
        <summary>Discovery profile settings</summary>
        <p>
          Choose what appears on your card. Your email, phone and résumé always
          stay private.
        </p>
        <form
          className="discovery-form"
          onSubmit={(e) => {
            e.preventDefault();
            act(
              () => saveDiscovery(user, profile, draft, share),
              "Discovery preferences saved.",
            );
          }}
        >
          {[
            ["desiredRole", "Desired role", 100],
            ["college", "College", 180],
            ["degree", "Course / degree", 100],
            ["year", "Year of study", 40],
            ["location", "Location", 100],
            ["photoUrl", "Google or GitHub avatar link", 500],
          ].map(([key, label, max]) => (
            <label key={key}>
              {label}
              <input
                value={draft[key]}
                maxLength={max}
                onChange={(e) => update(key, e.target.value)}
                type={key === "photoUrl" ? "url" : "text"}
              />
            </label>
          ))}
          <label>
            Domain / goal
            <select
              value={draft.domain}
              onChange={(e) => update("domain", e.target.value)}
            >
              <option value="">Not specified</option>
              {domains.map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </label>
          <label>
            Experience level
            <select
              value={draft.experience}
              onChange={(e) => update("experience", e.target.value)}
            >
              <option value="">Not specified</option>
              {experienceLevels.map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </label>
          <label>
            Achievements (self-reported, comma separated)
            <input
              value={
                Array.isArray(draft.achievements)
                  ? draft.achievements.join(", ")
                  : draft.achievements
              }
              onChange={(e) => update("achievements", e.target.value)}
              maxLength={365}
            />
          </label>
          {[
            ["seeking", "Seeking", seekingOptions],
            ["passions", "Passionate about", passionOptions],
          ].map(([key, label, options]) => (
            <fieldset key={key}>
              <legend>{label}</legend>
              {options.map((v) => (
                <label className="hub-check" key={v}>
                  <input
                    type="checkbox"
                    checked={draft[key].includes(v)}
                    onChange={(e) =>
                      update(
                        key,
                        e.target.checked
                          ? [...draft[key], v]
                          : draft[key].filter((x) => x !== v),
                      )
                    }
                  />
                  {v}
                </label>
              ))}
            </fieldset>
          ))}
          <label className="hub-check">
            <input
              type="checkbox"
              checked={share}
              onChange={(e) => setShare(e.target.checked)}
            />
            Share these optional details on my discovery card
          </label>
          <button className="button" disabled={busy || !db || !prefReady}>
            Save discovery profile
          </button>
        </form>
        {prefError && <p role="alert">{prefError}</p>}
      </details>
      {suggested && (
        <p>
          These teammates are recommended based on your skills, career goals,
          and experience level.
        </p>
      )}
      <section
        className="panel discovery-search"
        aria-label="Find teammates filters"
      >
        <header className="hub-section-heading discovery-filter-heading">
          <h2>
            <SlidersHorizontal size={17} aria-hidden="true" /> Refine your
            search
          </h2>
          <span className="hint">
            Find complementary skills and shared goals
          </span>
        </header>
        <div className="discovery-filters">
          <label className="discovery-name-search">
            Search students
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Name or desired role"
            />
          </label>
          <label>
            Skill
            <input
              value={skill}
              onChange={(e) => setSkill(e.target.value)}
              placeholder="React, Java, Python, ML"
            />
          </label>
          <label>
            Field of study
            <select
              aria-label="Filter by field of study"
              value={fieldOfStudy}
              onChange={(event) => onStudyChange(event.target.value)}
            >
              <option value="">All fields of study</option>
              {studyOptions.map((field) => (
                <option key={field} value={field}>
                  {studyFieldLabel(field)}
                </option>
              ))}
            </select>
          </label>
          <label>
            City
            <input
              aria-label="Filter by city"
              key={city}
              defaultValue={city}
              placeholder="Enter the city shown on a student card"
              maxLength={120}
              onBlur={(event) => onCityChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  onCityChange(event.currentTarget.value);
                }
              }}
            />
            <small className="hint">
              Press Enter to search the saved city across all profiles.
            </small>
          </label>
          <label>
            Domain / goal
            <select
              aria-label="Filter by domain or goal"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
            >
              <option value="">All domains</option>
              {domains.map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </label>
          <label>
            Experience level
            <select
              aria-label="Filter by experience level"
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
            >
              <option value="">All levels</option>
              {experienceLevels.map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </label>
        </div>
        {(search || skill || domain || experience || fieldOfStudy || city) && (
          <button
            className="text-link"
            onClick={() => {
              setSearch("");
              setSkill("");
              setDomain("");
              setExperience("");
              if (onClearDirectoryFilters) onClearDirectoryFilters();
              else {
                onStudyChange("");
                onCityChange("");
              }
            }}
          >
            Clear filters
          </button>
        )}
        <p className="hint">
          Separate skills with commas to match all selected skills.
        </p>
      </section>
      <div
        className="peer-browse-switch"
        role="group"
        aria-label="Student directory view"
      >
        <button
          className={!savedOnly ? "active" : ""}
          aria-pressed={!savedOnly}
          onClick={() => setSavedOnly(false)}
        >
          All teammates
        </button>
        <button
          className={savedOnly ? "active" : ""}
          aria-pressed={savedOnly}
          onClick={() => setSavedOnly(true)}
        >
          <Bookmark size={15} aria-hidden="true" />
          Saved teammates
          {!shortlist.loading && !shortlist.error
            ? ` (${shortlist.items.length})`
            : ""}
        </button>
      </div>
      {shortlist.error && (
        <p role="alert" className="hub-error">
          {shortlist.error}
        </p>
      )}
      <div className="discovery-results-heading">
        <div>
          <span className="eyebrow">
            {suggested ? "MATCHED TO YOUR GOALS" : "THE STUDENT COMMUNITY"}
          </span>
          <h2>
            {suggested
              ? "People you could build with"
              : "Meet your next teammate"}
          </h2>
          <p className="hint" role="status">
            {people.loading ||
            dismissed.loading ||
            (savedOnly && shortlist.loading)
              ? "Finding students…"
              : `${items.length} matching students in loaded profiles`}
          </p>
        </div>
        <label className="discovery-sort">
          <ArrowDownWideNarrow size={16} aria-hidden="true" />
          <span className="sr-only">Sort students</span>
          <select
            aria-label="Sort students"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            {suggested && <option value="recommended">Best match</option>}
            <option value="name">Name A–Z</option>
            <option value="skills">Most listed skills</option>
          </select>
        </label>
      </div>
      {(people.error ||
        dismissed.error ||
        connectionsError ||
        (suggested && prefError)) && (
        <p role="alert" className="hub-error">
          {people.error || dismissed.error || connectionsError || prefError}
        </p>
      )}
      {(people.loading ||
        dismissed.loading ||
        (savedOnly && shortlist.loading) ||
        (suggested && !prefReady)) && (
        <div
          role="status"
          aria-label="Loading student profiles"
          className="hub-people"
        >
          <span className="sr-only">Loading discovery…</span>
          {[0, 1, 2, 3].map((n) => (
            <div className="panel peer-skeleton" aria-hidden="true" key={n}>
              <i />
              <b />
              <b />
              <b />
            </div>
          ))}
        </div>
      )}
      {!people.loading &&
        !(savedOnly && (shortlist.loading || shortlist.error)) &&
        !dismissed.loading &&
        !people.error &&
        !dismissed.error &&
        (!suggested || prefReady) &&
        !items.length && (
          <section className="panel">
            <h3>
              {savedOnly
                ? "No saved teammates match your filters."
                : "No teammates found matching your criteria."}
            </h3>
            <p>
              {suggested
                ? "Save your goals and add confirmed skills to get explainable suggestions. Try Find Teammates to browse everyone who has opted in."
                : "Try different filters or load more profiles. Only students who choose discovery appear here."}
            </p>
            {suggested && (
              <a className="button secondary" href="/teams?hub=people">
                Browse all students
              </a>
            )}
          </section>
        )}
      <div className="hub-people">
        {!(savedOnly && (shortlist.loading || shortlist.error)) &&
          !dismissed.error &&
          !dismissed.loading &&
          (!suggested || prefReady) &&
          sortedItems.map((p, index) => {
            const d = p.details || {},
              relation = connections.find((c) =>
                [c.fromId, c.toId].includes(p.uid),
              );
            return (
              <article
                className="panel peer-card"
                key={p.uid}
                style={{ "--peer-order": index % 6 }}
              >
                <div className="peer-card-accent" aria-hidden="true" />
                <button
                  className={`peer-save ${savedIds.has(p.uid) ? "saved" : ""}`}
                  aria-label={`${savedIds.has(p.uid) ? "Unsave" : "Save"} ${p.name}`}
                  aria-pressed={savedIds.has(p.uid)}
                  disabled={busy || shortlist.loading || !!shortlist.error}
                  onClick={() =>
                    act(
                      () => savePeer(user.uid, p.uid, !savedIds.has(p.uid)),
                      savedIds.has(p.uid)
                        ? "Teammate removed from your shortlist."
                        : "Teammate saved to your private shortlist.",
                    )
                  }
                >
                  {savedIds.has(p.uid) ? (
                    <BookmarkCheck size={19} aria-hidden="true" />
                  ) : (
                    <Bookmark size={19} aria-hidden="true" />
                  )}
                </button>
                <PeerAvatar name={p.name} photoUrl={d.photoUrl} />
                <h3>{p.name}</h3>
                <p className="peer-role">
                  {d.desiredRole || "Student collaborator"}
                </p>
                {d.fieldOfStudy && (
                  <p className="peer-study-chip">
                    {studyFieldLabel(d.fieldOfStudy)}
                  </p>
                )}
                {(d.degree || d.college || d.year) && (
                  <p className="peer-academic">
                    <GraduationCap size={16} aria-hidden="true" />{" "}
                    {[d.degree, d.college, d.year].filter(Boolean).join(" • ")}
                  </p>
                )}
                {d.location && (
                  <p className="peer-location">
                    <MapPin size={15} aria-hidden="true" />
                    {d.location}
                  </p>
                )}
                <section className="peer-section">
                  <h4>
                    {p.skills?.length
                      ? "Skills"
                      : p.suggestedSkills?.length
                        ? "Study-based skills"
                        : "Skills"}
                    {!p.skills?.length && !!p.suggestedSkills?.length && (
                      <span
                        className="peer-suggested-label"
                        title="Suggested from the study program; the student has not yet confirmed these skills."
                      >
                        Suggested
                      </span>
                    )}
                  </h4>
                  {visibleSkills(p).length ? (
                    <PeerTags
                      values={visibleSkills(p)}
                      label={p.skills?.length ? "Skills" : "Study-based skills"}
                    />
                  ) : (
                    <p className="hint">Skills not shared yet.</p>
                  )}
                </section>
                {suggested && (
                  <div className="skill-row peer-match">
                    <span title="Shared-profile similarity: skills 30%, domain 20%, interests 15%, collaboration goals 10%, college 10%, year 5%, experience 10%">
                      {p.match.score}% Match
                    </span>
                    {[...new Set([...p.match.labels, ...p.reasons])]
                      .slice(0, 2)
                      .map((v) => (
                        <span key={v}>{v}</span>
                      ))}
                  </div>
                )}
                {[
                  ["achievements", "Achievements · self-reported"],
                  ["seeking", "Seeking"],
                  ["passions", "Passionate about"],
                ].map(([key, label]) =>
                  d[key]?.length ? (
                    <section className="peer-section" key={key}>
                      <h4>{label}</h4>
                      <PeerTags values={d[key]} label={label} />
                    </section>
                  ) : null,
                )}
                <div className="hub-actions peer-actions">
                  <button
                    className="button secondary"
                    disabled={busy}
                    onClick={() =>
                      act(
                        () => dismissPeer(user.uid, p.uid),
                        "Profile dismissed privately. You can restore it below.",
                      )
                    }
                  >
                    <X size={15} aria-hidden="true" /> Dismiss
                  </button>
                  {relation ? (
                    <a
                      className="peer-connection-state"
                      href="/teams?hub=connections"
                    >
                      {relation.status === "accepted"
                        ? "Connected"
                        : relation.status === "pending"
                          ? relation.toId === user.uid
                            ? "Respond to request"
                            : "Request sent"
                          : "View connection"}
                    </a>
                  ) : (
                    <button
                      className="button"
                      disabled={busy || !myPublic || !connectionsReady}
                      onClick={() =>
                        act(
                          () => connectMember(user.uid, p.uid),
                          "Connection request sent.",
                        )
                      }
                    >
                      <Handshake size={16} aria-hidden="true" /> Connect
                    </button>
                  )}
                </div>
              </article>
            );
          })}
      </div>
      {canLoadMore && (
        <button className="button secondary" onClick={loadMore}>
          Load more profiles
        </button>
      )}
      {!myPublic && (
        <p className="hint">
          Make your profile discoverable above to send connection requests.
        </p>
      )}
      {dismissed.items.length > 0 && (
        <details className="panel">
          <summary>Dismissed profiles ({dismissed.items.length})</summary>
          {dismissed.items.map((p) => (
            <p key={p.id}>
              Hidden student profile{" "}
              <button
                className="text-link"
                disabled={busy}
                onClick={() =>
                  act(
                    () => dismissPeer(user.uid, p.peerId, false),
                    "Profile restored to discovery.",
                  )
                }
              >
                Restore
              </button>
            </p>
          ))}
        </details>
      )}
    </>
  );
}
