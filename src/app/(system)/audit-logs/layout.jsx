import { BRAND } from "@/lib/branding";
export const metadata = {
  title: `System Audit Logs | Security & Activity Trace | ${BRAND.PAGE_TITLE_SUFFIX}`,
  description: "Monitor and analyze system-wide activity with detailed forensic audit logs. Track operator actions, security events, and data changes across your organization's POS infrastructure.",
};

export default function AuditLogsLayout({ children }) {
  return <>{children}</>;
}
