import { Banknote, CreditCard, QrCode, Smartphone, ScrollText } from "lucide-react";

export const AVAILABLE_PAYMENTS = [
  { id: "cash", label: "Cash", icon: Banknote, desc: "Physical currency" },
  { id: "card", label: "Card Terminal", icon: CreditCard, desc: "Credit/Debit transactions" },
  { id: "online", label: "Online Transfer", icon: CreditCard, desc: "Bank transfer basis" },
  { id: "qr", label: "QR Payment", icon: QrCode, desc: "Scan to pay" },
  { id: "wallet", label: "Digital Wallet", icon: Smartphone, desc: "Apple Pay / Google Pay" },
  { id: "cheque", label: "Cheque Basis", icon: ScrollText, desc: "Physical cheque settlement" },
];
