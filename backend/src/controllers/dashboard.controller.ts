import type { Request, Response } from 'express'
import { getDashboardSummary } from '../services/dashboard.service.js'

export const getDashboardSummaryController = async (_request: Request, response: Response): Promise<void> => {
  const data = await getDashboardSummary()
  response.json({ success: true, data })
}
