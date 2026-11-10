import { NextResponse } from "next/server";

import { getStorefrontOrder, submitProof } from "@/server/storefront/service";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const orderId = String(formData.get("orderId") || "");
    const paymentId = String(formData.get("paymentId") || "");
    const file = formData.get("file");

    if (!orderId) {
      return NextResponse.json({ error: "Data bukti tidak valid." }, { status: 400 });
    }

    const order = await getStorefrontOrder(orderId);
    if (!order) {
      return NextResponse.json({ error: "Pesanan tidak ditemukan." }, { status: 404 });
    }

    if (paymentId && paymentId !== order.id && paymentId !== order.orderNumber) {
      return NextResponse.json({ error: "Payment ID tidak sesuai." }, { status: 400 });
    }

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "Pilih file bukti transfer." }, { status: 400 });
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json({ error: "File terlalu besar (maksimal 5MB)." }, { status: 400 });
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Format file tidak didukung (JPG, PNG, WebP, PDF)." },
        { status: 400 },
      );
    }

    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");
    const safeType = file.type || "application/octet-stream";
    const proofUrl = `data:${safeType};base64,${base64}`;

    const updated = await submitProof(orderId, proofUrl);
    if (!updated) {
      return NextResponse.json({ error: "Gagal menyimpan bukti." }, { status: 500 });
    }

    return NextResponse.json({ ok: true, proofUrl, order: updated });
  } catch (error: any) {
    console.error("Proof error:", error?.message ?? error);
    return NextResponse.json(
      { error: error?.message || "Upload gagal." },
      { status: 500 },
    );
  }
}
