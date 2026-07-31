import { BRAND } from "@/lib/branding";
import ExpenseManagement from "@/components/expenses/expense-management";

export const metadata = {
  title: `Expenses | ${BRAND.PAGE_TITLE_SUFFIX}`,
  description: "Manage business expenses",
};

export default function Page() {
  return <ExpenseManagement />;
}
