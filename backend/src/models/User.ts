import bcrypt from 'bcryptjs'
import { Schema, model, type HydratedDocument } from 'mongoose'
import type { AuthUser, UserRole } from '../types/auth.js'

export interface UserDocument {
  name: string
  email: string
  password: string
  role: UserRole
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export type UserHydratedDocument = HydratedDocument<UserDocument>

const userSchema = new Schema<UserDocument>({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
  password: { type: String, required: true, select: false },
  role: { type: String, enum: ['ADMIN', 'CASHIER', 'PHARMACIST'], default: 'CASHIER', required: true },
  isActive: { type: Boolean, default: true, required: true },
}, { timestamps: true })

userSchema.pre('save', async function savePassword() {
  if (!this.isModified('password')) return
  this.password = await bcrypt.hash(this.password, 12)
})

userSchema.methods.toSafeUser = function toSafeUser(this: UserHydratedDocument): AuthUser {
  return { id: this._id.toString(), name: this.name, email: this.email, role: this.role }
}

export const User = model<UserDocument>('User', userSchema)
