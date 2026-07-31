import { BRAND } from "@/lib/branding";
export const metadata = {
  title: `Accounting Reports | ${BRAND.PAGE_TITLE_SUFFIX}`,
  description: 'Generate and analyze comprehensive financial reports, including balance sheets, P&L statements, and trial balances.',
};

export default function AccountingReportsLayout({ children }) {
  return children;
}
