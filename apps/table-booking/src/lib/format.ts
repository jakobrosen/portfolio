const timeFormat = new Intl.DateTimeFormat("en-GB", {
  hour: "2-digit",
  minute: "2-digit",
});

export function formatTime(date: Date | string) {
  return timeFormat.format(new Date(date));
}

// "18:00–19:30"
export function formatRange(start: Date | string, durationMin: number) {
  const from = new Date(start);
  const to = new Date(from.getTime() + durationMin * 60_000);
  return `${formatTime(from)}–${formatTime(to)}`;
}

// "1 h 30 min", "45 min", "2 h"
export function formatDuration(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (!hours) return `${rest} min`;
  return rest ? `${hours} h ${rest} min` : `${hours} h`;
}

export function formatGuests(count: number) {
  return `${count} ${count === 1 ? "guest" : "guests"}`;
}

const dateFormat = new Intl.DateTimeFormat("en-GB", {
  weekday: "short",
  day: "numeric",
  month: "short",
});

// "Tue 13 Oct"
export function formatDate(date: Date) {
  return dateFormat.format(date).replace(",", "");
}
