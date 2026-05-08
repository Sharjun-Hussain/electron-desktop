import Dashboard from '@/components/dashboard/DashboardPage'
import React from 'react'

export const metadata = {
  title: "Store Dashboard | Sales & Inventory | Inzeedo POS",
  description: "Check your sales today, see pending bills, and track your stock levels easily with the Inzeedo POS store dashboard.",
};

const page = () => {
  return (
    <Dashboard/>
  )
}

export default page