import { Router } from 'express'
import { login, logout, me, protectedTest } from '../controllers/auth.controller.js'
import { authenticate } from '../middleware/auth.middleware.js'

const authRouter = Router()
authRouter.post('/login', login)
authRouter.post('/logout', logout)
authRouter.get('/me', authenticate, me)
authRouter.get('/protected-test', authenticate, protectedTest)

export default authRouter
