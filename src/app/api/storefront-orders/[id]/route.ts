import { NextResponse } from "next/server";
import { z } from "zod";

import { getSession } from "@/lib/auth";
import { ensureUserProfile, getCurrentUserRole, hasRole } from "@/server/auth/session";
import { updateOrderStatus, verifyOrder } from "@/server/storefront/service";

const PatchSchema = z.object({
  action: z.enum(["verify", "reject", "set-status"]),
  status: z.string().optional(),
  reason: z.string().max(300).optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSession();
    const user = (session as any)?.user ?? (session as any)?.data?.user ?? null;
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await ensureUserProfile(user);
    const role = await getCurrentUserRole();
    if (!hasRole(role, "manager")) {
      return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const parsed = PatchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Permintaan tidak valid." }, { status: 400 });
    }

    let order = null;
    if (parsed.data.action === "verify") {
      order = await verifyOrder(id, true);
    } else if (parsed.data.action === "reject") {
      const reason = String(parsed.data.reason || "").trim();
      if (reason.length < 3) {
        return NextResponse.json(
          { error: "Alasan penolakan wajib diisi (minimal 3 karakter)." },
          { status: 400 },
        );
      }
      order = await verifyOrder(id, false, reason);
    } else {
      const status = String(parsed.data.status || "").trim();
      if (!["pending", "confirmed", "preparing", "ready", "completed", "cancelled"].includes(status)) {
        return NextResponse.json({ error: "Status tidak valid." }, { status: 400 });
      }
      order = await updateOrderStatus(id, status);
    }

    if (!order) {
      return NextResponse.json({ error: "Pesanan tidak ditemukan." }, { status: 404 });
    }

    return NextResponse.json({ ok: true, order });
  } catch (error: any) {
    console.error("Storefront order update error:", error?.message ?? error);
    return NextResponse.json(
      { error: error?.message || "Gagal memperbarui pesanan." },
      { status: 500 },
    );
  }
}
