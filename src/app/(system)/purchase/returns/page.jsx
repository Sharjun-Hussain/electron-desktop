import { BRAND } from "@/lib/branding";
import ReturnList from "@/components/purchase/returns/ReturnList";
import React from "react";

const Page = () => {
    return <ReturnList />;
};

export default Page;

export const metadata = {
    title: `Purchase Returns | ${BRAND.PAGE_TITLE_SUFFIX}`,
    description: "Manage purchase returns",
};
