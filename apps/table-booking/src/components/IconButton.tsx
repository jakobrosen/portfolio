import type { ReactNode } from "react";

type IconButtonProps = {
  // Read by screen readers and shown as a tooltip.
  label: string;
  onClick: () => void;
  tone?: "default" | "danger";
  // For toggles, whether this one is on.
  pressed?: boolean;
  disabled?: boolean;
  // Buttons near the left edge line the tooltip up with their left side.
  tooltipAlign?: "center" | "start";
  children: ReactNode;
};

// An icon-only button. Its label shows up after hovering for a moment, or
// right away when it's reached with the keyboard.
function IconButton({
  label,
  onClick,
  tone = "default",
  pressed,
  disabled,
  tooltipAlign = "center",
  children,
}: IconButtonProps) {
  return (
    <span className="group relative">
      <button
        type="button"
        aria-label={label}
        aria-pressed={pressed}
        disabled={disabled}
        onClick={onClick}
        className={`grid size-8 place-items-center rounded-md outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:pointer-events-none disabled:opacity-35 ${
          pressed
            ? "bg-accent-subtle text-accent"
            : tone === "danger"
              ? "text-conflict hover:bg-conflict/10"
              : "text-muted hover:bg-surface hover:text-foreground"
        }`}>
        {children}
      </button>
      <span
        role="tooltip"
        className={`pointer-events-none absolute bottom-full z-10 mb-1.5 ${tooltipAlign === "start" ? "left-0" : "left-1/2 -translate-x-1/2"} rounded-md bg-tooltip px-2 py-1 text-xs whitespace-nowrap text-tooltip-foreground opacity-0 transition-opacity delay-0 group-hover:opacity-100 group-hover:delay-700 group-has-focus-visible:opacity-100 group-has-focus-visible:delay-0`}>
        {label}
      </span>
    </span>
  );
}

export default IconButton;
