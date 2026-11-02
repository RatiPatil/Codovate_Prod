import { useEffect, useRef, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "./firebase";
export function CommunityCount() {
  const [count, setCount] = useState(null);
  const [cached, setCached] = useState(false);
  const [displayed, setDisplayed] = useState(0);
  const previous = useRef(0);
  useEffect(() => {
    if (count === null) return;
    if (!window.matchMedia || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setDisplayed(count); previous.current = count; return;
    }
    const from = previous.current, start = performance.now();
    let frame;
    function step(now) {
      const progress = Math.min(1, (now - start) / 750);
      const value = Math.round(from + (count - from) * (1 - Math.pow(1 - progress, 3)));
      previous.current = value; setDisplayed(value);
      if (progress < 1) frame = requestAnimationFrame(step);
    }
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [count]);
  useEffect(() => {
    if (!db) return;
    return onSnapshot(doc(db, "publicStats", "community"), { includeMetadataChanges: true }, (snapshot) => {
      const value = snapshot.data()?.registeredStudents;
      setCount(snapshot.exists() && Number.isSafeInteger(value) && value >= 0 ? value : null);
      setCached(snapshot.metadata.fromCache);
    }, () => setCount(null));
  }, []);
  return <div className="community-count" aria-live="polite">
    <strong aria-label={count === null ? undefined : `${count.toLocaleString("en-IN")}+ registered members`}>
      {count === null ? "Join our learning community" : <span aria-hidden="true">{displayed.toLocaleString("en-IN")}+ registered members</span>}
    </strong>
    <small>{count === null ? "Learn, practise and prepare together." : `Registered community${cached ? " · last saved count" : " · updated live"}`}</small>
  </div>;
}
