export type PaymentMethod = 'CASH' | 'UPI' | 'CARD' | 'CREDIT'

export interface CreateSaleItemRequest { medicineId: string; quantity: number }
export interface CreateSaleRequest { customerId: string | null; items: CreateSaleItemRequest[]; discountAmount: string; paymentMethod: PaymentMethod; clientRequestId?: string }
export interface CreateSaleResponse { saleId: string; invoiceNumber: string; subtotal: string; discountAmount: string; taxableAmount: string; gstAmount: string; grandTotal: string; paymentMethod: PaymentMethod; paymentStatus: 'PAID' | 'PENDING' }

export interface SaleHistoryItemLine { medicineName: string; batchNumber: string; quantity: number; unitPrice: string; gstPercentage: number; lineTotal: string }
export interface SaleHistoryItem { id: string; invoiceNumber: string; createdAt: string; customerName: string; customerPhone: string | null; paymentMethod: PaymentMethod; paymentStatus: 'PAID' | 'PARTIAL' | 'CREDIT' | 'REFUNDED'; status: 'COMPLETED' | 'CANCELLED'; discountAmount: string; subtotal: string; grandTotal: string; items: SaleHistoryItemLine[] }
export interface SaleHistoryPagination { page: number; limit: number; total: number; totalPages: number }
export interface SaleHistoryResponse { sales: SaleHistoryItem[]; pagination: SaleHistoryPagination }
