export interface BillingCalculationRequest { items: Array<{ medicineId: string; quantity: number }>; discountAmount: string }
export interface BillingCalculationItem { medicineId: string; name: string; batchNumber: string; expiryDate: string; mrp: string; quantity: number; unitPrice: string; lineSubtotal: string; discountAmount: string; taxableAmount: string; gstPercentage: string; gstAmount: string; lineTotal: string }
export interface BillingSummary { subtotal: string; discountAmount: string; taxableAmount: string; gstAmount: string; grandTotal: string }
export interface BillingCalculationResponse extends BillingSummary { items: BillingCalculationItem[] }
