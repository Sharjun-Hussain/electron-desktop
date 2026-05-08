"use client";

import { useSearchParams } from "next/navigation";
import ProductionDetailView from "@/components/production/production-detail-view";

export default function ProductionDetailPage() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  
  return <ProductionDetailView orderId={id} />;
}
