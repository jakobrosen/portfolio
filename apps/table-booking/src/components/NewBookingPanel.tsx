import { useEffect, useRef } from "react";
import { formatDate } from "../lib/format";
import type { Booking } from "../types";
import BookingForm from "./BookingForm";
import IconButton from "./IconButton";
import { CloseIcon } from "./icons";

type NewBookingPanelProps = {
  // The time being looked at, which the booking starts from.
  time: Date;
  // Called with the new booking, or nothing when cancelled.
  onDone: (saved?: Booking) => void;
  onHighlight: (tableId: string | undefined) => void;
};

// A booking made from the top bar, where the form suggests a free table.
// It sits to the side so the suggested tables stay visible on the floor.
function NewBookingPanel({ time, onDone, onHighlight }: NewBookingPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  // Clicking anywhere else closes the panel, like the other popovers. The
  // top bar button is left out, as it toggles the panel itself.
  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Element;
      if (
        !panelRef.current?.contains(target) &&
        !target.closest("[data-new-booking-trigger]")
      ) {
        onDone();
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [onDone]);

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-label="New booking"
      onKeyDown={(event) => {
        if (event.key === "Escape") onDone();
      }}
      className="absolute top-3 right-6 z-40 flex w-80 flex-col gap-3 rounded-xl border border-border bg-panel p-4 shadow-lg">
      <header className="flex items-center justify-between">
        <h2 className="font-medium">
          New booking
          <span className="ml-2 text-sm font-normal text-muted">
            {formatDate(time)}
          </span>
        </h2>
        <IconButton label="Close" onClick={() => onDone()}>
          <CloseIcon />
        </IconButton>
      </header>
      <BookingForm time={time} onDone={onDone} onHighlight={onHighlight} />
    </div>
  );
}

export default NewBookingPanel;
