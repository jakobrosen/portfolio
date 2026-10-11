import { useLayoutEffect } from "react";

// Numbers the `.animate-reveal` elements in document order, so the reveal
// animation in index.css can stagger them top to bottom. The sidebar and the
// main content are numbered separately so both start at the same time, and
// hidden elements (like the nav below lg) are skipped so they leave no gap.
// Runs before the first paint, so nothing flashes in before its delay.
function useStaggeredReveal() {
  useLayoutEffect(() => {
    for (const column of ["header", "main"]) {
      const elements = document.querySelectorAll<HTMLElement>(
        `${column} .animate-reveal`,
      );
      const visible = [...elements].filter(
        (element) => element.getClientRects().length > 0,
      );
      visible.forEach((element, index) => {
        element.style.setProperty("--reveal-index", String(index));
      });
    }
  }, []);
}

export default useStaggeredReveal;
