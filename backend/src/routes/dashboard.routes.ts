import { Router } from 'express'
import { getDashboardSummaryController } from '../controllers/dashboard.controller.js'
import { authenticate, authorizeRoles } from '../middleware/auth.middleware.js'

const dashboardRouter = Router()

dashboardRouter.use(authenticate)
dashboardRouter.get('/summary', authorizeRoles('ADMIN', 'CASHIER', 'PHARMACIST'), getDashboardSummaryController)

export default dashboardRouter
