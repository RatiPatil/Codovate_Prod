import { createContext, useContext, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Bookmark } from "lucide-react";
import { useSession } from "./session";
import { useOwned, toggleSaved } from "./data";
import { errorMessage } from "./domain";
const Saves = createContext(null);
export function OpportunitySaveProvider({ children }) {
  const { user } = useSession();
  return (
    <AccountSaves key={user?.uid || "guest"} user={user}>
      {children}
    </AccountSaves>
  );
}
function AccountSaves({ user, children }) {
  const bookmarks = useOwned("bookmarks", user?.uid);
  const saved = new Set(bookmarks.items.map((b) => b.opportunityId));
  const lock = useRef(new Set());
  const [busy, setBusy] = useState(new Set());
  const [errors, setErrors] = useState({});
  async function toggle(item) {
    if (!user || lock.current.has(item.id)) return;
    lock.current.add(item.id);
    setBusy(new Set(lock.current));
    setErrors((v) => ({ ...v, [item.id]: "" }));
    try {
      await toggleSaved(user.uid, item, saved.has(item.id));
    } catch (e) {
      setErrors((v) => ({ ...v, [item.id]: errorMessage(e) }));
    } finally {
      lock.current.delete(item.id);
      setBusy(new Set(lock.current));
    }
  }
  return (
    <Saves.Provider
      value={{
        user,
        saved,
        busy,
        errors,
        toggle,
        loading: bookmarks.loading,
        error: bookmarks.error,
      }}
    >
      {children}
    </Saves.Provider>
  );
}
export function SaveOpportunityButton({ item, compact = false }) {
  const state = useContext(Saves);
  if (!state) return null;
  return <SaveControl state={state} item={item} compact={compact} />;
}
function SaveControl({ state, item, compact }) {
  const location = useLocation();
  if (!state.user)
    return (
      <Link
        className={compact ? "save-button" : "button secondary full"}
        to="/login"
        state={{ from: location.pathname + location.search }}
        aria-label={"Sign in to save " + item.title}
      >
        <Bookmark size={compact ? 19 : 16} />
        {!compact && "Sign in to save"}
      </Link>
    );
  const saved = state.saved.has(item.id),
    error = state.errors[item.id];
  return (
    <div
      className={
        compact
          ? "opportunity-save-control compact"
          : "opportunity-save-control"
      }
    >
      <button
        className={
          compact
            ? "save-button " + (saved ? "is-saved" : "")
            : "button secondary full"
        }
        aria-label={(saved ? "Unsave " : "Save ") + item.title}
        title={saved ? "Remove from saved opportunities" : "Save opportunity"}
        aria-pressed={saved}
        disabled={state.loading || !!state.error || state.busy.has(item.id)}
        onClick={() => state.toggle(item)}
      >
        <Bookmark
          size={compact ? 19 : 16}
          fill={saved ? "currentColor" : "none"}
        />
        {!compact &&
          (state.busy.has(item.id)
            ? "Saving…"
            : saved
              ? "Saved opportunity"
              : "Save opportunity")}
      </button>
      {(error || state.error) && (
        <span role="alert" className="save-opportunity-error">
          {error || "Saved opportunities could not load. Refresh to try again."}
        </span>
      )}
    </div>
  );
}
