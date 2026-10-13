import type { TableStatus } from "../lib/bookings";

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
