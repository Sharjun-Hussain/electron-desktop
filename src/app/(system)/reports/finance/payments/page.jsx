import PaymentRegisterReport from "@/components/reports/finance/payments/PaymentRegisterReport";

export const metadata = {
  title: "Payment Register | Reports",
  description: "View and analyze outgoing payments to suppliers and for overhead expenses.",
};

export default function PaymentRegisterPage() {
  return <PaymentRegisterReport />;
}
