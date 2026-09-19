import mongoose, { isValidObjectId, Types, type FilterQuery, type HydratedDocument } from 'mongoose'
import { Customer } from '../models/Customer.js'
import { Medicine } from '../models/Medicine.js'
import { Payment, type PaymentMethod } from '../models/Payment.js'
import { Sale, type SaleDocument } from '../models/Sale.js'
import { SaleItem } from '../models/SaleItem.js'
import { calculateBill, type BillingItemInput } from './billing-calculation.service.js'
import { generateInvoiceNumber } from './invoice.service.js'

export interface CreateSaleInput { customerId?: string | null; items: BillingItemInput[]; discountAmount?: string; paymentMethod: PaymentMethod; clientRequestId?: string }

class SaleServiceError extends Error {
  statusCode: number
  constructor(message: string, statusCode = 400) { super(message); this.name = 'SaleServiceError'; this.statusCode = statusCode }
}

const paymentMethods: PaymentMethod[] = ['CASH', 'UPI', 'CARD', 'CREDIT']
const toDecimal = (value: string): Types.Decimal128 => Types.Decimal128.fromString(value)
const saleResponse = (sale: HydratedDocument<SaleDocument>) => ({ saleId: sale._id.toString(), invoiceNumber: sale.invoiceNumber, subtotal: sale.subtotal.toString(), discountAmount: sale.discountAmount.toString(), taxableAmount: sale.taxableAmount.toString(), gstAmount: sale.gstAmount.toString(), grandTotal: sale.grandTotal.toString(), paymentMethod: sale.paymentMethod, paymentStatus: sale.paymentStatus === 'CREDIT' ? 'PENDING' : 'PAID' })

const validateRequest = (input: CreateSaleInput, userId: string): void => {
  if (!userId || !isValidObjectId(userId)) throw new SaleServiceError('Authenticated user is required.', 401)
  if (!Array.isArray(input.items) || input.items.length === 0) throw new SaleServiceError('Cannot create a sale with an empty cart.')
  if (!paymentMethods.includes(input.paymentMethod)) throw new SaleServiceError('Invalid payment method.')
  if (input.clientRequestId && input.clientRequestId.length > 100) throw new SaleServiceError('Invalid client request ID.')
}

