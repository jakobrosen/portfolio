import type { ReactNode } from "react";

type CardLinkProps = { href: string; children: ReactNode };

// External link that covers its whole HoverCard, so the card is clickable.
function CardLink({ href, children }: CardLinkProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-baseline transition-colors group-hover:text-accent focus-visible:text-accent focus-visible:outline-none">
      {/* Click area */}
      <span className="absolute -inset-x-4 -inset-y-4 rounded-md lg:-inset-x-6" />
      {children}
      <span
        aria-hidden="true"
        className="ml-1 inline-block transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 motion-reduce:transition-none">
        ↗
      </span>
    </a>
  );
}

export default CardLink;
