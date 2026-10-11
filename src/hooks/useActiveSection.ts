import { useEffect, useState } from "react";

// Returns the id of the last section whose top has scrolled past a line a
// third of the way down the viewport. The first section is active at the top
// of the page, and the last one at the bottom, so short sections at either end
// still get their turn.
function useActiveSection(ids: readonly string[]) {
  const [active, setActive] = useState(ids[0]);

  useEffect(() => {
    const update = () => {
      const scrollBottom = window.innerHeight + window.scrollY;
      if (scrollBottom >= document.documentElement.scrollHeight - 2) {
        setActive(ids[ids.length - 1]);
        return;
      }

      const line = window.innerHeight / 3;
      let current = ids[0];
      for (const id of ids) {
        const section = document.getElementById(id);
        if (section && section.getBoundingClientRect().top <= line) {
          current = id;
        }
      }
      setActive(current);
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);

    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [ids]);

  return active;
}

export default useActiveSection;
