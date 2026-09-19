import type { Request, Response } from 'express'
import { calculateBill, type BillingCalculationInput } from '../services/billing-calculation.service.js'

export const calculateBilling = async (request: Request, response: Response): Promise<void> => {
  const data = await calculateBill(request.body as BillingCalculationInput)
  response.json({ success: true, data })
}
