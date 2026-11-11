type Listener = (count: number) => void;

const listeners = new Set<Listener>();
let count = 0;
let timer: ReturnType<typeof setInterval> | null = null;

async function fetchCount() {
  try {
    const res = await fetch("/api/storefront-orders/count", {
      credentials: "include",
      cache: "no-store",
    });
    if (!res.ok) return;
    const data = await res.json().catch(() => ({}));
    const next = Number(data?.awaitingCount ?? 0);
    if (next !== count) {
      count = next;
      for (const fn of listeners) fn(count);
    }
  } catch {
    // ignore transient poll failures
  }
}

export function startOrderNotify(intervalMs = 30000) {
  if (timer) return;
  void fetchCount();
  timer = setInterval(fetchCount, intervalMs);
}

export function stopOrderNotify() {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}

export function subscribeOrderNotify(fn: Listener): () => void {
  listeners.add(fn);
  fn(count);
  return () => listeners.delete(fn);
}

export function getAwaitingCount() {
  return count;
}
