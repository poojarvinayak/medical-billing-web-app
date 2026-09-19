import type { Request, Response } from 'express'
import * as medicineService from '../services/medicine.service.js'

export const getMedicines = async (request: Request, response: Response): Promise<void> => {
  const data = await medicineService.getMedicines(request.query as { page?: string; limit?: string; search?: string })
  response.json({ success: true, data })
}

export const getMedicineById = async (request: Request, response: Response): Promise<void> => {
  const data = await medicineService.getMedicineById(String(request.params.id ?? ''))
  response.json({ success: true, data })
}

export const createMedicine = async (request: Request, response: Response): Promise<void> => {
  const data = await medicineService.createMedicine(request.body as medicineService.MedicineInput)
  response.status(201).json({ success: true, message: 'Medicine created successfully', data })
}

export const updateMedicine = async (request: Request, response: Response): Promise<void> => {
  const data = await medicineService.updateMedicine(String(request.params.id ?? ''), request.body as medicineService.MedicineUpdateInput)
  response.json({ success: true, message: 'Medicine updated successfully', data })
}

export const deleteMedicine = async (request: Request, response: Response): Promise<void> => {
  await medicineService.deleteMedicine(String(request.params.id ?? ''))
  response.json({ success: true, message: 'Medicine deleted successfully' })
}
