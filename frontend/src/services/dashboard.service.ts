import api from './api'
import type { DashboardSummary } from '../types/dashboard'

export const getDashboardSummary = async (): Promise<DashboardSummary> => (await api.get<{ data: DashboardSummary }>('/dashboard/summary')).data.data
