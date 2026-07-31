import { BRAND } from "@/lib/branding";
export const metadata = {
  title: `Low Stock Summary | ${BRAND.PAGE_TITLE_SUFFIX}`,
  description: `Developed By : ${BRAND.APP_NAME} (PVT) Ltd.`,
};

export default function Layout({ children }) {
  return children;
}
