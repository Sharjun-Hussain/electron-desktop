import { BRAND } from "@/lib/branding";
export const metadata = {
  title: `Chart of Accounts | ${BRAND.PAGE_TITLE_SUFFIX}`,
  description: 'Manage your financial workstation accounts, monitor balances, and track transaction history in one centralized ledger.',
};

export default function AccountingLayout({ children }) {
  return children;
}
