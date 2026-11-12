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
export function PeerDiscovery({
  user,
  profile,
  people,
  connections,
  connectionsReady = true,
  connectionsError = "",
  myPublic,
  act,
  busy,
  suggested = false,
  loadMore,
  canLoadMore,
}) {
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
  const items = discoverPeers(people.items, {
    uid: user.uid,
    search,
    skill,
    domain,
    experience,
    dismissed: dismissed.items.map((x) => x.peerId),
    blocked: connections
      .filter((c) => c.status === "blocked")
      .map((c) => (c.fromId === user.uid ? c.toId : c.fromId)),
    suggested,
    mine: { skills: profile?.skills || [], details: saved },
  });
  const update = (key, value) => setDraft((d) => ({ ...d, [key]: value }));
  return (
    <>
      <details className="panel discovery-settings">
        <summary>Discovery profile settings</summary>
        <p>
          Your name and confirmed skills are shared when you opt in. The extra
          details below are optional. Nothing copies your email or phone into
          discovery.
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
      <div className="discovery-filters">
        <label>
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
      {(search || skill || domain || experience) && (
        <button
          className="text-link"
          onClick={() => {
            setSearch("");
            setSkill("");
            setDomain("");
            setExperience("");
          }}
        >
          Clear filters
        </button>
      )}
      <p className="hint">
        Separate skills with commas to match every listed skill. Match scores
        reflect shared profile details; missing details earn no points.
      </p>
      {(people.error ||
        dismissed.error ||
        connectionsError ||
        (suggested && prefError)) && (
        <p role="alert" className="hub-error">
          {people.error || dismissed.error || connectionsError || prefError}
        </p>
      )}
      {(people.loading || dismissed.loading || (suggested && !prefReady)) && (
        <p role="status">Loading discovery…</p>
      )}
      {!people.loading &&
        !dismissed.loading &&
        !people.error &&
        !dismissed.error &&
        (!suggested || prefReady) &&
        !items.length && (
          <section className="panel">
            <h3>No teammates found matching your criteria.</h3>
            <p>
              {suggested
                ? "Save your goals and add confirmed skills to get explainable suggestions. Try Find Teammates to browse everyone who has opted in."
                : "Try different filters or load more profiles. Only students who choose discovery appear here."}
            </p>
          </section>
        )}
      <div className="hub-people">
        {!dismissed.error &&
          !dismissed.loading &&
          (!suggested || prefReady) &&
          items.map((p) => {
            const d = p.details || {},
              relation = connections.find((c) =>
                [c.fromId, c.toId].includes(p.uid),
              );
            return (
              <article className="panel peer-card" key={p.uid}>
                <PeerAvatar name={p.name} photoUrl={d.photoUrl} />
                <h3>{p.name}</h3>
                <p className="peer-role">
                  {d.desiredRole || "Student collaborator"}
                </p>
                {(d.degree || d.college || d.year) && (
                  <p>
                    {[d.degree, d.college, d.year].filter(Boolean).join(" • ")}
                  </p>
                )}
                {d.location && <p>{d.location}</p>}
                <h4>Skills</h4>
                <div className="skill-row">
                  {(p.skills || []).map((v) => (
                    <span key={v}>{v}</span>
                  ))}
                </div>
                {suggested && (
                  <div className="skill-row">
                    <span title="Shared-profile similarity: skills 30%, domain 20%, interests 15%, collaboration goals 10%, college 10%, year 5%, experience 10%">
                      {p.match.score}% Match
                    </span>
                    {[...p.reasons, ...p.match.labels].map((v) => (
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
                    <section key={key}>
                      <h4>{label}</h4>
                      <div className="skill-row">
                        {d[key].map((v) => (
                          <span key={v}>{v}</span>
                        ))}
                      </div>
                    </section>
                  ) : null,
                )}
                <div className="hub-actions">
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
                    Dismiss
                  </button>
                  {relation ? (
                    <span className="hint">Connection: {relation.status}</span>
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
                      Connect
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
      <p className="hint">
        Filters and suggestions use loaded profiles. Make your own card
        discoverable before connecting. No online status is inferred.
      </p>
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
