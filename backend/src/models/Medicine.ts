import { Schema, model, type Types } from 'mongoose'

export interface MedicineDocument {
  name: string
  genericName?: string
  barcode?: string
  batchNumber: string
  expiryDate: Date
  mrp: Types.Decimal128
  sellingPrice: Types.Decimal128
  gstPercentage: number
  stockQuantity: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

const medicineSchema = new Schema<MedicineDocument>({
  name: { type: String, required: true, trim: true, index: true },
  genericName: { type: String, trim: true },
  barcode: { type: String, trim: true, sparse: true, index: true },
  // Batch and expiry remain on Medicine for this simple MVP. A future phase can extract them into MedicineBatch.
  batchNumber: { type: String, required: true, trim: true, index: true },
  expiryDate: { type: Date, required: true },
  mrp: { type: Schema.Types.Decimal128, required: true },
  sellingPrice: { type: Schema.Types.Decimal128, required: true },
  gstPercentage: { type: Number, required: true, min: 0 },
  stockQuantity: { type: Number, required: true, min: 0, default: 0 },
  isActive: { type: Boolean, default: true, required: true },
}, { timestamps: true })

medicineSchema.index({ genericName: 1 })
medicineSchema.index({ isActive: 1 })

export const Medicine = model<MedicineDocument>('Medicine', medicineSchema)
