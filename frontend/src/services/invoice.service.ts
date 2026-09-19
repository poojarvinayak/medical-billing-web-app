import api from './api'
import type { Invoice } from '../types/invoice'

export const getInvoice = async (saleId: string): Promise<Invoice> => (await api.get<{ data: Invoice }>(`/sales/${saleId}/invoice`)).data.data
