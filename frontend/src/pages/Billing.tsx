import { useCallback, useEffect, useRef, useState } from 'react'
import { isAxiosError } from 'axios'
import { useLocation, useNavigate } from 'react-router-dom'
import { calculateBill } from '../services/billing.service'
import { createSale } from '../services/sale.service'
import { getCustomers } from '../services/customer.service'
import { getMedicines } from '../services/medicine.service'
import type { BillingCalculationResponse } from '../types/billing'
import type { Customer } from '../types/customer'
import type { Medicine } from '../types/medicine'
import type { PaymentMethod } from '../types/sale'
import { useCart } from '../context/CartContext'
import './billing.css'

const money = (value: number | string): string => `₹${Number(value).toFixed(2)}`
const displayDate = (value: string): string => new Intl.DateTimeFormat('en-IN', { month: 'short', year: 'numeric' }).format(new Date(value))
const createClientRequestId = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID()
  return `id-${Math.random().toString(16).slice(2)}-${Date.now()}`
}

export default function Billing() {
  const navigate = useNavigate()
  const location = useLocation()
  const locationCompletedSale = (location.state as { completedSale?: { saleId: string; invoiceNumber: string; grandTotal: string } } | null)?.completedSale
  const searchRef = useRef<HTMLInputElement>(null)
  const calculationVersion = useRef(0)
  const clientRequestId = useRef<string>(createClientRequestId())
  const { cartItems, addItem, removeItem, updateQuantity, clearCart } = useCart()
  const [medicineQuery, setMedicineQuery] = useState('')
  const [medicineResults, setMedicineResults] = useState<Medicine[]>([])
  const [searching, setSearching] = useState(false)
  const [medicineError, setMedicineError] = useState('')
  const [cartMessage, setCartMessage] = useState('')
  const [customerQuery, setCustomerQuery] = useState('')
  const [customers, setCustomers] = useState<Customer[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [customerLoading, setCustomerLoading] = useState(false)
  const [customerError, setCustomerError] = useState('')
  const [showCustomerResults, setShowCustomerResults] = useState(false)
  const [discountAmount, setDiscountAmount] = useState('0.00')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH')
  const [tenderedAmount, setTenderedAmount] = useState('')
  const [calculation, setCalculation] = useState<BillingCalculationResponse | null>(null)
  const [calculating, setCalculating] = useState(false)
  const [calculationError, setCalculationError] = useState('')
  const [saleProcessing, setSaleProcessing] = useState(false)
  const [saleMessage, setSaleMessage] = useState('')
  const [saleSuccess, setSaleSuccess] = useState<{ saleId: string; invoiceNumber: string; grandTotal: string } | null>(locationCompletedSale ?? null)
  const [saleCompleted, setSaleCompleted] = useState(Boolean(locationCompletedSale))

  useEffect(() => { searchRef.current?.focus() }, [])

  const searchMedicines = useCallback(async (query: string) => {
    if (!query.trim()) { setMedicineResults([]); setMedicineError(''); return }
    setSearching(true); setMedicineError('')
    try { setMedicineResults((await getMedicines({ search: query.trim(), page: 1, limit: 10 })).medicines) }
    catch { setMedicineError('Unable to search medicines.') }
    finally { setSearching(false) }
  }, [])
  useEffect(() => { const timer = window.setTimeout(() => void searchMedicines(medicineQuery), 350); return () => window.clearTimeout(timer) }, [medicineQuery, searchMedicines])

  const searchCustomers = useCallback(async (query: string) => {
    if (!query.trim()) { setCustomers([]); return }
    setCustomerLoading(true); setCustomerError('')
    try { setCustomers((await getCustomers({ search: query.trim(), page: 1, limit: 10 })).customers) }
    catch { setCustomerError('Unable to search customers.') }
    finally { setCustomerLoading(false) }
  }, [])
  useEffect(() => { const timer = window.setTimeout(() => void searchCustomers(customerQuery), 350); return () => window.clearTimeout(timer) }, [customerQuery, searchCustomers])

  const refreshCalculation = useCallback(async (discount: string) => {
    const version = ++calculationVersion.current
    if (!cartItems.length) { setCalculation(null); setCalculationError(''); setCalculating(false); return }
    setCalculating(true); setCalculationError('')
    try {
      const result = await calculateBill({ items: cartItems.map((item) => ({ medicineId: item.medicineId, quantity: item.quantity })), discountAmount: discount || '0.00' })
      if (version === calculationVersion.current) setCalculation(result)
    } catch (error: unknown) {
      if (version !== calculationVersion.current) return
      setCalculationError(isAxiosError(error) ? ((error.response?.data as { message?: string } | undefined)?.message ?? 'Unable to calculate bill.') : 'Unable to calculate bill.')
      setCalculation(null)
    } finally { if (version === calculationVersion.current) setCalculating(false) }
  }, [cartItems])
  useEffect(() => { const timer = window.setTimeout(() => void refreshCalculation(discountAmount), 250); return () => window.clearTimeout(timer) }, [discountAmount, refreshCalculation])

  useEffect(() => {
    if (paymentMethod === 'CASH' && calculation && !tenderedAmount.trim()) {
      setTenderedAmount(calculation.grandTotal)
    }
  }, [paymentMethod, calculation, tenderedAmount])

  const completeBill = async () => {
    setSaleMessage('')
    if (!cartItems.length) { setSaleMessage('Add at least one medicine to continue.'); return }
    if (saleCompleted) { setSaleMessage('This sale has already been completed. Start a new bill to continue.'); return }
    if (!calculation || calculating || calculationError) { setSaleMessage('Wait for a valid bill calculation before completing the bill.'); return }
    if (Number(discountAmount) < 0) { setSaleMessage('Discount cannot be negative.'); return }
    if (paymentMethod === 'CASH') {
      const tendered = Number(tenderedAmount)
      if (!Number.isFinite(tendered) || tendered < Number(calculation.grandTotal)) {
        setSaleMessage(`Cash tendered must be at least ${money(calculation.grandTotal)}.`)
        return
      }
    }
    setSaleProcessing(true); setSaleSuccess(null)
    try {
      const sale = await createSale({ customerId: selectedCustomer?.id ?? null, items: cartItems.map((item) => ({ medicineId: item.medicineId, quantity: item.quantity })), discountAmount, paymentMethod, clientRequestId: clientRequestId.current })
      setSaleSuccess({ saleId: sale.saleId, invoiceNumber: sale.invoiceNumber, grandTotal: sale.grandTotal })
      clearCart()
      setDiscountAmount('0.00')
      setTenderedAmount('')
      setSaleMessage('Order completed successfully.')
      setSaleCompleted(true)
    } catch (error: unknown) {
      setSaleMessage(isAxiosError(error) ? ((error.response?.data as { message?: string } | undefined)?.message ?? 'Unable to complete the sale.') : 'Unable to complete the sale.')
    } finally { setSaleProcessing(false) }
  }

  const calculationItems = new Map(calculation?.items.map((item) => [item.medicineId, item]))
  const cashChange = paymentMethod === 'CASH' && calculation
    ? Math.max(0, Number(tenderedAmount || 0) - Number(calculation.grandTotal))
    : 0
  const resetBill = () => {
    clearCart()
    setDiscountAmount('0.00')
    setTenderedAmount('')
    setPaymentMethod('CASH')
    setSelectedCustomer(null)
    setCustomerQuery('')
    setMedicineQuery('')
    setSaleMessage('')
    setSaleSuccess(null)
    setSaleCompleted(false)
    clientRequestId.current = createClientRequestId()
  }
  return (
    <section className="billing-page">
      <div className="billing-heading"><div><p className="eyebrow">Point of sale</p><h2>Medical Store POS</h2><p>Complete a bill using authoritative backend pricing and tax calculations.</p></div><span className="pos-badge">{saleCompleted ? 'ORDER COMPLETED' : 'ACTIVE BILL'}</span></div>
      <div className="pos-grid">
        <div className="pos-search-panel"><div className="pos-panel-heading"><div><h3>Search Medicine</h3><p>Search by name, barcode, generic name, or batch.</p></div></div><input ref={searchRef} className="pos-search-input" value={medicineQuery} onChange={(event) => setMedicineQuery(event.target.value)} placeholder="Search medicine or scan barcode..." aria-label="Search medicine" onKeyDown={(event) => { if (event.key === 'Enter' && medicineResults.length) { event.preventDefault(); const medicine = medicineResults[0]; const expired = new Date(medicine.expiryDate).getTime() <= Date.now(); if (!expired && medicine.stockQuantity > 0) { const response = addItem(medicine); setCartMessage(response.message ?? `${medicine.name} added to cart.`); if (response.added) setMedicineQuery('') } } }} />{searching && <p className="pos-status">Searching medicines...</p>}{medicineError && <p className="pos-error">{medicineError}</p>}{cartMessage && <p className="pos-info">{cartMessage}</p>}{!medicineQuery.trim() && <div className="pos-empty-search"><strong>Search for a medicine to add it to the bill.</strong><span>Start typing a medicine name or barcode.</span></div>}{medicineQuery.trim() && !searching && !medicineResults.length && <div className="pos-empty-search"><strong>No medicines found.</strong><span>Try another name, barcode, or batch number.</span></div>}<div className="medicine-result-list">{medicineResults.map((medicine) => { const expired = new Date(medicine.expiryDate).getTime() <= Date.now(); const result = addItem; return <article className="medicine-result" key={medicine.id}><div className="medicine-result-main"><div className="medicine-result-title"><strong>{medicine.name}</strong>{expired && <span className="expired-pill">Expired</span>}</div><span>{medicine.genericName || 'Generic name not provided'}</span><small>Batch: {medicine.batchNumber} · Expiry: {displayDate(medicine.expiryDate)}</small></div><div className="medicine-result-meta"><span>MRP {money(medicine.mrp)}</span><strong>{money(medicine.sellingPrice)}</strong><small>Stock: {medicine.stockQuantity}</small></div><button className="add-button" onClick={() => { const response = result(medicine); setCartMessage(response.message ?? `${medicine.name} added to cart.`); if (response.added) setMedicineQuery('') }} disabled={expired || medicine.stockQuantity < 1}>{expired ? 'Expired' : medicine.stockQuantity < 1 ? 'Out of stock' : 'Add'}</button></article> })}</div></div>
        <aside className={`cart-panel${saleSuccess ? ' order-confirmation-panel' : ''}`}><div className="pos-panel-heading"><div><h3>Current Cart</h3><p>{cartItems.length} item{cartItems.length === 1 ? '' : 's'}{calculating ? ' · Calculating...' : ''}</p></div><button className="clear-cart-button" onClick={() => { if (cartItems.length && window.confirm('Are you sure you want to clear the cart?')) { clearCart(); setDiscountAmount('0.00'); setTenderedAmount('') } }} disabled={!cartItems.length}>Clear cart</button></div>
          <div className="customer-selector"><label htmlFor="customer-search">Customer</label><div className="customer-input-wrap"><input id="customer-search" value={selectedCustomer ? selectedCustomer.name : customerQuery} onFocus={() => setShowCustomerResults(true)} onChange={(event) => { setSelectedCustomer(null); setCustomerQuery(event.target.value); setShowCustomerResults(true) }} placeholder="Walk-in Customer" /><button type="button" onClick={() => { setSelectedCustomer(null); setCustomerQuery(''); setShowCustomerResults(false) }}>Walk-in</button></div>{showCustomerResults && !selectedCustomer && <div className="customer-results"><button type="button" onClick={() => { setSelectedCustomer(null); setCustomerQuery(''); setShowCustomerResults(false) }}>Walk-in Customer</button>{customerLoading && <span>Loading customers...</span>}{customerError && <span className="pos-error">{customerError}</span>}{customers.map((customer) => <button type="button" key={customer.id} onClick={() => { setSelectedCustomer(customer); setCustomerQuery(''); setShowCustomerResults(false) }}><strong>{customer.name}</strong><small>{customer.phone}{customer.city ? ` · ${customer.city}` : ''}</small></button>)}</div>}{selectedCustomer && <small className="selected-customer">{selectedCustomer.phone}{selectedCustomer.city ? ` · ${selectedCustomer.city}` : ''}</small>}</div>
          <div className="cart-items">{cartItems.length === 0 ? <div className="cart-empty"><strong>Your cart is empty</strong><span>Search and add medicines to start a bill.</span></div> : cartItems.map((item) => { const line = calculationItems.get(item.medicineId); return <article className="cart-item" key={item.medicineId}><div className="cart-item-heading"><div><strong>{item.name}</strong><small>Batch: {item.batchNumber}</small></div><button onClick={() => removeItem(item.medicineId)}>Remove</button></div><div className="cart-item-bottom"><span>{money(line?.unitPrice ?? item.unitPrice)} × {item.quantity} = <strong>{money(line?.lineTotal ?? Number(item.unitPrice) * item.quantity)}</strong></span><div className="quantity-control"><button type="button" onClick={() => updateQuantity(item.medicineId, item.quantity - 1)} disabled={item.quantity <= 1}>−</button><input aria-label={`Quantity for ${item.name}`} type="number" min="1" max={item.availableStock} step="1" value={item.quantity} onChange={(event) => { const quantity = Number(event.target.value); if (Number.isInteger(quantity) && quantity >= 1) updateQuantity(item.medicineId, quantity) }} /><button type="button" onClick={() => updateQuantity(item.medicineId, item.quantity + 1)} disabled={item.quantity >= item.availableStock}>+</button></div></div>{line && <small className="cart-tax-detail">Subtotal {money(line.lineSubtotal)} · GST {line.gstPercentage}% = {money(line.gstAmount)}</small>}</article> })}</div>
          <div className="payment-control"><label htmlFor="payment-method">Payment Method</label><select id="payment-method" value={paymentMethod} onChange={(event) => { setPaymentMethod(event.target.value as PaymentMethod); setTenderedAmount('') }}><option value="CASH">Cash</option><option value="UPI">UPI</option><option value="CARD">Card</option><option value="CREDIT">Credit</option></select></div>{paymentMethod === 'CASH' && <div className="tendered-control"><label htmlFor="tendered-amount">Cash Tendered</label><div className="discount-input"><span>₹</span><input id="tendered-amount" type="number" min="0" step="0.01" value={tenderedAmount} onChange={(event) => setTenderedAmount(event.target.value)} /></div>{calculation && <div className="cash-change"><button type="button" className="exact-cash-button" onClick={() => setTenderedAmount(calculation.grandTotal)}>Use exact amount</button><div><span>Change due </span><strong>{money(cashChange)}</strong></div></div>}</div>}<div className="discount-control"><label htmlFor="discount-amount">Discount Amount</label><div className="discount-input"><span>₹</span><input id="discount-amount" type="number" min="0" step="0.01" value={discountAmount} onChange={(event) => setDiscountAmount(event.target.value)} /></div></div>{calculationError && <p className="pos-error">{calculationError}</p>}
          <div className="cart-summary"><div><span>Subtotal</span><strong>{money(calculation?.subtotal ?? 0)}</strong></div><div><span>Discount</span><strong>{money(calculation?.discountAmount ?? 0)}</strong></div><div><span>Taxable Amount</span><strong>{money(calculation?.taxableAmount ?? 0)}</strong></div><div><span>GST</span><strong>{money(calculation?.gstAmount ?? 0)}</strong></div><div className="summary-total"><span>Grand Total</span><strong>{money(calculation?.grandTotal ?? 0)}</strong></div></div><button className="complete-bill-button" onClick={() => void completeBill()} disabled={saleProcessing || calculating || Boolean(calculationError) || saleCompleted}>{saleProcessing ? 'Processing bill…' : saleCompleted ? 'Sale completed' : 'Complete Bill'}</button>{saleMessage && <p className="pos-info bill-message">{saleMessage}</p>}{saleSuccess && <div className="sale-success"><strong>Sale completed successfully.</strong><span>Invoice: {saleSuccess.invoiceNumber}</span><span>Grand Total: {money(saleSuccess.grandTotal)}</span><div className="sale-success-actions"><button className="view-invoice-button" onClick={() => navigate(`/invoices/${saleSuccess.saleId}`)}>View Invoice</button><button className="view-invoice-button" onClick={() => {
            resetBill();
          }}>Start new bill</button></div></div>}</aside>
      </div>
    </section>
  )
}
