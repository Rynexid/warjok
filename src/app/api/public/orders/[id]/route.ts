import { NextResponse } from "next/server";

import { getStorefrontOrder } from "@/server/storefront/service";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const order = await getStorefrontOrder(id);
    if (!order) {
      return NextResponse.json(
        { error: "Pesanan tidak ditemukan." },
        { status: 404 },
      );
    }

    const items = (order.items || []).map((i: any) => ({
      productId: i.productId,
      productName: i.name ?? i.productName ?? "Item",
      variantName: i.variantName ?? null,
      quantity: Number(i.quantity || 0),
      unitPrice: Number(i.unitPrice || 0),
      subtotal: Number(i.lineTotal ?? i.subtotal ?? 0),
      notes: i.notes ?? null,
    }));

    const paymentStatus = String(order.paymentStatus || "").toLowerCase();
    const payState = paymentStatus === "awaiting_verification" ? "AWAITING_VERIFICATION" : paymentStatus.toUpperCase();

    return NextResponse.json({
      ok: true,
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        orderStatus: order.status,
        paymentStatus: order.paymentStatus,
        orderType: order.orderType,
        guest: { name: order.guestName, phone: order.guestPhone },
        notes: order.notes,
        items,
        totals: {
          subtotal: order.subtotal,
          discount: order.discountTotal,
          tax: order.taxTotal,
          total: order.grandTotal,
        },
        payment: {
          id: order.id,
          status: payState,
          method: order.paymentMethod || "manual_transfer",
          instructions: order.paymentInstructions || null,
          proofSubmitted: !!order.proofSubmitted,
          proofUrl: order.proofUrl || null,
        },
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        paidAt: order.paidAt,
      },
    });
  } catch (error: any) {
    console.error("Order error:", error?.message ?? error);
    return NextResponse.json(
      { error: error?.message || "Gagal memuat pesanan." },
      { status: 500 },
    );
  }
}
