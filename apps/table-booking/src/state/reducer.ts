import { clamp, maxSeats } from "../lib/geometry";
import type { AppState, Booking, Table } from "../types";

// Keeps the chair count within what fits, e.g. after the table shrinks.
function withValidSeats(table: Table): Table {
  return { ...table, seats: clamp(table.seats, 1, maxSeats(table)) };
}

export type Action =
  | { type: "addTable"; table: Table }
  | { type: "updateTable"; id: string; changes: Partial<Omit<Table, "id">> }
  | { type: "removeTable"; id: string }
  | { type: "addBooking"; booking: Booking }
  | {
      type: "updateBooking";
      id: string;
      changes: Partial<Omit<Booking, "id">>;
    }
  | { type: "removeBooking"; id: string }
  | { type: "reset"; state: AppState };

export function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "addTable":
      return {
        ...state,
        tables: [...state.tables, withValidSeats(action.table)],
      };

    case "updateTable":
      return {
        ...state,
        tables: state.tables.map((table) =>
          table.id === action.id
            ? withValidSeats({ ...table, ...action.changes })
            : table,
        ),
      };

    // Bookings can't exist without their table, so they go too.
    case "removeTable":
      return {
        ...state,
        tables: state.tables.filter((table) => table.id !== action.id),
        bookings: state.bookings.filter(
          (booking) => booking.tableId !== action.id,
        ),
      };

    case "addBooking":
      return { ...state, bookings: [...state.bookings, action.booking] };

    case "updateBooking":
      return {
        ...state,
        bookings: state.bookings.map((booking) =>
          booking.id === action.id
            ? { ...booking, ...action.changes }
            : booking,
        ),
      };

    case "removeBooking":
      return {
        ...state,
        bookings: state.bookings.filter((booking) => booking.id !== action.id),
      };

    case "reset":
      return action.state;
  }
}
