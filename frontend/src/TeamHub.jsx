import { useEffect, useRef, useState } from "react";
import { Users, UserRoundSearch, Sparkles, Handshake } from "lucide-react";
import { useSearchParams, Link } from "react-router-dom";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "./firebase";
import { useSession } from "./session";
import { Teams } from "./Community";
import {
  useTeamFeed,
  publishMember,
  hideMember,
  answerInvite,
} from "./teamHubData";
import "./teamHub.css";
import { FeedStatus, MemberName, InvitationTitle } from "./TeamWidgets";
import { TeamChat } from "./TeamChat";
import { PeerDiscovery } from "./PeerDiscovery";
import { ModernTeams, ProjectTeamBoard } from "./ModernTeams";
import { ConnectionSections } from "./ConnectionSections";
export function TeamHub() {
  const { user, profile } = useSession();
  const [params, setParams] = useSearchParams();
  const tab = [
    "teams",
    "people",
    "suggested",
    "connections",
    "groups",
    "recruiting",
  ].includes(params.get("hub"))
    ? params.get("hub")
    : params.get("view")
      ? "recruiting"
      : "teams";
  const [size, setSize] = useState(48),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [busy, setBusy] = useState(false),
    [selected, setSelected] = useState(""),
    [browseTeams, setBrowseTeams] = useState(false);
  const lock = useRef(false);
  const people = useTeamFeed(
    ["people", "suggested"].includes(tab) ? "memberProfiles" : null,
    user?.uid,
    [],
    size,
  );
  const sent = useTeamFeed("connections", user?.uid, [
    ["fromId", "==", user?.uid || ""],
  ]);
  const received = useTeamFeed("connections", user?.uid, [
    ["toId", "==", user?.uid || ""],
  ]);
  const groups = useTeamFeed("conversations", user?.uid, [
    ["kind", "==", "group"],
    ["members", "array-contains", user?.uid || ""],
  ]);
  const invites = useTeamFeed("groupInvites", user?.uid, [
    ["studentId", "==", user?.uid || ""],
  ]);
  const [myPublic, setMyPublic] = useState(false);
  const [visibilityReady, setVisibilityReady] = useState(false);
  useEffect(() => {
    setSelected("");
    setMyPublic(false);
    setVisibilityReady(false);
    if (!db || !user) return;
    return onSnapshot(
      doc(db, "memberProfiles", user.uid),
      { includeMetadataChanges: true },
      (s) => {
        if (s.metadata?.fromCache && !s.exists()) return;
        setMyPublic(s.exists());
        setVisibilityReady(true);
      },
      () => {
        setVisibilityReady(false);
        setError(
          "Your discovery visibility could not be confirmed. Please refresh and try again.",
        );
      },
    );
  }, [user?.uid]);
  const members = new Map(people.items.map((p) => [p.uid, p]));
  const name = (uid) => (
    <MemberName
      key={uid}
      uid={uid}
      fallback={
        members.get(uid)?.name ||
        (uid === user?.uid ? profile?.name || "You" : "Member")
      }
    />
  );
  const connections = [...sent.items, ...received.items].filter(
    (v, i, a) => a.findIndex((x) => x.id === v.id) === i,
  );
  async function act(action, message) {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await action();
      if (message) setNotice(message);
    } catch (e) {
      setError(
        e.code === "permission-denied"
          ? "This action is no longer available. Refresh the page or check your membership."
          : e.message || "Request failed. Please retry.",
      );
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  if (!user) return null;
  return (
    <div className="team-hub">
      {tab !== "recruiting" && (
        <section className="panel hub-intro">
          <span className="eyebrow">BUILD TOGETHER</span>
          <h2>Your next team starts here.</h2>
          <p>
            Meet students who share your goals. Connect, find your role and
            build something together.
          </p>
          <div className="hub-actions">
            <button
              className="button secondary"
              disabled={busy || !db || !visibilityReady}
              onClick={() =>
                act(
                  () =>
                    myPublic
                      ? hideMember(user.uid)
                      : publishMember(user, profile),
                  myPublic
                    ? "Your discovery profile is hidden."
                    : "Your name and confirmed skills are now discoverable.",
                )
              }
            >
              {myPublic
                ? "Hide my discovery profile"
                : "Make my profile discoverable"}
            </button>
            <Link className="text-link" to="/profile">
              Edit name & skills
            </Link>
          </div>
        </section>
      )}
      <div
        className="type-tabs hub-tabs"
        role="group"
        aria-label="Collaboration views"
      >
        {[
          ["teams", "My Teams", Users],
          ["connections", "Connections", Handshake],
          ["people", "Find Teammates", UserRoundSearch],
          ["suggested", "Suggested for You", Sparkles],
        ].map(([id, label, Icon]) => (
          <button
            key={id}
            className={tab === id ? "active" : ""}
            aria-pressed={tab === id}
            onClick={() => {
              setParams({ hub: id });
              setSelected("");
              setError("");
              setNotice("");
            }}
          >
            <Icon size={17} aria-hidden="true" />
            {label}
            {id === "connections" &&
            received.items.some((c) => c.status === "pending")
              ? " •"
              : ""}
          </button>
        ))}
      </div>
      {error && (
        <p role="alert" className="hub-error">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="hub-success">
          {notice}
        </p>
      )}
      {tab === "teams" && (
        <ModernTeams
          user={user}
          act={act}
          busy={busy}
          legacyGroups={groups}
          myPublic={myPublic}
          onLegacy={(id, room, view) => {
            setParams({ hub: id, ...(view ? { view } : {}) });
            setSelected(room || "");
          }}
        />
      )}
      {(tab === "people" || tab === "suggested") && (
        <PeerDiscovery
          key={tab}
          user={user}
          profile={profile}
          people={people}
          connections={connections}
          connectionsReady={
            !sent.loading && !received.loading && !sent.error && !received.error
          }
          connectionsError={sent.error || received.error}
          myPublic={myPublic}
          act={act}
          busy={busy}
          suggested={tab === "suggested"}
          canLoadMore={people.items.length === size && size < 1968}
          loadMore={() => setSize((n) => n + 48)}
        />
      )}
      {tab === "people" && (
        <details
          className="panel"
          onToggle={(e) => setBrowseTeams(e.currentTarget.open)}
        >
          <summary>Find a recruiting project team</summary>
          {browseTeams && (
            <ProjectTeamBoard
              user={user}
              act={act}
              busy={busy}
              myPublic={myPublic}
            />
          )}
          <button
            className="text-link"
            onClick={() => setParams({ hub: "recruiting" })}
          >
            Earlier recruiting board
          </button>
        </details>
      )}
      {tab === "connections" && (
        <>
          <FeedStatus
            feed={{
              ...sent,
              error: sent.error || received.error,
              loading: sent.loading || received.loading,
              cached: sent.cached || received.cached,
            }}
          />
          <ConnectionSections
            connections={connections}
            user={user}
            act={act}
            busy={busy}
            myPublic={myPublic}
            setSelected={setSelected}
            ready={
              !sent.loading &&
              !received.loading &&
              !sent.error &&
              !received.error
            }
          />
          {selected && (
            <TeamChat
              key={user.uid + selected}
              id={selected}
              onClose={() => setSelected("")}
            />
          )}
        </>
      )}
      {tab === "groups" && (
        <>
          <section className="panel">
            <h3>Earlier private workspaces</h3>
            <p>
              Your existing messages and membership records stay here. Create
              new teams in My Teams to include versioned team history.
            </p>
            <button
              className="button secondary"
              onClick={() => setParams({ hub: "teams" })}
            >
              Go to My Teams
            </button>
          </section>
          <FeedStatus
            feed={{
              ...groups,
              error: groups.error || invites.error,
              loading: groups.loading || invites.loading,
              cached: groups.cached || invites.cached,
            }}
          />
          {invites.items
            .filter((i) => i.status === "pending")
            .map((i) => (
              <section className="panel hub-connection" key={i.id}>
                <div>
                  <h3>
                    <InvitationTitle groupId={i.groupId} />
                  </h3>
                  <p>Invitation from {name(i.ownerId)}</p>
                  <p className="hint">
                    Accept to share messages with this group. Contact details
                    stay private.
                  </p>
                </div>
                <div className="hub-actions">
                  <button
                    className="button"
                    disabled={busy}
                    onClick={() =>
                      act(
                        () => answerInvite(i, "accepted"),
                        "You joined the group.",
                      )
                    }
                  >
                    Accept invitation
                  </button>
                  <button
                    className="button secondary"
                    disabled={busy}
                    onClick={() =>
                      act(
                        () => answerInvite(i, "declined"),
                        "Invitation declined.",
                      )
                    }
                  >
                    Decline
                  </button>
                </div>
              </section>
            ))}
          <div className="hub-people">
            {groups.items.map((g) => (
              <section className="panel" key={g.id}>
                <h3>{g.title}</h3>
                <p>
                  {g.members.length}/12 members · {g.status}
                </p>
                <button
                  className="button secondary"
                  onClick={() => setSelected(g.id)}
                >
                  Open workspace
                </button>
              </section>
            ))}
          </div>
          {!groups.items.length &&
            !groups.loading &&
            !groups.error &&
            !groups.cached && (
              <p className="panel">
                Start a group or accept an invitation to build together.
              </p>
            )}
          {selected && (
            <TeamChat
              key={user.uid + selected}
              id={selected}
              onClose={() => setSelected("")}
            />
          )}
        </>
      )}
      {tab === "recruiting" && <Teams />}
    </div>
  );
}
