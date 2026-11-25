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
