import type { Request, Response } from 'express'
import { createSale, getSalesHistory, type CreateSaleInput, type SalesHistoryRequest } from '../services/sale.service.js'

export const getSalesHistoryController = async (request: Request, response: Response): Promise<void> => {
  const query: SalesHistoryRequest = {
    page: Number(request.query.page ?? 1),
    limit: Number(request.query.limit ?? 20),
    search: typeof request.query.search === 'string' ? request.query.search : undefined,
    startDate: typeof request.query.startDate === 'string' ? request.query.startDate : undefined,
    endDate: typeof request.query.endDate === 'string' ? request.query.endDate : undefined,
  }
  const data = await getSalesHistory(query)
  response.json({ success: true, data })
}

export const createSaleController = async (request: Request, response: Response): Promise<void> => {
  const data = await createSale(request.body as CreateSaleInput, request.user?.id ?? '')
  response.status(201).json({ success: true, message: 'Sale created successfully', data })
}
