import { BRAND } from "@/lib/branding";
export const metadata = {
  title: `Supplier Ledgers | ${BRAND.PAGE_TITLE_SUFFIX}`,
  description: 'Manage accounts payable, track supplier credit trends, and record settlements within your financial workstation.',
};

export default function SupplierLedgersLayout({ children }) {
  return children;
}
