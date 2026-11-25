// Wins written while offline wait in IndexedDB on this device until the app is
// back online. Browser only.
import type { WinInput } from "@/lib/wins/validation";

export type PendingWin = WinInput & {
  id: string;
  /** The account that wrote it, so a shared device never posts into someone else's jar. Null if unknown. */
  ownerId: string | null;
  queuedAt: string;
};

const DB_NAME = "glowjar";
const STORE = "pending-wins";
const OWNER_KEY = "glowjar:user";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE, { keyPath: "id" });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function withStore<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDb();
  try {
    return await new Promise<T>((resolve, reject) => {
      const transaction = db.transaction(STORE, mode);
      const request = run(transaction.objectStore(STORE));
      transaction.oncomplete = () => resolve(request.result);
      transaction.onerror = () => reject(transaction.error);
    });
  } finally {
    db.close();
  }
}

/** Remembered while online, so a win written on the offline page knows whose it is. */
export function rememberOwner(userId: string) {
  try {
    localStorage.setItem(OWNER_KEY, userId);
  } catch {
    // Storage can be blocked (private mode); the win is then queued without an owner.
  }
}

function rememberedOwner(): string | null {
  try {
    return localStorage.getItem(OWNER_KEY);
  } catch {
    return null;
  }
}

export async function queueWin(win: WinInput): Promise<void> {
  const pending: PendingWin = {
    ...win,
    id: crypto.randomUUID(),
    ownerId: rememberedOwner(),
    queuedAt: new Date().toISOString(),
  };
  await withStore("readwrite", (store) => store.put(pending));
}

export async function pendingWinsFor(userId: string): Promise<PendingWin[]> {
  const all = await withStore<PendingWin[]>("readonly", (store) => store.getAll());
  return all
    .filter((win) => win.ownerId === userId || win.ownerId === null)
    .sort((a, b) => a.queuedAt.localeCompare(b.queuedAt));
}

export async function removePendingWin(id: string): Promise<void> {
  await withStore("readwrite", (store) => store.delete(id));
}
