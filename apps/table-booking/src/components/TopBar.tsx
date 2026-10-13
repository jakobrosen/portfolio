function TopBar() {
  return (
    <header className="flex items-center gap-4 border-b border-border bg-panel px-6 py-3">
      <h1 className="font-medium">Table Booking</h1>
      <button className="ml-auto rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground">
        New booking
      </button>
    </header>
  );
}

export default TopBar;
