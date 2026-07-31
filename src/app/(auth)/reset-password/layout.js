import { BRAND } from "@/lib/branding";
export const metadata = {
  title: `Reset Password | ${BRAND.PAGE_TITLE_SUFFIX}`,
  description: `Create a new secure password for your ${BRAND.APP_NAME} POS account. Secure your industrial terminal access today.`,
};

export default function ResetPasswordLayout({ children }) {
  return children;
}
