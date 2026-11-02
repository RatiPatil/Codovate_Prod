import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "./firebase";
import { useTeamFeed, connectMember } from "./teamHubData";
import {
  domains,
  experienceLevels,
  seekingOptions,
  passionOptions,
  emptyDetails,
  saveDiscovery,
  dismissPeer,
  discoverPeers,
} from "./discoveryData";
export function PeerDiscovery({
  user,
  profile,
  people,
  connections,
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
  const dismissed = useTeamFeed(
    "discoveryDismissals/" + user.uid + "/members",
    user.uid,
    [["dismissed", "==", true]],
    1000,
  );
  useEffect(() => {
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
        const d = s.data()?.details || emptyDetails;
        setDraft({ ...emptyDetails, ...d });
        setSaved(d);
        setShare(s.data()?.shareDetails || false);
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
          These teammates are suggested from your skills and saved goals. Each
          card explains its matches; no percentage score is invented.
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
            placeholder="React, Java, Python…"
          />
        </label>
        <label>
          Domain / goal
          <select value={domain} onChange={(e) => setDomain(e.target.value)}>
            <option value="">All domains</option>
            {domains.map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </label>
        <label>
          Experience level
          <select
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
      {(people.error || dismissed.error) && (
        <p role="alert" className="hub-error">
          {people.error || dismissed.error}
        </p>
      )}
      {(people.loading || dismissed.loading) && (
        <p role="status">Loading discovery…</p>
      )}
      {!people.loading &&
        !dismissed.loading &&
        !people.error &&
        !dismissed.error &&
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
          items.map((p) => {
            const d = p.details || {},
              relation = connections.find((c) =>
                [c.fromId, c.toId].includes(p.uid),
              );
            return (
              <article className="panel peer-card" key={p.uid}>
                {d.photoUrl ? (
                  <img
                    src={d.photoUrl}
                    referrerPolicy="no-referrer"
                    alt=""
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.hidden = true;
                    }}
                  />
                ) : (
                  <div className="hub-avatar" aria-hidden="true">
                    {p.name.slice(0, 1)}
                  </div>
                )}
                <h3>{p.name}</h3>
                <p className="peer-role">
                  {d.desiredRole || "Student collaborator"}
                </p>
                {(d.college || d.year) && (
                  <p>{[d.college, d.year].filter(Boolean).join(" • ")}</p>
                )}
                {d.location && <p>{d.location}</p>}
                <div className="skill-row">
                  {p.skills.map((v) => (
                    <span key={v}>{v}</span>
                  ))}
                </div>
                {suggested && (
                  <div className="skill-row">
                    {p.reasons.map((v) => (
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
                      disabled={busy || !myPublic}
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
