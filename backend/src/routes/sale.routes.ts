import { Router } from 'express'
import { createSaleController, getSalesHistoryController } from '../controllers/sale.controller.js'
import { getInvoice } from '../controllers/invoice.controller.js'
import { authenticate, authorizeRoles } from '../middleware/auth.middleware.js'

const saleRouter = Router()
saleRouter.use(authenticate)
saleRouter.get('/', authorizeRoles('ADMIN', 'CASHIER', 'PHARMACIST'), getSalesHistoryController)
saleRouter.get('/:saleId/invoice', authorizeRoles('ADMIN', 'CASHIER', 'PHARMACIST'), getInvoice)
saleRouter.post('/', authorizeRoles('ADMIN', 'CASHIER', 'PHARMACIST'), createSaleController)

export default saleRouter
