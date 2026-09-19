import type { Medicine } from './medicine'

export interface CartItem {
  medicineId: string
  name: string
  genericName?: string
  batchNumber: string
  expiryDate: string
  mrp: string
  unitPrice: string
  gstPercentage: number
  availableStock: number
  quantity: number
}

export const cartItemFromMedicine = (medicine: Medicine): CartItem => ({
  medicineId: medicine.id,
  name: medicine.name,
  genericName: medicine.genericName,
  batchNumber: medicine.batchNumber,
  expiryDate: medicine.expiryDate,
  mrp: medicine.mrp,
  unitPrice: medicine.sellingPrice,
  gstPercentage: medicine.gstPercentage,
  availableStock: medicine.stockQuantity,
  quantity: 1,
})