export const createSale = async (input: CreateSaleInput, userId: string) => {
  validateRequest(input, userId)
  if (input.clientRequestId) {
    const existing = await Sale.findOne({ clientRequestId: input.clientRequestId })
    if (existing) return saleResponse(existing)
  }
  const session = await mongoose.startSession()
  session.startTransaction()
  try {
    if (input.customerId !== undefined && input.customerId !== null) {
      if (!isValidObjectId(input.customerId)) throw new SaleServiceError('Customer not found.', 404)
      const customer = await Customer.findOne({ _id: input.customerId, isActive: true }).session(session)
      if (!customer) throw new SaleServiceError('Customer not found.', 404)
    }
    const calculation = await calculateBill({ items: input.items, discountAmount: input.discountAmount ?? '0.00', session })
    const invoiceNumber = await generateInvoiceNumber(session)
    const [sale] = await Sale.create([{
      invoiceNumber,
      clientRequestId: input.clientRequestId,
      customerId: input.customerId ? new Types.ObjectId(input.customerId) : null,
      items: [],
      subtotal: toDecimal(calculation.subtotal),
      discountAmount: toDecimal(calculation.discountAmount),
      taxableAmount: toDecimal(calculation.taxableAmount),
      gstAmount: toDecimal(calculation.gstAmount),
      grandTotal: toDecimal(calculation.grandTotal),
      paymentMethod: input.paymentMethod,
      paymentStatus: input.paymentMethod === 'CREDIT' ? 'CREDIT' : 'PAID',
      status: 'COMPLETED',
      createdBy: new Types.ObjectId(userId),
    }], { session })
    if (!sale) throw new SaleServiceError('Unable to create sale.', 500)
    const saleItems = calculation.items.map((line) => ({ saleId: sale._id, medicineId: new Types.ObjectId(line.medicineId), medicineName: line.name, batchNumber: line.batchNumber, expiryDate: new Date(line.expiryDate), quantity: line.quantity, unitPrice: toDecimal(line.unitPrice), mrp: toDecimal(line.mrp), gstPercentage: Number(line.gstPercentage), lineSubtotal: toDecimal(line.lineSubtotal), discountAmount: toDecimal(line.discountAmount), taxableAmount: toDecimal(line.taxableAmount), gstAmount: toDecimal(line.gstAmount), lineTotal: toDecimal(line.lineTotal) }))
    for (const item of input.items) {
      const update = await Medicine.updateOne({ _id: item.medicineId, isActive: true, stockQuantity: { $gte: item.quantity } }, { $inc: { stockQuantity: -item.quantity } }, { session })
      if (update.modifiedCount !== 1) throw new SaleServiceError('Insufficient stock.')
    }
    const createdItems = await SaleItem.create(saleItems, { session, ordered: true })
    sale.items = createdItems.map((item) => item._id)
    await sale.save({ session })
    await Payment.create([{
      saleId: sale._id,
      amount: toDecimal(calculation.grandTotal),
      method: input.paymentMethod,
      status: input.paymentMethod === 'CREDIT' ? 'PENDING' : 'PAID',
    }], { session })
    await session.commitTransaction()
    return saleResponse(sale)
  } catch (error: unknown) {
    try { await session.abortTransaction() } catch { /* preserve the original transaction error */ }
    const errorCode = typeof error === 'object' && error !== null && 'code' in error ? (error as { code?: number }).code : undefined
    if (errorCode === 20) throw new SaleServiceError('Sale transactions require MongoDB to run as a replica set.', 503)
    if (errorCode === 11000 && input.clientRequestId) {
      const existing = await Sale.findOne({ clientRequestId: input.clientRequestId })
      if (existing) return saleResponse(existing)
    }
    throw error
  } finally { await session.endSession() }
}
export interface SalesHistoryRequest { page?: number; limit?: number; search?: string; startDate?: string; endDate?: string }
export interface SalesHistoryItem { id: string; invoiceNumber: string; createdAt: string; customerName: string; customerPhone: string | null; paymentMethod: PaymentMethod; paymentStatus: SaleDocument['paymentStatus']; status: SaleDocument['status']; discountAmount: string; grandTotal: string; }
export interface SalesHistoryPagination { page: number; limit: number; total: number; totalPages: number }
export interface SalesHistoryResponse { sales: SalesHistoryItem[]; pagination: SalesHistoryPagination }

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const parseDate = (value: string | undefined): Date | null => {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

export const getSalesHistory = async ({ page = 1, limit = 20, search, startDate, endDate }: SalesHistoryRequest): Promise<SalesHistoryResponse> => {
  const normalizedPage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1
  const normalizedLimit = Number.isFinite(limit) && limit > 0 ? Math.min(Math.max(Math.floor(limit), 1), 100) : 20
  const query: FilterQuery<SaleDocument> = {}

  if (search?.trim()) {
    const term = search.trim()
    const invoiceRegex = new RegExp(escapeRegExp(term), 'i')
    const matchingCustomers = await Customer.find({
      $or: [
        { name: invoiceRegex },
        { phone: invoiceRegex },
      ],
    }).select('_id').lean()
    const customerIds = matchingCustomers.map((customer) => customer._id)
    query.$or = [{ invoiceNumber: invoiceRegex }]
    if (customerIds.length) query.$or.push({ customerId: { $in: customerIds } })
  }

  const parsedStartDate = parseDate(startDate)
  const parsedEndDate = parseDate(endDate)
  if (parsedStartDate || parsedEndDate) {
    query.createdAt = {}
    if (parsedStartDate) query.createdAt.$gte = parsedStartDate
    if (parsedEndDate) {
      const endOfDay = new Date(parsedEndDate)
      endOfDay.setHours(23, 59, 59, 999)
      query.createdAt.$lte = endOfDay
    }
  }

  const total = await Sale.countDocuments(query)
  const sales = await Sale.find(query)
    .sort({ createdAt: -1 })
    .skip((normalizedPage - 1) * normalizedLimit)
    .limit(normalizedLimit)
    .populate({ path: 'customerId', select: 'name phone' })
    .lean()

  return {
    sales: sales.map((sale) => ({
      id: sale._id.toString(),
      invoiceNumber: sale.invoiceNumber,
      createdAt: sale.createdAt.toISOString(),
      customerName: sale.customerId ? String((sale.customerId as { name?: string }).name ?? 'Walk-in Customer') : 'Walk-in Customer',
      customerPhone: sale.customerId ? String((sale.customerId as { phone?: string }).phone ?? null) : null,
      paymentMethod: sale.paymentMethod,
      paymentStatus: sale.paymentStatus,
      status: sale.status,
      discountAmount: sale.discountAmount.toString(),
      grandTotal: sale.grandTotal.toString(),
    })),
    pagination: {
      page: normalizedPage,
      limit: normalizedLimit,
      total,
      totalPages: Math.max(1, Math.ceil(total / normalizedLimit)),
    },
  }
}