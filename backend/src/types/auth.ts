export const USER_ROLES = ['ADMIN', 'CASHIER', 'PHARMACIST'] as const
export type UserRole = (typeof USER_ROLES)[number]

export interface AuthUser {
  id: string
  name: string
  email: string
  role: UserRole
}

export interface LoginRequest {
  email: string
  password: string
}
