import { BRAND } from "@/lib/branding";
import CreateExpense from "@/components/expenses/create-expense";

export const metadata = {
  title: `New Expense | ${BRAND.PAGE_TITLE_SUFFIX}`,
  description: "Record a new expense",
};

export default function Page() {
  return <CreateExpense />;
}
