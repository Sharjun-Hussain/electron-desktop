import { BRAND } from "@/lib/branding";
export const metadata = {
  title: `Customer Ledgers | ${BRAND.PAGE_TITLE_SUFFIX}`,
  description: 'Track customer balances, credit history, and payment settlements in a high-density financial workstation.',
};

export default function CustomerLedgersLayout({ children }) {
  return children;
}
