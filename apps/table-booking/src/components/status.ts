import type { BookingState, TableStatus } from "../lib/bookings";

// Full class names so Tailwind can find them.
export const statusStyles: Record<
  TableStatus,
  { label: string; text: string; fill: string }
> = {
  vacant: { label: "Vacant", text: "text-vacant", fill: "fill-vacant" },
  upcoming: { label: "Reserved", text: "text-upcoming", fill: "fill-upcoming" },
  reserved: { label: "Awaiting", text: "text-upcoming", fill: "fill-upcoming" },
  occupied: { label: "Seated", text: "text-occupied", fill: "fill-occupied" },
};

// Dots next to bookings in lists.
export const bookingDots: Record<BookingState, { label: string; dot: string }> =
  {
    upcoming: { label: "Upcoming", dot: "border-2 border-upcoming" },
    due: { label: "Awaiting guests", dot: "bg-upcoming" },
    seated: { label: "Seated", dot: "bg-occupied" },
    finished: { label: "Finished", dot: "bg-chair" },
  };
