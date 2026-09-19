import { isValidObjectId, type HydratedDocument } from 'mongoose'
import { Customer, type CustomerDocument } from '../models/Customer.js'

export interface CustomerInput { name: string; phone: string; email?: string; address?: string; city?: string; state?: string; pincode?: string; reminderDate?: string }
export type CustomerUpdateInput = Partial<CustomerInput>
export interface CustomerListQuery { page?: string; limit?: string; search?: string }

export class CustomerServiceError extends Error {
  statusCode: number
  constructor(message: string, statusCode = 400) { super(message); this.name = 'CustomerServiceError'; this.statusCode = statusCode }
}

export const normalizePhone = (value: string): string => {
  const compact = value.trim().replace(/[\s()-]/g, '')
  const normalized = compact.startsWith('+91') ? compact.slice(3) : compact.startsWith('0091') ? compact.slice(4) : compact
  if (!/^[6-9]\d{9}$/.test(normalized)) throw new CustomerServiceError('Phone number must be a valid Indian phone number.')
  return normalized
}

const validateEmail = (email: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
const validateInput = (input: CustomerInput): Record<string, unknown> => {
  const name = input.name?.trim()
  if (!name || name.length < 2) throw new CustomerServiceError('Customer name is required.')
  const phone = normalizePhone(input.phone)
  const email = input.email?.trim().toLowerCase() || undefined
  if (email && !validateEmail(email)) throw new CustomerServiceError('Email must be valid.')
  const pincode = input.pincode?.trim() || undefined
  if (pincode && !/^\d{6}$/.test(pincode)) throw new CustomerServiceError('Pincode must be a valid 6-digit Indian PIN code.')
  let reminderDate: Date | undefined = undefined
  if (input.reminderDate) {
    const parsed = new Date(input.reminderDate)
    if (Number.isNaN(parsed.getTime())) throw new CustomerServiceError('Reminder date must be a valid date.')
    reminderDate = parsed
  }
  return { name, phone, email, address: input.address?.trim() || undefined, city: input.city?.trim() || undefined, state: input.state?.trim() || undefined, pincode, reminderDate, isActive: true }
}

const ensurePhoneAvailable = async (phone: string, excludeId?: string): Promise<void> => {
  const filter: { phone: string; isActive: boolean; _id?: { $ne: string } } = { phone, isActive: true }
  if (excludeId) filter._id = { $ne: excludeId }
  if (await Customer.exists(filter)) throw new CustomerServiceError('A customer with this phone number already exists.')
}

const serialize = (customer: HydratedDocument<CustomerDocument>) => ({ id: customer._id.toString(), name: customer.name, phone: customer.phone, email: customer.email, address: customer.address, city: customer.city, state: customer.state, pincode: customer.pincode, reminderDate: customer.reminderDate?.toISOString(), isActive: customer.isActive, createdAt: customer.createdAt, updatedAt: customer.updatedAt })

export const getCustomers = async ({ page = '1', limit = '20', search = '' }: CustomerListQuery) => {
  const currentPage = Math.max(1, Number.parseInt(page, 10) || 1)
  const pageSize = Math.min(100, Math.max(1, Number.parseInt(limit, 10) || 20))
  const normalizedSearch = search.trim()
  const filter: Record<string, unknown> = { isActive: true }
  if (normalizedSearch) {
    const escaped = normalizedSearch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const pattern = new RegExp(escaped, 'i')
    const phoneSearch = normalizedSearch.replace(/[\s()-]/g, '').replace(/^\+91|^0091/, '')
    filter.$or = [{ name: pattern }, { phone: new RegExp(phoneSearch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') }, { email: pattern }]
  }
  const [customers, total] = await Promise.all([Customer.find(filter).sort({ createdAt: -1 }).skip((currentPage - 1) * pageSize).limit(pageSize), Customer.countDocuments(filter)])
  return { customers: customers.map(serialize), pagination: { page: currentPage, limit: pageSize, total, totalPages: Math.ceil(total / pageSize) } }
}

export const getCustomerById = async (id: string) => {
  if (!isValidObjectId(id)) throw new CustomerServiceError('Customer not found.', 404)
  const customer = await Customer.findOne({ _id: id, isActive: true })
  if (!customer) throw new CustomerServiceError('Customer not found.', 404)
  return serialize(customer)
}

export const createCustomer = async (input: CustomerInput) => {
  const data = validateInput(input)
  await ensurePhoneAvailable(data.phone as string)
  try { return serialize(await Customer.create(data)) } catch (error: unknown) { if (error instanceof Error && 'code' in error && (error as { code?: number }).code === 11000) throw new CustomerServiceError('A customer with this phone number already exists.'); throw error }
}

export const updateCustomer = async (id: string, input: CustomerUpdateInput) => {
  if (!isValidObjectId(id)) throw new CustomerServiceError('Customer not found.', 404)
  const existing = await Customer.findOne({ _id: id, isActive: true })
  if (!existing) throw new CustomerServiceError('Customer not found.', 404)
  const merged: CustomerInput = { name: input.name ?? existing.name, phone: input.phone ?? existing.phone, email: input.email ?? existing.email, address: input.address ?? existing.address, city: input.city ?? existing.city, state: input.state ?? existing.state, pincode: input.pincode ?? existing.pincode, reminderDate: input.reminderDate ?? existing.reminderDate?.toISOString() }
  const data = validateInput(merged)
  await ensurePhoneAvailable(data.phone as string, id)
  try { Object.assign(existing, data); return serialize(await existing.save()) } catch (error: unknown) { if (error instanceof Error && 'code' in error && (error as { code?: number }).code === 11000) throw new CustomerServiceError('A customer with this phone number already exists.'); throw error }
}

export const deleteCustomer = async (id: string): Promise<void> => {
  if (!isValidObjectId(id)) throw new CustomerServiceError('Customer not found.', 404)
  const customer = await Customer.findOne({ _id: id, isActive: true })
  if (!customer) throw new CustomerServiceError('Customer not found.', 404)
  customer.isActive = false
  await customer.save()
}
