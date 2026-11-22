import { isValidObjectId, Types, type HydratedDocument } from 'mongoose'
import { Medicine, type MedicineDocument } from '../models/Medicine.js'

export interface MedicineInput {
  name: string
  genericName?: string
  barcode?: string
  batchNumber: string
  expiryDate: string | Date
  mrp: string | number
  sellingPrice: string | number
  gstPercentage: number
  stockQuantity: number
}

export interface MedicineUpdateInput extends Partial<MedicineInput> {}

export interface MedicineListQuery {
  page?: string
  limit?: string
  search?: string
}

export class MedicineServiceError extends Error {
  statusCode: number
  constructor(message: string, statusCode = 400) {
    super(message)
    this.name = 'MedicineServiceError'
    this.statusCode = statusCode
  }
}

const toMoney = (value: string | number, fieldName: string): Types.Decimal128 => {
  const text = String(value).trim()
  if (!/^\d+(\.\d{1,2})?$/.test(text)) throw new MedicineServiceError(`${fieldName} must be a valid amount.`)
  const decimal = Number(text)
  if (!Number.isFinite(decimal) || decimal <= 0) throw new MedicineServiceError(`${fieldName} must be greater than 0.`)
  return Types.Decimal128.fromString(text)
}

const validateDate = (value: string | Date): Date => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) throw new MedicineServiceError('Expiry date must be a valid date.')
  if (date <= new Date()) throw new MedicineServiceError('Expiry date must be in the future.')
  return date
}

const validateInput = (input: MedicineInput): Record<string, unknown> => {
  const name = input.name?.trim()
  const batchNumber = input.batchNumber?.trim()
  if (!name) throw new MedicineServiceError('Medicine name is required.')
  if (!batchNumber) throw new MedicineServiceError('Batch number is required.')
  const mrp = toMoney(input.mrp, 'MRP')
  const sellingPrice = toMoney(input.sellingPrice, 'Selling price')
  if (Number(sellingPrice.toString()) > Number(mrp.toString())) throw new MedicineServiceError('Selling price cannot be greater than MRP.')
  if (!Number.isFinite(input.gstPercentage) || input.gstPercentage < 0) throw new MedicineServiceError('GST percentage must be 0 or greater.')
  if (!Number.isInteger(input.stockQuantity) || input.stockQuantity < 0) throw new MedicineServiceError('Stock quantity must be 0 or greater.')
  const expiryDate = validateDate(input.expiryDate)
  const barcode = input.barcode?.trim() || undefined
  return { name, genericName: input.genericName?.trim() || undefined, barcode, batchNumber, expiryDate, mrp, sellingPrice, gstPercentage: input.gstPercentage, stockQuantity: input.stockQuantity, isActive: true }
}

const ensureBarcodeAvailable = async (barcode: string | undefined, batchNumber?: string, excludeId?: string): Promise<void> => {
  if (!barcode) return
  const query: { barcode: string; batchNumber?: string; _id?: { $ne: string } } = { barcode }
  if (batchNumber) query.batchNumber = batchNumber
  if (excludeId) query._id = { $ne: excludeId }
  if (await Medicine.exists(query)) throw new MedicineServiceError('A medicine with this barcode and batch number already exists.', 409)
}

const serialize = (medicine: HydratedDocument<MedicineDocument>) => ({
  id: medicine._id.toString(), name: medicine.name, genericName: medicine.genericName, barcode: medicine.barcode,
  batchNumber: medicine.batchNumber, expiryDate: medicine.expiryDate.toISOString(), mrp: medicine.mrp.toString(),
  sellingPrice: medicine.sellingPrice.toString(), gstPercentage: medicine.gstPercentage, stockQuantity: medicine.stockQuantity,
  isActive: medicine.isActive, createdAt: medicine.createdAt, updatedAt: medicine.updatedAt,
})

