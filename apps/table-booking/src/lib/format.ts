const timeFormat = new Intl.DateTimeFormat("en-GB", {
  hour: "2-digit",
  minute: "2-digit",
});

export function formatTime(date: Date | string) {
  return timeFormat.format(new Date(date));
}
