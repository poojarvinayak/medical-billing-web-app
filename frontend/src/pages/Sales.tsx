import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getSalesHistory } from '../services/sale.service'
import type { SaleHistoryItem } from '../types/sale'
import './sales.css'

const money = (value: string): string => `₹${Number(value).toFixed(2)}`
const date = (value: string): string => new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(value))

export default function Sales() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [page, setPage] = useState(1)
  const [sales, setSales] = useState<SaleHistoryItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [limit] = useState(10)

  useEffect(() => {
    const controller = new AbortController()
    const timer = window.setTimeout(async () => {
      setLoading(true)
      setError('')
      try {
        const data = await getSalesHistory({ page, limit, search, startDate: startDate || undefined, endDate: endDate || undefined })
        setSales(data.sales)
        setTotal(data.pagination.total)
        setTotalPages(data.pagination.totalPages)
      } catch {
        if (!controller.signal.aborted) setError('Unable to load sales history.')
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }, 250)

    return () => {
      controller.abort()
      window.clearTimeout(timer)
    }
  }, [page, limit, search, startDate, endDate])

  const pageLabel = useMemo(() => `${page} / ${totalPages}`, [page, totalPages])
  const summaryLabel = useMemo(() => (loading ? 'Loading sales…' : `${total} sale${total === 1 ? '' : 's'} found`), [loading, total])
  const getStatusClass = (status: string) => `status-badge ${status === 'COMPLETED' ? 'completed' : 'cancelled'}`
  const getPaymentClass = (method: string) => `payment-badge ${method.toLowerCase()}`

  return (
    <section className="sales-page">
      <div className="sales-header-row">
        <div className="page-heading">
          <div>
            <p className="eyebrow">Sales history</p>
            <h2>Invoice and sale records</h2>
            <p>Review completed invoices, payment status, and customer history.</p>
          </div>
        </div>
        <div className="sales-summary-panel">
          <div className="summary-card">
            <span>Total records</span>
            <strong>{loading ? '—' : total}</strong>
          </div>
          <div className="summary-card">
            <span>Page</span>
            <strong>{pageLabel}</strong>
          </div>
        </div>
      </div>
      <div className="sales-toolbar">
        <div className="sales-search">
          <label htmlFor="sales-search">Search</label>
          <input id="sales-search" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1) }} placeholder="Search invoice number or customer" />
        </div>
        <div className="sales-filters">
          <div className="sales-filter-item">
            <label htmlFor="sales-start-date">From</label>
            <input id="sales-start-date" type="date" value={startDate} onChange={(event) => { setStartDate(event.target.value); setPage(1) }} />
          </div>
          <div className="sales-filter-item">
            <label htmlFor="sales-end-date">To</label>
            <input id="sales-end-date" type="date" value={endDate} onChange={(event) => { setEndDate(event.target.value); setPage(1) }} />
          </div>
        </div>
        <div className="sales-summary">
          <span>{summaryLabel}</span>
        </div>
      </div>
      {error && <p className="sales-error">{error}</p>}
      <div className="sales-table-card">
        {loading ? (
          <p className="sales-table-message">Loading sales history...</p>
        ) : !sales.length ? (
          <p className="sales-table-message">No sales found. Try a different search filter.</p>
        ) : (
          <table className="sales-table">
            <thead>
              <tr>
                <th>Invoice</th>
                <th>Date</th>
                <th>Customer</th>
                <th>Payment</th>
                <th>Status</th>
                <th>Discount</th>
                <th>Amount</th>
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {sales.map((sale) => (
                <tr key={sale.id}>
                  <td>{sale.invoiceNumber}</td>
                  <td>{date(sale.createdAt)}</td>
                  <td>{sale.customerName}{sale.customerPhone ? ` · ${sale.customerPhone}` : ''}</td>
                  <td><span className={getPaymentClass(sale.paymentMethod)}>{sale.paymentMethod}</span></td>
                  <td><span className={getStatusClass(sale.status)}>{sale.status}</span></td>
                  <td className="amount-cell">{money(sale.discountAmount)}</td>
                  <td className="amount-cell">{money(sale.grandTotal)}</td>
                  <td><button className="view-invoice-button" type="button" onClick={() => navigate(`/invoices/${sale.id}`)}>Reprint</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <div className="sales-pagination">
        <button type="button" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page <= 1 || loading}>Previous</button>
        <span>{pageLabel}</span>
        <button type="button" onClick={() => setPage((current) => Math.min(totalPages, current + 1))} disabled={page >= totalPages || loading}>Next</button>
      </div>
    </section>
  )
}
