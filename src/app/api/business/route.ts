import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";

import { getSession } from "@/lib/auth";
import { getBusinessData, mutateBusiness } from "@/server/business/service";
import {
  ensureUserProfile,
  requireRole,
  ACTION_ROLES,
} from "@/server/auth/session";
import { createSeedData } from "@/lib/business-seed";

async function requireSession() {
  const cookieStore = await cookies();
  const demo = cookieStore.get("warjok_demo")?.value;
  if (demo === "1") {
    return { id: "demo-user" } as any;
  }
  
  const session = await getSession();
  const user =
    (session as any)?.user ?? (session as any)?.data?.user ?? null;

  if (user?.id) await ensureUserProfile(user);

  return user;
}

const BusinessQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(20),
  search: z.string().optional(),
  categoryId: z.string().optional(),
  status: z.string().optional(),
  stockFilter: z.string().optional(),
  payment: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
});

export async function GET(request: Request) {
  const cookieStore = await cookies();
  const demo = cookieStore.get("warjok_demo")?.value;
  if (demo === "1") {
    return NextResponse.json(createSeedData());
  }
  
  const user = await requireSession();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const parsed = BusinessQuerySchema.safeParse({
      page: searchParams.get("page") || undefined,
      pageSize: searchParams.get("pageSize") || undefined,
      search: searchParams.get("search") || undefined,
      categoryId: searchParams.get("categoryId") || undefined,
      status: searchParams.get("status") || undefined,
      stockFilter: searchParams.get("stockFilter") || undefined,
      payment: searchParams.get("payment") || undefined,
      from: searchParams.get("from") || undefined,
      to: searchParams.get("to") || undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Parameter query tidak valid." },
        { status: 400 }
      );
    }

    const data = await getBusinessData(parsed.data);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Business data error:", error);
    return NextResponse.json(
      { error: error?.message || "Gagal memuat data." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const demo = cookieStore.get("warjok_demo")?.value;
  if (demo === "1") {
    return NextResponse.json({ ok: true });
  }
  
  const user = await requireSession();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const action = String(body?.action ?? "");
    if (!action) {
      return NextResponse.json({ error: "Aksi wajib diisi." }, { status: 400 });
    }

    const requiredRole = ACTION_ROLES[action];
    if (requiredRole) {
      try {
        await requireRole(requiredRole);
      } catch (error: any) {
        return NextResponse.json(
          { error: error?.message || "Akses ditolak." },
          { status: error?.status ?? 403 }
        );
      }
    }

    const { getCurrentUserRole } = await import("@/server/auth/session");
    const result = await mutateBusiness(action, body?.payload ?? {}, {
      actingUserId: user.id,
      actingUserRole: await getCurrentUserRole(),
    });
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Business mutation error:", error);
    return NextResponse.json(
      { error: error?.message || "Gagal menyimpan data." },
      { status: error?.status ?? 400 }
    );
  }
}
