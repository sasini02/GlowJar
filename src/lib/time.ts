/** The current hour (0–23) in the given IANA timezone. */
export function localHour(timezone: string, now = new Date()): number {
  const hour = new Intl.DateTimeFormat("en-GB", { timeZone: timezone, hour: "numeric", hourCycle: "h23" }).format(now);
  return Number(hour);
}

export function greetingFor(hour: number): string {
  if (hour >= 5 && hour < 12) return "Good morning";
  if (hour >= 12 && hour < 18) return "Good afternoon";
  if (hour >= 18 && hour < 23) return "Good evening";
  return "Hello";
}

export type TimeOfDay = "morning" | "today" | "tonight";

/** The word the mood check-in uses for now: "How are you feeling this morning / today / tonight?" */
export function timeOfDay(hour: number): TimeOfDay {
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 18) return "today";
  return "tonight";
}

/** "this morning", "today" or "tonight", for use mid-sentence. */
export function timeOfDayPhrase(moment: TimeOfDay): string {
  return moment === "morning" ? "this morning" : moment;
}

/** "2h", "3d" style age for small cards; "now" under a minute. */
export function formatAgo(timestamp: string, now: number): string {
  const minutes = Math.max(0, Math.floor((now - new Date(timestamp).getTime()) / 60_000));
  if (minutes < 1) return "now";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}
