import { StorefrontTrackingPage } from "@/features/storefront/components/OrderPages";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <StorefrontTrackingPage orderId={id} />;
}
