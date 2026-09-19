import { isValidObjectId, type ClientSession } from 'mongoose'
import { Medicine, type MedicineDocument } from '../models/Medicine.js'
import { formatMoney, multiplyQuantity, multiplyRate, parseMoney, roundDivide } from '../utils/money.js'

export interface BillingItemInput { medicineId: string; quantity: number }
export interface BillingCalculationInput { items: BillingItemInput[]; discountAmount?: string; session?: ClientSession }

export class BillingCalculationError extends Error {
  statusCode: number
  constructor(message: string, statusCode = 400) { super(message); this.name = 'BillingCalculationError'; this.statusCode = statusCode }
}

interface CalculationLine { medicine: MedicineDocument & { _id: { toString(): string }; sellingPrice: { toString(): string }; gstPercentage: number; expiryDate: Date }; quantity: number; lineSubtotal: bigint; discountAmount: bigint; taxableAmount: bigint; gstAmount: bigint }

const ensureInput = (input: BillingCalculationInput): void => {
  if (!Array.isArray(input.items) || input.items.length === 0) throw new BillingCalculationError('At least one medicine is required.')
  const ids = new Set<string>()
  for (const item of input.items) {
    if (!isValidObjectId(item.medicineId)) throw new BillingCalculationError('Medicine not found.', 404)
    if (ids.has(item.medicineId)) throw new BillingCalculationError('Duplicate medicine items are not allowed.')
    ids.add(item.medicineId)
    if (!Number.isInteger(item.quantity) || item.quantity <= 0) throw new BillingCalculationError('Quantity must be greater than zero.')
  }
}

export const calculateBill = async (input: BillingCalculationInput) => {
  ensureInput(input)
  const discountText = input.discountAmount?.trim() || '0.00'
  if (!/^\d+(\.\d{1,2})?$/.test(discountText)) throw new BillingCalculationError('Discount must be a valid amount.')
  const discount = parseMoney(discountText)
  const medicines = await Medicine.find({ _id: { $in: input.items.map((item) => item.medicineId) } }).session(input.session ?? null)
  const byId = new Map(medicines.map((medicine) => [medicine._id.toString(), medicine]))
  const lines: CalculationLine[] = []
  for (const item of input.items) {
    const medicine = byId.get(item.medicineId)
    if (!medicine) throw new BillingCalculationError('Medicine not found.', 404)
    if (!medicine.isActive) throw new BillingCalculationError('Medicine is inactive.')
    if (item.quantity > medicine.stockQuantity) throw new BillingCalculationError('Insufficient stock.')
    if (medicine.expiryDate <= new Date()) throw new BillingCalculationError('Expired medicine cannot be sold.')
    const lineSubtotal = multiplyQuantity(parseMoney(medicine.sellingPrice.toString()), item.quantity)
    lines.push({ medicine: medicine as CalculationLine['medicine'], quantity: item.quantity, lineSubtotal, discountAmount: 0n, taxableAmount: 0n, gstAmount: 0n })
  }
  const subtotal = lines.reduce((total, line) => total + line.lineSubtotal, 0n)
  if (discount > subtotal) throw new BillingCalculationError('Discount cannot be greater than subtotal.')
  let allocated = 0n
  lines.forEach((line, index) => {
    const allocation = index === lines.length - 1 ? discount - allocated : (discount * line.lineSubtotal) / subtotal
    line.discountAmount = allocation
    line.taxableAmount = line.lineSubtotal - allocation
    line.gstAmount = multiplyRate(line.taxableAmount, line.medicine.gstPercentage)
    allocated += allocation
  })
  const taxableAmount = lines.reduce((total, line) => total + line.taxableAmount, 0n)
  const gstAmount = lines.reduce((total, line) => total + line.gstAmount, 0n)
  const grandTotal = taxableAmount + gstAmount
  return {
    items: lines.map((line) => ({ medicineId: line.medicine._id.toString(), name: line.medicine.name, batchNumber: line.medicine.batchNumber, expiryDate: line.medicine.expiryDate.toISOString(), mrp: line.medicine.mrp.toString(), quantity: line.quantity, unitPrice: line.medicine.sellingPrice.toString(), lineSubtotal: formatMoney(line.lineSubtotal), discountAmount: formatMoney(line.discountAmount), taxableAmount: formatMoney(line.taxableAmount), gstPercentage: line.medicine.gstPercentage.toFixed(2), gstAmount: formatMoney(line.gstAmount), lineTotal: formatMoney(line.taxableAmount + line.gstAmount) })),
    subtotal: formatMoney(subtotal), discountAmount: formatMoney(discount), taxableAmount: formatMoney(taxableAmount), gstAmount: formatMoney(gstAmount), grandTotal: formatMoney(grandTotal),
  }
}
