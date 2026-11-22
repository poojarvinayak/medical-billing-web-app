export interface Medicine {
  id: string
  name: string
  genericName?: string
  barcode?: string
  batchNumber: string
  expiryDate: string
  mrp: string
  sellingPrice: string
  gstPercentage: number
  stockQuantity: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateMedicineRequest {
  name: string
  genericName?: string
  barcode?: string
  batchNumber: string
  expiryDate: string
  mrp: string
  sellingPrice: string
  gstPercentage: number
  stockQuantity: number
}

export type UpdateMedicineRequest = Partial<CreateMedicineRequest>

export interface BulkImportRow {
  row: number
  id?: string
  medicine: CreateMedicineRequest
}

export type BulkImportRequest = BulkImportRow[]

export interface BulkImportFailure {
  row: number
  id?: string
  name?: string
  genericName?: string
  barcode?: string
  batchNumber?: string
  expiryDate?: string
  mrp?: string | number
  sellingPrice?: string | number
  gstPercentage?: number
  stockQuantity?: number
  error: string
}

export interface BulkImportResponse {
  imported: number
  updated: number
  failed: BulkImportFailure[]
}

export interface MedicineListResponse {
  medicines: Medicine[]
  pagination: { page: number; limit: number; total: number; totalPages: number }
}
