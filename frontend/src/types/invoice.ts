export interface InvoiceSale { id: string; invoiceNumber: string; createdAt: string; subtotal: string; discountAmount: string; taxableAmount: string; gstAmount: string; grandTotal: string }
export interface InvoiceCustomer { name: string; phone: string | null; address?: string; city?: string; state?: string; pincode?: string }
export interface InvoiceItem { medicineName: string; batchNumber: string; expiryDate: string; quantity: number; unitPrice: string; mrp: string; gstPercentage: string; lineSubtotal: string; discountAmount: string; taxableAmount: string; gstAmount: string; lineTotal: string }
export interface InvoicePayment { method: 'CASH' | 'UPI' | 'CARD' | 'CREDIT'; status: 'PAID' | 'PENDING'; amount: string }
export interface Invoice { sale: InvoiceSale; customer: InvoiceCustomer; items: InvoiceItem[]; payment: InvoicePayment }
