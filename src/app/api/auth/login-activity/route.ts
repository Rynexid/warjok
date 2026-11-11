import { NextResponse } from "next/server";

import { eq, desc } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { db } from "@/server/db";
import { loginActivities, staff, staffLoginSessions } from "@/server/db/schema";
import { DEFAULT_BUSINESS_ID, DEFAULT_STORE_ID } from "@/server/db/schema/schema";

export async function POST(request: Request) {
  const session = await getSession();
  const user =
    (session as any)?.user ?? (session as any)?.data?.user ?? null;

  if (!user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { status, ipAddress, userAgent } = await request.json();

    await db.insert(loginActivities).values({
      userId: String(user.id),
      status: status ?? "success",
      ipAddress: ipAddress ?? null,
      userAgent: userAgent ?? null,
    });

    // Pastikan user yang login punya catatan di staff."Staff" agar muncul di /staff.
    const [existing] = await db
      .select({ id: staff.id })
      .from(staff)
      .where(eq(staff.userId, String(user.id)))
      .limit(1);

    if (!existing) {
      await db.insert(staff).values({
        id: crypto.randomUUID(),
        businessId: DEFAULT_BUSINESS_ID,
        storeId: DEFAULT_STORE_ID,
        userId: String(user.id),
        name: String(user.name ?? user.email ?? "Pengguna"),
        email: String(user.email ?? ""),
        role: "cashier",
        status: "active",
        joinedAt: new Date(),
        lastActive: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    // Catat sesi login staf dan update lastActive.
    const [staffRow] = await db
      .select({ id: staff.id })
      .from(staff)
      .where(eq(staff.userId, String(user.id)))
      .limit(1);

    if (staffRow) {
      await db.insert(staffLoginSessions).values({
        staffId: staffRow.id,
        ipAddress: ipAddress ?? null,
        userAgent: userAgent ?? null,
      });

      await db
        .update(staff)
        .set({ lastActive: new Date() })
        .where(eq(staff.id, staffRow.id));
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("Login activity error:", error);
    return NextResponse.json(
      { error: "Gagal mencatat aktivitas login." },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  const session = await getSession();
  const user =
    (session as any)?.user ?? (session as any)?.data?.user ?? null;

  if (!user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const limit = Number(searchParams.get("limit") ?? "50");

    const rows = await db
      .select()
      .from(loginActivities)
      .where(eq(loginActivities.userId, String(user.id)))
      .orderBy(desc(loginActivities.createdAt))
      .limit(limit > 100 ? 100 : limit);

    return NextResponse.json({ activities: rows });
  } catch (error: any) {
    console.error("Login activity error:", error);
    return NextResponse.json(
      { error: "Gagal memuat aktivitas login." },
      { status: 500 }
    );
  }
}
