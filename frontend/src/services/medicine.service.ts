import api from './api'
import type { CreateMedicineRequest, Medicine, MedicineListResponse, UpdateMedicineRequest } from '../types/medicine'

export const getMedicines = async (params: { page?: number; limit?: number; search?: string } = {}): Promise<MedicineListResponse> => (await api.get<{ data: MedicineListResponse }>('/medicines', { params })).data.data
export const getMedicine = async (id: string): Promise<Medicine> => (await api.get<{ data: Medicine }>(`/medicines/${id}`)).data.data
export const createMedicine = async (data: CreateMedicineRequest): Promise<Medicine> => (await api.post<{ data: Medicine }>('/medicines', data)).data.data
export const updateMedicine = async (id: string, data: UpdateMedicineRequest): Promise<Medicine> => (await api.put<{ data: Medicine }>(`/medicines/${id}`, data)).data.data
export const deleteMedicine = async (id: string): Promise<void> => { await api.delete(`/medicines/${id}`) }
