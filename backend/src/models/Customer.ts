import { Schema, model } from 'mongoose'

export interface CustomerDocument {
  name: string
  phone: string
  email?: string
  address?: string
  city?: string
  state?: string
  pincode?: string
  reminderDate?: Date
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

const customerSchema = new Schema<CustomerDocument>({
  name: { type: String, required: true, trim: true },
  phone: { type: String, required: true, trim: true },
  email: { type: String, lowercase: true, trim: true, index: true },
  address: { type: String, trim: true },
  city: { type: String, trim: true },
  state: { type: String, trim: true },
  pincode: { type: String, trim: true },
  reminderDate: { type: Date },
  isActive: { type: Boolean, default: true, required: true },
}, { timestamps: true })

customerSchema.index({ name: 1 })
customerSchema.index({ phone: 1, isActive: 1 }, { unique: true, partialFilterExpression: { isActive: true, phone: { $exists: true } }, name: 'active_customer_phone_unique' })
customerSchema.index({ isActive: 1 })

export const Customer = model<CustomerDocument>('Customer', customerSchema)
