import { useEffect, useState } from "react";

const TICK_MS = 30_000;

// The current time, refreshed often enough for minute-level statuses.
function useNow() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), TICK_MS);
    return () => clearInterval(interval);
  }, []);

  return now;
}

export default useNow;
