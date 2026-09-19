export type UserRole = 'ADMIN' | 'CASHIER' | 'PHARMACIST'

export interface AuthUser {
  id: string
  name: string
  email: string
  role: UserRole
}
