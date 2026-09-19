import { Router } from 'express'
import { calculateBilling } from '../controllers/billing.controller.js'
import { authenticate, authorizeRoles } from '../middleware/auth.middleware.js'

const billingRouter = Router()
billingRouter.use(authenticate)
billingRouter.post('/calculate', authorizeRoles('ADMIN', 'CASHIER', 'PHARMACIST'), calculateBilling)

export default billingRouter
