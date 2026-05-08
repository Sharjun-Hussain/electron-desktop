import ShiftHistoryReport from "@/components/reports/shifts/ShiftHistoryReport";

export const metadata = {
  title: "Shift History & Session Audit",
  description: "Detailed logs of user sessions and cash reconciliation",
};

export default function ShiftsPage() {
  return <ShiftHistoryReport />;
}
