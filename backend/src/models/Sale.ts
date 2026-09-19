import { Schema, model, type Types } from 'mongoose'

export type PaymentMethod = 'CASH' | 'UPI' | 'CARD' | 'CREDIT'
export type PaymentStatus = 'PAID' | 'PARTIAL' | 'CREDIT' | 'REFUNDED'
export type SaleStatus = 'COMPLETED' | 'CANCELLED'

export interface SaleDocument {
  invoiceNumber: string
  clientRequestId?: string
  customerId?: Types.ObjectId | null
  items: Types.ObjectId[]
  subtotal: Types.Decimal128
  discountAmount: Types.Decimal128
  taxableAmount: Types.Decimal128
  gstAmount: Types.Decimal128
  grandTotal: Types.Decimal128
  paymentMethod: PaymentMethod
  paymentStatus: PaymentStatus
  status: SaleStatus
  createdBy: Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const saleSchema = new Schema<SaleDocument>({
  invoiceNumber: { type: String, required: true, unique: true, trim: true },
  clientRequestId: { type: String, unique: true, sparse: true, trim: true },
  customerId: { type: Schema.Types.ObjectId, ref: 'Customer', default: null },
  items: [{ type: Schema.Types.ObjectId, ref: 'SaleItem', required: true }],
  subtotal: { type: Schema.Types.Decimal128, required: true },
  discountAmount: { type: Schema.Types.Decimal128, required: true, default: '0' },
  taxableAmount: { type: Schema.Types.Decimal128, required: true },
  gstAmount: { type: Schema.Types.Decimal128, required: true },
  grandTotal: { type: Schema.Types.Decimal128, required: true },
  paymentMethod: { type: String, enum: ['CASH', 'UPI', 'CARD', 'CREDIT'], required: true },
  paymentStatus: { type: String, enum: ['PAID', 'PARTIAL', 'CREDIT', 'REFUNDED'], required: true },
  status: { type: String, enum: ['COMPLETED', 'CANCELLED'], required: true },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true })

saleSchema.index({ createdAt: -1 })
saleSchema.index({ customerId: 1 })

export const Sale = model<SaleDocument>('Sale', saleSchema)
