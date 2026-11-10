import dns from "node:dns";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

// Neon resolves to IPv6 first on some networks; prefer IPv4 to avoid ENETUNREACH
// timeouts during local dev (safe no-op where IPv4 is already preferred).
try {
  dns.setDefaultResultOrder("ipv4first");
} catch {
  /* ignore on older runtimes */
}

const connectionString =
  process.env.DATABASE_URL_UNPOOLED ||
  process.env.DATABASE_URL ||
  "postgres://dummy:dummy@localhost:5432/dummy";

/**
 * Drizzle selalu menuliskan nama schema secara eksplisit (mis.
 * `"core"."Users"`), jadi tidak perlu mengatur `search_path` di koneksi.
 * Pooler Neon bisa lambat saat cold start; beri timeout wajar.
 */
export const pool = new Pool({
  connectionString,
  connectionTimeoutMillis: 15_000,
  idleTimeoutMillis: 30_000,
  max: 10,
});

export const db = drizzle(pool);
