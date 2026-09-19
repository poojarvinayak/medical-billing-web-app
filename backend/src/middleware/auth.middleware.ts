import type { NextFunction, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'
import { AUTH_COOKIE_NAME, findAuthenticatedUser } from '../services/auth.service.js'
import type { AuthUser, UserRole } from '../types/auth.js'

interface TokenPayload extends jwt.JwtPayload { sub: string }

export const authenticate = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
  try {
    const token = request.cookies?.[AUTH_COOKIE_NAME] as string | undefined
    if (!token) { response.status(401).json({ success: false, message: 'Authentication required' }); return }
    const payload = jwt.verify(token, env.jwtSecret) as TokenPayload
    if (!payload.sub) { response.status(401).json({ success: false, message: 'Authentication required' }); return }
    const user = await findAuthenticatedUser(payload.sub)
    if (!user) { response.status(401).json({ success: false, message: 'Authentication required' }); return }
    if (!user.isActive) { response.status(403).json({ success: false, message: 'User account is inactive' }); return }
    request.user = { id: user._id.toString(), name: user.name, email: user.email, role: user.role }
    next()
  } catch {
    response.status(401).json({ success: false, message: 'Authentication required' })
  }
}

export const authorizeRoles = (...roles: UserRole[]) => (request: Request, response: Response, next: NextFunction): void => {
  const user: AuthUser | undefined = request.user
  if (!user || !roles.includes(user.role)) { response.status(403).json({ success: false, message: 'Access forbidden' }); return }
  next()
}
