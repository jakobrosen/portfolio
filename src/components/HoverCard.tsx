import { useRef, type PointerEvent, type ReactNode } from "react";

type HoverCardProps = { children: ReactNode; className?: string };

// Meant to sit in a list with `group/list`: hovering one card dims the others.
// Give the children `z-10` so they render above the hover background.
function HoverCard({ children, className = "" }: HoverCardProps) {
  const spotlight = useRef<HTMLDivElement>(null);

  // Moves the spotlight to the pointer. Written straight to the DOM so pointer
  // moves don't re-render the card.
  const moveSpotlight = (event: PointerEvent) => {
    const element = spotlight.current;
    if (!element) return;
    const { left, top } = element.getBoundingClientRect();
    element.style.setProperty("--spotlight-x", `${event.clientX - left}px`);
    element.style.setProperty("--spotlight-y", `${event.clientY - top}px`);
  };

  return (
    <article
      onPointerMove={moveSpotlight}
      className={`group relative transition-opacity motion-reduce:transition-none lg:group-hover/list:opacity-50 lg:hover:opacity-100! ${className}`}>
      {/* Background that appears behind the hovered card. Keep its inset in
          sync with the click area in CardLink. */}
      <div className="absolute -inset-x-4 -inset-y-4 z-0 hidden rounded-md transition motion-reduce:transition-none lg:-inset-x-6 lg:block lg:group-hover:bg-foreground/5 lg:group-hover:shadow-[inset_0_1px_0_0_color-mix(in_oklab,var(--color-foreground)_10%,transparent)] lg:group-hover:drop-shadow-lg lg:group-has-focus-visible:bg-foreground/5">
        {/* Soft glow that follows the pointer inside the hovered card. */}
        <div
          ref={spotlight}
          className="absolute inset-0 rounded-md bg-[radial-gradient(300px_at_var(--spotlight-x)_var(--spotlight-y),color-mix(in_oklab,var(--color-accent)_6%,transparent),transparent_80%)] opacity-0 transition-opacity group-hover:opacity-100 motion-reduce:hidden"
        />
      </div>
      {children}
    </article>
  );
}

export default HoverCard;