export const getMedicines = async ({ page = '1', limit = '20', search = '' }: MedicineListQuery) => {
  const currentPage = Math.max(1, Number.parseInt(page, 10) || 1)
  const pageSize = Math.min(100, Math.max(1, Number.parseInt(limit, 10) || 20))
  const normalizedSearch = search.trim()
  const filter: Record<string, unknown> = { isActive: true }
  if (normalizedSearch) {
    const pattern = new RegExp(normalizedSearch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
    filter.$or = [{ name: pattern }, { genericName: pattern }, { barcode: pattern }, { batchNumber: pattern }]
  }
  const [medicines, total] = await Promise.all([
    Medicine.find(filter).sort({ createdAt: -1 }).skip((currentPage - 1) * pageSize).limit(pageSize),
    Medicine.countDocuments(filter),
  ])
  return { medicines: medicines.map(serialize), pagination: { page: currentPage, limit: pageSize, total, totalPages: Math.ceil(total / pageSize) } }
}

export const getMedicineById = async (id: string) => {
  if (!isValidObjectId(id)) throw new MedicineServiceError('Medicine not found.', 404)
  const medicine = await Medicine.findOne({ _id: id, isActive: true })
  if (!medicine) throw new MedicineServiceError('Medicine not found.', 404)
  return serialize(medicine)
}

export const createMedicine = async (input: MedicineInput) => {
  const data = validateInput(input)
  await ensureBarcodeAvailable(data.barcode as string | undefined, String(data.batchNumber))
  try { return serialize(await Medicine.create(data)) }
  catch (error: unknown) {
    if (error instanceof Error && 'code' in error && (error as { code?: number }).code === 11000) throw new MedicineServiceError('A medicine with this barcode and batch number already exists.', 409)
    throw error
  }
}

export interface BulkMedicineInput { row: number; id?: string; medicine: MedicineInput }

export interface BulkMedicineFailure {
  row: number
  id?: string
  name?: string
  genericName?: string
  barcode?: string
  batchNumber?: string
  expiryDate?: string
  mrp?: string | number
  sellingPrice?: string | number
  gstPercentage?: number
  stockQuantity?: number
  error: string
}

export const importMedicines = async (rows: BulkMedicineInput[]): Promise<{ imported: number; updated: number; failed: BulkMedicineFailure[] }> => {
  if (!Array.isArray(rows) || rows.length === 0) throw new MedicineServiceError('No product rows supplied.')
  if (rows.length > 500) throw new MedicineServiceError('A maximum of 500 products can be imported at once.')

  const valid: Record<string, unknown>[] = []
  const failed: BulkMedicineFailure[] = []
  let imported = 0
  let updated = 0
  const inFileKeys = new Set<string>()

  for (const item of rows) {
    try {
      const data = validateInput(item.medicine)
      const barcode = data.barcode as string | undefined
      const batchNumber = String(data.batchNumber)
      const productId = item.id?.trim()

      if (productId) {
        await updateMedicine(productId, item.medicine)
        updated += 1
        continue
      }

      const key = `${barcode ?? ''}|${batchNumber}`
      if (barcode && inFileKeys.has(key)) throw new MedicineServiceError('A medicine with this barcode and batch number appears more than once in the file.', 409)
      await ensureBarcodeAvailable(barcode, batchNumber)
      if (barcode) inFileKeys.add(key)
      valid.push(data)
    } catch (error: unknown) {
      failed.push({
        row: item.row,
        id: item.id,
        name: item.medicine?.name,
        genericName: item.medicine?.genericName,
        barcode: item.medicine?.barcode,
        batchNumber: item.medicine?.batchNumber,
        expiryDate: item.medicine?.expiryDate?.toString(),
        mrp: item.medicine?.mrp,
        sellingPrice: item.medicine?.sellingPrice,
        gstPercentage: item.medicine?.gstPercentage,
        stockQuantity: item.medicine?.stockQuantity,
        error: error instanceof Error ? error.message : 'Invalid product row.',
      })
    }
  }

  if (valid.length > 0) {
    await Medicine.insertMany(valid)
    imported = valid.length
  }
  return { imported, updated, failed }
}

export const updateMedicine = async (id: string, input: MedicineUpdateInput) => {
  if (!isValidObjectId(id)) throw new MedicineServiceError('Medicine not found.', 404)
  const existing = await Medicine.findOne({ _id: id, isActive: true })
  if (!existing) throw new MedicineServiceError('Medicine not found.', 404)
  const merged: MedicineInput = { name: input.name ?? existing.name, genericName: input.genericName ?? existing.genericName, barcode: input.barcode ?? existing.barcode, batchNumber: input.batchNumber ?? existing.batchNumber, expiryDate: input.expiryDate ?? existing.expiryDate, mrp: input.mrp ?? existing.mrp.toString(), sellingPrice: input.sellingPrice ?? existing.sellingPrice.toString(), gstPercentage: input.gstPercentage ?? existing.gstPercentage, stockQuantity: input.stockQuantity ?? existing.stockQuantity }
  const data = validateInput(merged)
  await ensureBarcodeAvailable(data.barcode as string | undefined, String(data.batchNumber), id)
  try { Object.assign(existing, data); return serialize(await existing.save()) }
  catch (error: unknown) {
    if (error instanceof Error && 'code' in error && (error as { code?: number }).code === 11000) throw new MedicineServiceError('A medicine with this barcode already exists.', 409)
    throw error
  }
}

export const deleteMedicine = async (id: string): Promise<void> => {
  if (!isValidObjectId(id)) throw new MedicineServiceError('Medicine not found.', 404)
  const medicine = await Medicine.findOne({ _id: id, isActive: true })
  if (!medicine) throw new MedicineServiceError('Medicine not found.', 404)
  medicine.isActive = false
  await medicine.save()
}
