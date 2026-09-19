import { Schema, model, type Types } from 'mongoose'

export interface SaleItemDocument {
  saleId: Types.ObjectId
  medicineId: Types.ObjectId
  medicineName: string
  batchNumber: string
  expiryDate: Date
  quantity: number
  unitPrice: Types.Decimal128
  mrp: Types.Decimal128
  lineSubtotal: Types.Decimal128
  discountAmount: Types.Decimal128
  gstPercentage: number
  taxableAmount: Types.Decimal128
  gstAmount: Types.Decimal128
  lineTotal: Types.Decimal128
  createdAt: Date
  updatedAt: Date
}

const saleItemSchema = new Schema<SaleItemDocument>({
  saleId: { type: Schema.Types.ObjectId, ref: 'Sale', required: true, index: true },
  medicineId: { type: Schema.Types.ObjectId, ref: 'Medicine', required: true, index: true },
  medicineName: { type: String, required: true },
  batchNumber: { type: String, required: true },
  expiryDate: { type: Date, required: true },
  quantity: { type: Number, required: true, min: 1 },
  unitPrice: { type: Schema.Types.Decimal128, required: true },
  mrp: { type: Schema.Types.Decimal128, required: true },
  lineSubtotal: { type: Schema.Types.Decimal128, required: true },
  discountAmount: { type: Schema.Types.Decimal128, required: true, default: '0' },
  gstPercentage: { type: Number, required: true, min: 0 },
  taxableAmount: { type: Schema.Types.Decimal128, required: true },
  gstAmount: { type: Schema.Types.Decimal128, required: true },
  lineTotal: { type: Schema.Types.Decimal128, required: true },
}, { timestamps: true })

export const SaleItem = model<SaleItemDocument>('SaleItem', saleItemSchema)
