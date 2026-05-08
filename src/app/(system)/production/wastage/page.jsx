import WastageManagement from "@/components/production/wastage-management";

export const metadata = {
  title: "Wastage Log | Manufacturing",
  description: "View and manage production and inventory losses",
};

export default function WastagePage() {
  return <WastageManagement />;
}
