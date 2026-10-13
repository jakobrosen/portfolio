export type TableShape = "rect" | "round";

// Edit is for arranging the floor plan, booking for running the day.
export type Mode = "edit" | "booking";

export type Table = {
  id: string;
  label: string;
  shape: TableShape;
  // Top-left corner and size in floor plan units (px at zoom 1).
  x: number;
  y: number;
  // Round tables keep width === height.
  width: number;
  height: number;
  seats: number;
};

export type Booking = {
  id: string;
  tableId: string;
  guestName: string;
  partySize: number;
  // ISO date-time.
  start: string;
  durationMin: number;
  phone?: string;
  note?: string;
  // Set when the guests arrive, which marks the table as occupied.
  seatedAt?: string;
};

export type AppState = {
  version: 1;
  tables: Table[];
  bookings: Booking[];
};
