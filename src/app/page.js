import { BRAND } from "@/lib/branding";
import Dashboard from '@/components/dashboard/DashboardPage'
import React from 'react'

export const metadata = {
  title: `Store Dashboard | Sales & Inventory | ${BRAND.PAGE_TITLE_SUFFIX}`,
  description: `Check your sales today, see pending bills, and track your stock levels easily with the ${BRAND.APP_NAME} POS store dashboard.`,
};

const page = () => {
  return (
    <Dashboard/>
  )
}

export default page