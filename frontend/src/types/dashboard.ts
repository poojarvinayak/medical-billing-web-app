export interface RecentDashboardSale {
  id: string
  invoiceNumber: string
  customerName: string
  grandTotal: string
  status: 'COMPLETED' | 'CANCELLED'
  createdAt: string
}

export interface DashboardSummary {
  totalSalesToday: number
  totalRevenueToday: string
  totalCustomers: number
  totalMedicines: number
  lowStockMedicines: number
  expiringSoonMedicines: number
  recentSales: RecentDashboardSale[]
}
