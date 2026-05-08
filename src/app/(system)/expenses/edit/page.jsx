"use client";

import { useSearchParams } from "next/navigation";
import EditExpense from "@/components/expenses/EditExpense";

export default function EditExpensePage() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  
  return <EditExpense id={id} />;
}
