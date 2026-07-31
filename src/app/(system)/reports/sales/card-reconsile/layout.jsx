import { BRAND } from "@/lib/branding";
export const metadata = {
  title: `Card Reconciliation | ${BRAND.PAGE_TITLE_SUFFIX}`,
  description: `Developed By : ${BRAND.APP_NAME} (PVT) Ltd.`,
};

export default function Layout({ children }) {
  return children;
}
