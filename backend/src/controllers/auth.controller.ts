import type { Request, Response } from 'express'
import type { AuthUser } from '../types/auth.js'
import { User } from '../models/User.js'
import { authenticateCredentials, clearAuthCookie, issueAuthCookie, safeUser } from '../services/auth.service.js'
import type { LoginRequest } from '../types/auth.js'

const validEmail = (email: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

export const login = async (request: Request, response: Response): Promise<void> => {
  const { email, password } = request.body as Partial<LoginRequest>
  if (!email || !validEmail(email) || !password) { response.status(400).json({ success: false, message: 'Valid email and password are required' }); return }
  const user = await authenticateCredentials(email, password)
  if (!user) { response.status(401).json({ success: false, message: 'Invalid email or password' }); return }
  if (!user.isActive) { response.status(403).json({ success: false, message: 'User account is inactive' }); return }
  issueAuthCookie(response, user)
  response.json({ success: true, user: safeUser(user) })
}

export const logout = (_request: Request, response: Response): void => {
  clearAuthCookie(response)
  response.json({ success: true, message: 'Logged out successfully' })
}

export const me = (request: Request, response: Response): void => {
  response.json({ success: true, user: (request as Request & { user?: AuthUser }).user })
}

export const protectedTest = (request: Request, response: Response): void => {
  const authenticatedUser = (request as Request & { user?: AuthUser }).user
  response.json({ success: true, message: 'You have access to protected API', user: { id: authenticatedUser?.id, role: authenticatedUser?.role } })
}

export const ensureUserModelLoaded = (): typeof User => User
