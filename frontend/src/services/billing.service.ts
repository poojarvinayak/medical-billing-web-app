import api from './api'
import type { BillingCalculationRequest, BillingCalculationResponse } from '../types/billing'

export const calculateBill = async (data: BillingCalculationRequest): Promise<BillingCalculationResponse> => (await api.post<{ data: BillingCalculationResponse }>('/billing/calculate', data)).data.data
