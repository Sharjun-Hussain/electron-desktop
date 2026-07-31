import { BRAND } from "@/lib/branding";
export const metadata = {
  title: `Manual Journal Entry | ${BRAND.PAGE_TITLE_SUFFIX}`,
  description: 'Record multi-line financial adjustments, owner investments, and manual transactions with balanced debit and credit entries.',
};

export default function JournalLayout({ children }) {
  return children;
}
