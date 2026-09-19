import type { Request, Response } from 'express'
import * as customerService from '../services/customer.service.js'

export const getCustomers = async (request: Request, response: Response): Promise<void> => { const data = await customerService.getCustomers(request.query as customerService.CustomerListQuery); response.json({ success: true, data }) }
export const getCustomerById = async (request: Request, response: Response): Promise<void> => { const data = await customerService.getCustomerById(String(request.params.id ?? '')); response.json({ success: true, data }) }
export const createCustomer = async (request: Request, response: Response): Promise<void> => { const data = await customerService.createCustomer(request.body as customerService.CustomerInput); response.status(201).json({ success: true, message: 'Customer created successfully', data }) }
export const updateCustomer = async (request: Request, response: Response): Promise<void> => { const data = await customerService.updateCustomer(String(request.params.id ?? ''), request.body as customerService.CustomerUpdateInput); response.json({ success: true, message: 'Customer updated successfully', data }) }
export const deleteCustomer = async (request: Request, response: Response): Promise<void> => { await customerService.deleteCustomer(String(request.params.id ?? '')); response.json({ success: true, message: 'Customer deleted successfully' }) }
