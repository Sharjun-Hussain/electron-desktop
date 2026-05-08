"use client";

import { useSearchParams } from "next/navigation";
import ProductionCompletionSheet from "@/components/production/production-completion-sheet";

export default function CompleteProductionOrderPage() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  
  return <ProductionCompletionSheet orderId={id} />;
}
