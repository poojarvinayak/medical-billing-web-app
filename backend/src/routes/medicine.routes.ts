import { Router } from 'express'
import { createMedicine, deleteMedicine, getMedicineById, getMedicines, importMedicines, updateMedicine } from '../controllers/medicine.controller.js'
import { authenticate, authorizeRoles } from '../middleware/auth.middleware.js'

const medicineRouter = Router()
medicineRouter.use(authenticate)
medicineRouter.get('/', authorizeRoles('ADMIN', 'CASHIER', 'PHARMACIST'), getMedicines)
medicineRouter.get('/:id', authorizeRoles('ADMIN', 'CASHIER', 'PHARMACIST'), getMedicineById)
medicineRouter.post('/', authorizeRoles('ADMIN', 'PHARMACIST'), createMedicine)
medicineRouter.post('/import', authorizeRoles('ADMIN', 'PHARMACIST'), importMedicines)
medicineRouter.put('/:id', authorizeRoles('ADMIN', 'PHARMACIST'), updateMedicine)
medicineRouter.delete('/:id', authorizeRoles('ADMIN', 'PHARMACIST'), deleteMedicine)

export default medicineRouter
