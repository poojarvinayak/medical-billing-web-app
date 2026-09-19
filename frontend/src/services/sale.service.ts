import api from './api'
import type { CreateSaleRequest, CreateSaleResponse, SaleHistoryResponse } from '../types/sale'

export const createSale = async (data: CreateSaleRequest): Promise<CreateSaleResponse> => (await api.post<{ data: CreateSaleResponse }>('/sales', data)).data.data
export const getSalesHistory = async (params: { page?: number; limit?: number; search?: string; startDate?: string; endDate?: string } = {}): Promise<SaleHistoryResponse> => (await api.get<{ data: SaleHistoryResponse }>('/sales', { params })).data.data
