import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth";
import { ensureUserProfile, getCurrentUserRole, hasRole } from "@/server/auth/session";
import { db } from "@/server/db";
import { storefrontOrders } from "@/server/db/schema/storefront";
import { count, eq } from "drizzle-orm";

export async function GET() {
  try {
    const session = await getSession();
    const user = (session as any)?.user ?? (session as any)?.data?.user ?? null;
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await ensureUserProfile(user);
    const role = await getCurrentUserRole();
    if (!hasRole(role, "manager")) {
      return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
    }

    const [{ count: c }] = await db
      .select({ count: count() })
      .from(storefrontOrders)
      .where(eq(storefrontOrders.proofSubmitted, true));

    return NextResponse.json({ ok: true, awaitingCount: Number(c ?? 0) });
  } catch (error: any) {
    console.error("Storefront orders count error:", error?.message ?? error);
    return NextResponse.json(
      { error: error?.message || "Gagal menghitung pesanan." },
      { status: 500 },
    );
  }
}
