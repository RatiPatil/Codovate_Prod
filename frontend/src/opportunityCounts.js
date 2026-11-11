import { useEffect, useState } from "react";
import { collection, query, where, Timestamp, getCountFromServer } from "firebase/firestore";
import { db, configured } from "./firebase";
import { types } from "./domain";
import { withTimeout } from "./authSupport";

export function useOpportunityCounts() {
  const [state, setState] = useState({ counts: {}, loading: !!configured });
  useEffect(() => {
    if (!configured || !db) return;
    let active = true, pending = false;
    async function refresh() {
      if (pending) return;
      pending = true;
      const cutoff = Timestamp.now();
      const result = await Promise.allSettled(types.map(type => withTimeout(getCountFromServer(query(
        collection(db, "opportunities"), where("status", "==", "published"),
        where("type", "==", type), where("closesAt", ">", cutoff),
      )), "app/data-timeout")));
      if (active) setState({ counts: Object.fromEntries(types.map((type, index) => [type,
        result[index].status === "fulfilled" ? result[index].value.data().count : null,
      ])), loading: false });
      pending = false;
    }
    refresh();
    const timer = setInterval(refresh, 60000);
    const onVisible = () => { if (document.visibilityState === "visible") refresh(); };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", refresh);
    return () => { active = false; clearInterval(timer); document.removeEventListener("visibilitychange", onVisible); window.removeEventListener("focus", refresh); };
  }, []);
  return state;
}
