"use client";

import { useSearchParams } from "next/navigation";
import ViewExpense from "@/components/expenses/ViewExpense";

export default function ExpenseDetailPage() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  
  return <ViewExpense id={id} />;
}
