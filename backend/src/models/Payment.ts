import { Schema, model, type Types } from 'mongoose'

export type PaymentMethod = 'CASH' | 'UPI' | 'CARD' | 'CREDIT'
export type PaymentRecordStatus = 'PAID' | 'PENDING'

export interface PaymentDocument {
  saleId: Types.ObjectId
  amount: Types.Decimal128
  method: PaymentMethod
  status: PaymentRecordStatus
  createdAt: Date
  updatedAt: Date
}

const paymentSchema = new Schema<PaymentDocument>({
  saleId: { type: Schema.Types.ObjectId, ref: 'Sale', required: true, index: true },
  amount: { type: Schema.Types.Decimal128, required: true },
  method: { type: String, enum: ['CASH', 'UPI', 'CARD', 'CREDIT'], required: true },
  status: { type: String, enum: ['PAID', 'PENDING'], required: true },
}, { timestamps: true })

export const Payment = model<PaymentDocument>('Payment', paymentSchema)
