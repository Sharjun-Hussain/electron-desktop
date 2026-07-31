import { BRAND } from "@/lib/branding";
import RecordCheque from "@/components/cheques/record-cheque";

export const metadata = {
  title: `Record New Cheque | ${BRAND.PAGE_TITLE_SUFFIX}`,
  description: "Record a new receivable or payable cheque",
};

export default function Page() {
  return <RecordCheque />;
}
