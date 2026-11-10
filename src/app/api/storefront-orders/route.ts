import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth";
import { ensureUserProfile, getCurrentUserRole, hasRole } from "@/server/auth/session";
import { listStorefrontOrders } from "@/server/storefront/service";

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

    const orders = await listStorefrontOrders();
    return NextResponse.json({ ok: true, orders });
  } catch (error: any) {
    console.error("Storefront orders list error:", error?.message ?? error);
    return NextResponse.json(
      { error: error?.message || "Gagal memuat pesanan." },
      { status: 500 },
    );
  }
}
