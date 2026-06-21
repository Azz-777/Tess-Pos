interface Entry {
  value: unknown;
  expiresAt: number;
}

// In-process cache for the sales report. Two safety limits on top of plain
// memoisation:
//   - TTL: an entry self-expires, so even if a `paid` webhook lands on a
//     different process (whose invalidateTenant() this instance never sees),
//     stale data heals within TTL_MS instead of living forever.
//   - MAX_ENTRIES: bounds memory. Each distinct (tenant, from, to) is a key, so
//     an admin probing many date ranges could otherwise grow the map without
//     limit. Map preserves insertion order, so the oldest key is evicted first
//     and a cache hit re-inserts to mark the entry as recently used (LRU).
const store = new Map<string, Entry>();
const TTL_MS = 60_000;
const MAX_ENTRIES = 500;

export function buildKey(tenantId: string, from: string, to: string): string {
  return `${tenantId}:${from}:${to}`;
}

export function getCached(key: string): unknown | undefined {
  const entry = store.get(key);
  if (!entry) {
    return undefined;
  }
  if (entry.expiresAt <= Date.now()) {
    store.delete(key);
    return undefined;
  }
  // Mark as most-recently-used.
  store.delete(key);
  store.set(key, entry);
  return entry.value;
}

export function setCached(key: string, value: unknown): void {
  store.set(key, { value, expiresAt: Date.now() + TTL_MS });
  if (store.size > MAX_ENTRIES) {
    const oldest = store.keys().next().value;
    if (oldest !== undefined) {
      store.delete(oldest);
    }
  }
}

export function invalidateTenant(tenantId: string): void {
  for (const key of store.keys()) {
    if (key.startsWith(`${tenantId}:`)) {
      store.delete(key);
    }
  }
}
