import { BRAND } from "@/lib/branding";
import ExpenseCategoryManagement from "@/components/expense-categories/expense-category-management";

export const metadata = {
  title: `Expense Categories | ${BRAND.PAGE_TITLE_SUFFIX}`,
  description: "Manage expense categories",
};

export default function Page() {
  return <ExpenseCategoryManagement />;
}
