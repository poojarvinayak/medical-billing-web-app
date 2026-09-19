import { Router } from 'express'
import { createCustomer, deleteCustomer, getCustomerById, getCustomers, updateCustomer } from '../controllers/customer.controller.js'
import { authenticate, authorizeRoles } from '../middleware/auth.middleware.js'

const customerRouter = Router()
customerRouter.use(authenticate)
customerRouter.get('/', authorizeRoles('ADMIN', 'CASHIER', 'PHARMACIST'), getCustomers)
customerRouter.get('/:id', authorizeRoles('ADMIN', 'CASHIER', 'PHARMACIST'), getCustomerById)
customerRouter.post('/', authorizeRoles('ADMIN', 'CASHIER', 'PHARMACIST'), createCustomer)
customerRouter.put('/:id', authorizeRoles('ADMIN', 'CASHIER', 'PHARMACIST'), updateCustomer)
customerRouter.delete('/:id', authorizeRoles('ADMIN'), deleteCustomer)

export default customerRouter
