// Which day's glow note this device has already seen, so the bell can show an unread dot.
// Kept on the device: it's a nicety, not something worth a database round trip.
const KEY = "glowjar:note-seen";
const EVENT = "glowjar:note-seen";

export function readSeenDate(): string | null {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function markSeen(date: string) {
  try {
    localStorage.setItem(KEY, date);
  } catch {
    // Private browsing: the dot just shows again next time.
  }
  window.dispatchEvent(new Event(EVENT));
}

export function subscribeToSeen(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(EVENT, onChange);
  };
}
