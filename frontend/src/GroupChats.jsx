import { useState } from "react";
import { MessageCircle, Plus, Users } from "lucide-react";
import { createGroup, answerInvite } from "./teamHubData";
import { FeedStatus, MemberName, InvitationTitle } from "./TeamWidgets";
export function GroupChats({ user, groups, invites, busy, act, onOpen }) {
  const [creating, setCreating] = useState(false);
  return (
    <section className="panel group-chats" aria-label="Group chats">
      <header className="hub-section-heading">
        <div>
          <h2>
            <Users size={19} aria-hidden="true" />
            Group chats
          </h2>
          <p className="hint">
            A private space for your project, study circle or next idea.
          </p>
        </div>
        <button
          className="button secondary"
          disabled={busy}
          aria-expanded={creating}
          onClick={() => setCreating((v) => !v)}
        >
          <Plus size={16} aria-hidden="true" />
          Create group
        </button>
      </header>
      {creating && (
        <form
          className="hub-create"
          onSubmit={(e) => {
            e.preventDefault();
            const form = e.currentTarget;
            act(async () => {
              const id = await createGroup(
                user.uid,
                new FormData(form).get("title"),
              );
              form.reset();
              setCreating(false);
              onOpen(id);
            }, "Your group chat is ready. Invite students from its member settings.");
          }}
        >
          <label>
            Group name
            <input
              name="title"
              required
              maxLength={100}
              placeholder="Give your group a name"
            />
          </label>
          <button className="button" disabled={busy}>
            Start group chat
          </button>
        </form>
      )}
      <FeedStatus feed={groups} />
      <FeedStatus feed={invites} />
      {invites.items
        .filter((invite) => invite.status === "pending")
        .map((invite) => (
          <article className="hub-connection group-invite" key={invite.id}>
            <div>
              <h3>
                <InvitationTitle groupId={invite.groupId} />
              </h3>
              <p className="hint">
                Invited by <MemberName uid={invite.ownerId} />
              </p>
            </div>
            <div className="hub-actions">
              <button
                className="button"
                disabled={busy}
                onClick={() =>
                  act(async () => {
                    await answerInvite(invite, "accepted");
                    onOpen(invite.groupId);
                  }, "You joined the group.")
                }
              >
                Join group
              </button>
              <button
                className="text-link"
                disabled={busy}
                onClick={() =>
                  act(
                    () => answerInvite(invite, "declined"),
                    "Group invitation declined.",
                  )
                }
              >
                Decline invitation
              </button>
            </div>
          </article>
        ))}
      <div className="group-chat-list">
        {groups.items.map((group) => (
          <button
            className="group-chat-row"
            key={group.id}
            disabled={busy}
            onClick={() => onOpen(group.id)}
          >
            <span className="hub-avatar">
              <Users size={22} aria-hidden="true" />
            </span>
            <span>
              <strong>{group.title}</strong>
              <small>
                {group.members.length} members ·{" "}
                {group.status === "active" ? "Group chat" : "Archived"}
              </small>
            </span>
            <MessageCircle size={18} aria-hidden="true" />
          </button>
        ))}
      </div>
      {!groups.loading &&
        !groups.error &&
        !groups.cached &&
        !groups.items.length && (
          <p className="hint">
            No group chats yet. Create one or accept an invitation to start.
          </p>
        )}
    </section>
  );
}
