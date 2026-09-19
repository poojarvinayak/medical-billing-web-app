import type { Request, Response } from 'express'
import { getInvoiceBySaleId } from '../services/invoice.service.js'

export const getInvoice = async (request: Request, response: Response): Promise<void> => {
  const data = await getInvoiceBySaleId(String(request.params.saleId ?? ''))
  response.json({ success: true, data })
}
