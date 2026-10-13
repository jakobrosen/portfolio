import type { Booking, Table } from "../types";
import type { TableStatus } from "../lib/bookings";
import {
  CHAIR_DEPTH,
  CHAIR_EXTENT,
  CHAIR_WIDTH,
  chairPositions,
  type Chair,
} from "../lib/geometry";
import { formatTime } from "../lib/format";
import { statusStyles } from "./status";

type TableNodeProps = {
  table: Table;
  status: TableStatus;
  booking?: Booking;
};

const BACKREST = 3;

function ChairShape({ chair, className }: { chair: Chair; className: string }) {
  const x = chair.x + CHAIR_EXTENT;
  const y = chair.y + CHAIR_EXTENT;
  return (
    <g
      transform={`translate(${x} ${y}) rotate(${chair.angle})`}
      className={className}>
      {/* Backrest on the side facing away from the table. */}
      <rect
        x={-CHAIR_WIDTH / 2 + 4}
        y={-CHAIR_DEPTH / 2}
        width={CHAIR_WIDTH - 8}
        height={BACKREST}
        rx={BACKREST / 2}
      />
      <rect
        x={-CHAIR_WIDTH / 2}
        y={-CHAIR_DEPTH / 2 + BACKREST + 2}
        width={CHAIR_WIDTH}
        height={CHAIR_DEPTH - BACKREST - 2}
        rx={5}
      />
    </g>
  );
}

function TableNode({ table, status, booking }: TableNodeProps) {
  const { width, height } = table;
  const style = statusStyles[status];
  const chairs = chairPositions(table);
  // A vacant table shows all chairs as free. A booked one colours a chair per
  // guest, so it's easy to see how full the table is.
  const coloured =
    status === "vacant" ? chairs.length : (booking?.partySize ?? 0);
  const round = table.shape === "round";

  return (
    <div
      className="absolute"
      style={{
        left: table.x - CHAIR_EXTENT,
        top: table.y - CHAIR_EXTENT,
        width: width + CHAIR_EXTENT * 2,
        height: height + CHAIR_EXTENT * 2,
      }}>
      <svg
        className="absolute inset-0 overflow-visible"
        width={width + CHAIR_EXTENT * 2}
        height={height + CHAIR_EXTENT * 2}
        aria-hidden>
        {chairs.map((chair, i) => (
          <ChairShape
            key={i}
            chair={chair}
            className={i < coloured ? style.fill : "fill-chair"}
          />
        ))}
        {round ? (
          <circle
            cx={CHAIR_EXTENT + width / 2}
            cy={CHAIR_EXTENT + height / 2}
            r={width / 2 - 0.5}
            className="fill-table stroke-border drop-shadow-sm"
          />
        ) : (
          <rect
            x={CHAIR_EXTENT + 0.5}
            y={CHAIR_EXTENT + 0.5}
            width={width - 1}
            height={height - 1}
            rx={8}
            className="fill-table stroke-border drop-shadow-sm"
          />
        )}
      </svg>

      <div
        className={`absolute flex flex-col overflow-hidden p-2 text-xs leading-tight ${round ? "items-center justify-center text-center" : ""}`}
        style={{ left: CHAIR_EXTENT, top: CHAIR_EXTENT, width, height }}>
        <span className="font-medium text-muted">{table.label}</span>
        {booking && (
          <span className="mt-auto w-full truncate font-medium">
            {booking.guestName}
          </span>
        )}
        <span className={`${booking ? "" : "mt-auto"} ${style.text}`}>
          {style.label}
          {booking && status !== "occupied" && ` ${formatTime(booking.start)}`}
        </span>
      </div>
    </div>
  );
}

export default TableNode;
