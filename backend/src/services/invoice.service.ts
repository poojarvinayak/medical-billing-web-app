import type { ClientSession } from 'mongoose'
import { isValidObjectId, type HydratedDocument } from 'mongoose'
import { Counter } from '../models/Counter.js'
import { Customer } from '../models/Customer.js'
import { Payment } from '../models/Payment.js'
import { Sale, type SaleDocument } from '../models/Sale.js'
import { SaleItem } from '../models/SaleItem.js'

export class InvoiceServiceError extends Error {
  statusCode: number
  constructor(message: string, statusCode = 400) { super(message); this.name = 'InvoiceServiceError'; this.statusCode = statusCode }
}

export const generateInvoiceNumber = async (session: ClientSession): Promise<string> => {
  const counter = await Counter.findOneAndUpdate(
    { _id: 'invoice' },
    { $inc: { sequence: 1 } },
    { new: true, upsert: true, session, setDefaultsOnInsert: true },
  )
  if (!counter) throw new Error('Unable to generate invoice number.')
  return `INV-${counter.sequence.toString().padStart(6, '0')}`
}

export const getInvoiceBySaleId = async (saleId: string) => {
  if (!isValidObjectId(saleId)) throw new InvoiceServiceError('Invoice not found.', 404)
  const sale = await Sale.findById(saleId) as HydratedDocument<SaleDocument> | null
  if (!sale) throw new InvoiceServiceError('Invoice not found.', 404)
  const [items, payment, customer] = await Promise.all([
    SaleItem.find({ saleId: sale._id }).sort({ createdAt: 1 }),
    Payment.findOne({ saleId: sale._id }).sort({ createdAt: -1 }),
    sale.customerId ? Customer.findById(sale.customerId) : Promise.resolve(null),
  ])
  if (!payment) throw new InvoiceServiceError('Invoice payment record not found.', 404)
  return {
    sale: { id: sale._id.toString(), invoiceNumber: sale.invoiceNumber, createdAt: sale.createdAt, subtotal: sale.subtotal.toString(), discountAmount: sale.discountAmount.toString(), taxableAmount: sale.taxableAmount.toString(), gstAmount: sale.gstAmount.toString(), grandTotal: sale.grandTotal.toString() },
    customer: customer ? { name: customer.name, phone: customer.phone, address: customer.address, city: customer.city, state: customer.state, pincode: customer.pincode } : { name: 'Walk-in Customer', phone: null },
    items: items.map((item) => ({ medicineName: item.medicineName, batchNumber: item.batchNumber, expiryDate: `${item.expiryDate.getFullYear()}-${String(item.expiryDate.getMonth() + 1).padStart(2, '0')}`, quantity: item.quantity, unitPrice: item.unitPrice.toString(), mrp: item.mrp.toString(), gstPercentage: item.gstPercentage.toFixed(2), lineSubtotal: item.lineSubtotal.toString(), discountAmount: item.discountAmount.toString(), taxableAmount: item.taxableAmount.toString(), gstAmount: item.gstAmount.toString(), lineTotal: item.lineTotal.toString() })),
    payment: { method: payment.method, status: payment.status, amount: payment.amount.toString() },
  }
}
