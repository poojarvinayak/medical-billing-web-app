import api from './api'
import type { CreateCustomerRequest, Customer, CustomerListResponse, UpdateCustomerRequest } from '../types/customer'

export const getCustomers = async (params: { page?: number; limit?: number; search?: string } = {}): Promise<CustomerListResponse> => (await api.get<{ data: CustomerListResponse }>('/customers', { params })).data.data
export const getCustomer = async (id: string): Promise<Customer> => (await api.get<{ data: Customer }>(`/customers/${id}`)).data.data
export const createCustomer = async (data: CreateCustomerRequest): Promise<Customer> => (await api.post<{ data: Customer }>('/customers', data)).data.data
export const updateCustomer = async (id: string, data: UpdateCustomerRequest): Promise<Customer> => (await api.put<{ data: Customer }>(`/customers/${id}`, data)).data.data
export const deleteCustomer = async (id: string): Promise<void> => { await api.delete(`/customers/${id}`) }
