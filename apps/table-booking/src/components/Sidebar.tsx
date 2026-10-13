import { useState } from "react";
import TablePalette from "./TablePalette";

const tabs = [
  { id: "tables", label: "Tables" },
  { id: "bookings", label: "Bookings" },
] as const;

type Tab = (typeof tabs)[number]["id"];

function Sidebar() {
  const [tab, setTab] = useState<Tab>("tables");

  return (
    <aside className="row-span-2 flex flex-col gap-4 overflow-x-hidden overflow-y-auto border-r border-border bg-panel p-4">
      <div
        role="tablist"
        className="grid grid-cols-2 overflow-hidden rounded-md border border-border text-sm">
        {tabs.map(({ id, label }) => (
          <button
            key={id}
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={
              tab === id
                ? "bg-accent-subtle py-2 text-accent"
                : "py-2 text-muted hover:text-foreground"
            }>
            {label}
          </button>
        ))}
      </div>

      {tab === "tables" ? (
        <TablePalette />
      ) : (
        <p className="text-sm text-muted">Booking list goes here.</p>
      )}
    </aside>
  );
}

export default Sidebar;
