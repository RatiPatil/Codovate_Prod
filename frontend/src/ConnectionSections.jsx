import { connectionDecision } from "./teamHubData";
import { MemberName } from "./TeamWidgets";
export function ConnectionSections({
  connections,
  user,
  act,
  busy,
  myPublic,
  setSelected,
  ready,
}) {
  const sections = [
    [
      "Incoming requests",
      connections.filter((c) => c.status === "pending" && c.toId === user.uid),
      "No incoming requests.",
    ],
    [
      "Sent requests",
      connections.filter(
        (c) => c.status === "pending" && c.fromId === user.uid,
      ),
      "No sent requests.",
    ],
    [
      "Connected students",
      connections.filter((c) => c.status === "accepted"),
      "Your accepted connections will appear here.",
    ],
    [
      "Connection history",
      connections.filter((c) =>
        ["declined", "withdrawn", "blocked"].includes(c.status),
      ),
      "No earlier connection activity.",
    ],
  ];
  return (
    <div className="connections-layout">
      {sections
        .filter(
          ([label, items]) =>
            label !== "Connection history" || items.length > 0,
        )
        .map(([label, items, empty]) => (
          <section className="connection-section" key={label}>
            <header className="hub-section-heading">
              <h2>{label}</h2>
              <span className="pill">{ready ? items.length : "…"}</span>
            </header>
            {ready && !items.length && <p className="panel">{empty}</p>}
            <div className="hub-list">
              {items.map((c) => {
                const other = c.fromId === user.uid ? c.toId : c.fromId;
                return (
                  <article className="panel hub-connection" key={c.id}>
                    <div>
                      <h3>
                        <MemberName uid={other} />
                      </h3>
                      <span className="request-state">{c.status}</span>
                    </div>
                    <div className="hub-actions">
                      {c.status === "pending" && c.toId === user.uid && (
                        <>
                          <button
                            className="button"
                            disabled={busy || !ready}
                            onClick={() =>
                              act(
                                () => connectionDecision(c.id, "accepted"),
                                "Connection accepted.",
                              )
                            }
                          >
                            Accept
                          </button>
                          <button
                            className="button secondary"
                            disabled={busy || !ready}
                            onClick={() =>
                              act(
                                () => connectionDecision(c.id, "declined"),
                                "Request declined.",
                              )
                            }
                          >
                            Decline
                          </button>
                        </>
                      )}
                      {c.status === "pending" && c.fromId === user.uid && (
                        <button
                          className="text-link"
                          disabled={busy || !ready}
                          onClick={() =>
                            act(
                              () => connectionDecision(c.id, "withdrawn"),
                              "Request withdrawn.",
                            )
                          }
                        >
                          Cancel request
                        </button>
                      )}
                      {["pending", "accepted"].includes(c.status) && (
                        <button
                          className="text-link"
                          disabled={busy || !ready}
                          onClick={() => {
                            if (
                              window.confirm(
                                "Block this connection and revoke direct chat access?",
                              )
                            ) {
                              setSelected("");
                              act(
                                () => connectionDecision(c.id, "blocked"),
                                "Connection blocked.",
                              );
                            }
                          }}
                        >
                          Block
                        </button>
                      )}
                      {c.status === "blocked" && c.blockedBy === user.uid && (
                        <button
                          className="text-link"
                          disabled={busy || !ready}
                          onClick={() =>
                            act(
                              () => connectionDecision(c.id, "declined"),
                              "Unblocked. A new connection request is required.",
                            )
                          }
                        >
                          Unblock
                        </button>
                      )}
                      {["withdrawn", "declined"].includes(c.status) &&
                        c.fromId === user.uid && (
                          <button
                            className="text-link"
                            disabled={busy || !ready || !myPublic}
                            onClick={() =>
                              act(
                                () => connectionDecision(c.id, "pending"),
                                "Request sent again.",
                              )
                            }
                          >
                            Send request again
                          </button>
                        )}
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        ))}
      <section className="panel chat-coming-soon" aria-label="Active chats">
        <header className="hub-section-heading">
          <h2>Active chats</h2>
          <span className="pill">24h Limit · planned</span>
        </header>
        <p>No active chats.</p>
        <p className="hint">
          Realtime chat is under development and will be available in upcoming
          releases.
        </p>
      </section>
    </div>
  );
}
