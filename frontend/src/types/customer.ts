export interface Customer {
  id: string
  name: string
  phone: string
  email?: string
  address?: string
  city?: string
  state?: string
  pincode?: string
  reminderDate?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateCustomerRequest { name: string; phone: string; email?: string; address?: string; city?: string; state?: string; pincode?: string; reminderDate?: string }
export type UpdateCustomerRequest = Partial<CreateCustomerRequest>
export interface CustomerPagination { page: number; limit: number; total: number; totalPages: number }
export interface CustomerListResponse { customers: Customer[]; pagination: CustomerPagination }
