import { BRAND } from "@/lib/branding";
export const metadata = {
  title: `Forgot Password | ${BRAND.PAGE_TITLE_SUFFIX}`,
  description: `Recover your ${BRAND.APP_NAME} POS account access. Request a secure reset link for your industrial terminal credentials.`,
};

export default function ForgotPasswordLayout({ children }) {
  return children;
}
