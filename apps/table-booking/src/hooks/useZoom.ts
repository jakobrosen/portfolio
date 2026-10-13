import { useEffect, useState } from "react";
import { clampZoom } from "../lib/zoom";

const STORAGE_KEY = "table-booking:zoom";

function savedZoom() {
  try {
    const saved = Number(localStorage.getItem(STORAGE_KEY));
    if (saved) return clampZoom(saved);
  } catch {
    // Storage can be unavailable, e.g. in private browsing.
  }
  return 1;
}

// The floor plan's zoom, remembered in this browser.
function useZoom() {
  const [zoom, setZoom] = useState(savedZoom);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, String(zoom));
    } catch {
      // Ignore, the zoom just won't be remembered.
    }
  }, [zoom]);

  return [zoom, (next: number) => setZoom(clampZoom(next))] as const;
}

export default useZoom;
