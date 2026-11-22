import bcrypt from 'bcryptjs'
import jwt, { type SignOptions } from 'jsonwebtoken'
import type { Response } from 'express'
import { User, type UserHydratedDocument } from '../models/User.js'
import type { AuthUser, UserRole } from '../types/auth.js'
import { env } from '../config/env.js'

export const AUTH_COOKIE_NAME = 'medical_store_access_token'

const cookieOptions = {
  httpOnly: true,
  secure: env.nodeEnv === 'production',
  sameSite: env.nodeEnv === 'production' ? 'none' as const : 'lax' as const,
  maxAge: 1000 * 60 * 60 * 24 * 7,
  path: '/',
}

export const safeUser = (user: UserHydratedDocument): AuthUser => ({
  id: user._id.toString(), name: user.name, email: user.email, role: user.role,
})

export const issueAuthCookie = (response: Response, user: UserHydratedDocument): void => {
  const token = jwt.sign({ sub: user._id.toString(), role: user.role }, env.jwtSecret, { expiresIn: env.jwtExpiresIn as SignOptions['expiresIn'] })
  response.cookie(AUTH_COOKIE_NAME, token, cookieOptions)
}

export const clearAuthCookie = (response: Response): void => {
  response.clearCookie(AUTH_COOKIE_NAME, cookieOptions)
}

export const findAuthenticatedUser = async (id: string): Promise<UserHydratedDocument | null> => {
  return User.findById(id).select('+password') as Promise<UserHydratedDocument | null>
}

export const authenticateCredentials = async (email: string, password: string): Promise<UserHydratedDocument | null> => {
  const normalizedEmail = email.toLowerCase().trim()
  const user = await User.findOne({ email: normalizedEmail }).select('+password') as UserHydratedDocument | null
  const passwordMatches = user ? await bcrypt.compare(password, user.password) : false
  if (!user || !passwordMatches) return null
  return user
}

export const isRole = (role: string, expected: readonly UserRole[]): boolean => expected.includes(role as UserRole)
