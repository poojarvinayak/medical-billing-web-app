import { Customer } from '../models/Customer.js'
import { Medicine } from '../models/Medicine.js'
import { Sale } from '../models/Sale.js'

export interface RecentSaleSummary {
  id: string
  invoiceNumber: string
  customerName: string
  grandTotal: string
  status: 'COMPLETED' | 'CANCELLED'
  createdAt: string
}

export interface ReminderCustomerSummary {
  id: string
  name: string
  phone: string
  reminderDate: string
}

export interface DashboardSummary {
  totalSalesToday: number
  totalRevenueToday: string
  totalCustomers: number
  totalMedicines: number
  lowStockMedicines: number
  expiringSoonMedicines: number
  recentSales: RecentSaleSummary[]
  reminderCustomers: ReminderCustomerSummary[]
}

export const getDashboardSummary = async (): Promise<DashboardSummary> => {
  const now = new Date()
  const todayStart = new Date(now)
  todayStart.setHours(0, 0, 0, 0)

  const tomorrow = new Date(todayStart)
  tomorrow.setDate(todayStart.getDate() + 1)

  const expiringSoonThreshold = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
  const reminderStart = new Date(now)
  reminderStart.setHours(0, 0, 0, 0)
  reminderStart.setDate(reminderStart.getDate() - 30)
  const reminderEnd = new Date(reminderStart)
  reminderEnd.setDate(reminderStart.getDate() + 7)

  const [totalCustomers, totalMedicines, lowStockMedicines, expiringSoonMedicines, salesTodayCount, salesTodayRevenueResult, recentSalesRaw, reminderCustomersRaw] = await Promise.all([
    Customer.countDocuments({ isActive: true }),
    Medicine.countDocuments({ isActive: true }),
    Medicine.countDocuments({ isActive: true, stockQuantity: { $gt: 0, $lte: 10 } }),
    Medicine.countDocuments({ isActive: true, expiryDate: { $gt: now, $lte: expiringSoonThreshold } }),
    Sale.countDocuments({ status: 'COMPLETED', createdAt: { $gte: todayStart, $lt: tomorrow } }),
    Sale.aggregate([
      { $match: { status: 'COMPLETED', createdAt: { $gte: todayStart, $lt: tomorrow } } },
      { $group: { _id: null, total: { $sum: '$grandTotal' } } },
    ]),
    Sale.find({ status: 'COMPLETED' }).sort({ createdAt: -1 }).limit(5).populate({ path: 'customerId', select: 'name' }).exec(),
    Customer.find({ isActive: true, reminderDate: { $gte: reminderStart, $lte: reminderEnd } }).sort({ reminderDate: 1 }).limit(8).select('_id name phone reminderDate').lean(),
  ])

  const totalRevenueToday = String(salesTodayRevenueResult[0]?.total ?? '0')

  const recentSales = recentSalesRaw.map((sale) => ({
    id: sale._id.toString(),
    invoiceNumber: sale.invoiceNumber,
    customerName: sale.customerId && typeof sale.customerId === 'object' && 'name' in sale.customerId && typeof sale.customerId.name === 'string' ? sale.customerId.name : 'Walk-in',
    grandTotal: sale.grandTotal.toString(),
    status: sale.status,
    createdAt: sale.createdAt.toISOString(),
  }))

  return {
    totalSalesToday: salesTodayCount,
    totalRevenueToday,
    totalCustomers,
    totalMedicines,
    lowStockMedicines,
    expiringSoonMedicines,
    recentSales,
    reminderCustomers: reminderCustomersRaw.map((customer) => ({ id: customer._id.toString(), name: customer.name, phone: customer.phone, reminderDate: customer.reminderDate?.toISOString() ?? '' })),
  }
}
