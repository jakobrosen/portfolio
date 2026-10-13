function Sidebar() {
  return (
    <aside className="row-span-2 flex flex-col gap-4 border-r border-border bg-panel p-4">
      <div className="grid grid-cols-2 rounded-md border border-border text-sm">
        <button className="rounded-l-md bg-accent-subtle py-2 text-accent">
          Tables
        </button>
        <button className="rounded-r-md py-2 text-muted">Bookings</button>
      </div>
      <p className="text-sm text-muted">Table palette goes here.</p>
    </aside>
  );
}

export default Sidebar;
