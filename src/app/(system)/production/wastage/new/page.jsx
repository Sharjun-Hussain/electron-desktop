import WastageForm from "@/components/production/wastage-form";

export const metadata = {
  title: "Record Wastage | Manufacturing",
  description: "Log inventory loss and production wastage",
};

export default function NewWastagePage() {
  return <WastageForm />;
}
