import { useCallback, useEffect, useMemo, useState } from 'react'
import { isAxiosError } from 'axios'
import { useNavigate } from 'react-router-dom'
import { getMedicines } from '../services/medicine.service'
import type { Medicine } from '../types/medicine'
import './inventory.css'

const formatDate = (value: string): string => new Intl.DateTimeFormat('en-IN', { month: 'short', year: 'numeric' }).format(new Date(value))
const formatMoney = (value: string): string => `₹${Number(value).toFixed(2)}`

const isExpired = (expiryDate: string): boolean => {
  const expiry = new Date(expiryDate).getTime()
  return expiry <= Date.now()
}

const isExpiringSoon = (expiryDate: string): boolean => {
  const now = Date.now()
  const expiry = new Date(expiryDate).getTime()
  const diffDays = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24))
  return diffDays > 0 && diffDays <= 30
}

const getStockLabel = (quantity: number): string => {
  if (quantity === 0) return 'Out of stock'
  if (quantity <= 10) return 'Low stock'
  return 'In stock'
}

const getStatusClass = (quantity: number): string => {
  if (quantity === 0) return 'status-pill out'
  if (quantity <= 10) return 'status-pill low'
  return 'status-pill available'
}

export default function Inventory() {
  const navigate = useNavigate()
  const [medicines, setMedicines] = useState<Medicine[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const limit = 10

  const loadInventory = useCallback(async (currentPage: number, query: string) => {
    setLoading(true)
    setError('')
    try {
      const result = await getMedicines({ page: currentPage, limit, search: query })
      setMedicines(result.medicines)
      setTotalPages(Math.max(1, result.pagination.totalPages))
    } catch (requestError: unknown) {
      if (isAxiosError(requestError) && requestError.response?.status === 401) navigate('/login')
      else setError('Failed to load inventory.')
    } finally {
      setLoading(false)
    }
  }, [navigate])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setPage(1)
      void loadInventory(1, search)
    }, 300)
    return () => window.clearTimeout(timer)
  }, [search, loadInventory])

  useEffect(() => {
    setPage(1)
  }, [statusFilter])

  useEffect(() => {
    if (page > 1) void loadInventory(page, search)
  }, [page, search, loadInventory])

  const filteredMedicines = useMemo(() => {
    return medicines.filter((medicine) => {
      if (statusFilter === 'all') return true
      if (statusFilter === 'low') return medicine.stockQuantity > 0 && medicine.stockQuantity <= 10
      if (statusFilter === 'out') return medicine.stockQuantity === 0
      if (statusFilter === 'expiring') return isExpiringSoon(medicine.expiryDate)
      if (statusFilter === 'expired') return isExpired(medicine.expiryDate)
      return true
    })
  }, [medicines, statusFilter])

  const summary = useMemo(() => ({
    total: medicines.length,
    lowStock: medicines.filter((medicine) => medicine.stockQuantity > 0 && medicine.stockQuantity <= 10).length,
    outOfStock: medicines.filter((medicine) => medicine.stockQuantity === 0).length,
    expiringSoon: medicines.filter((medicine) => isExpiringSoon(medicine.expiryDate)).length,
    expired: medicines.filter((medicine) => isExpired(medicine.expiryDate)).length,
  }), [medicines])

  return (
    <section className="inventory-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Inventory and stock control</p>
          <h2>Inventory</h2>
          <p>Monitor medicine stock levels, low-stock items and upcoming expiries.</p>
        </div>
      </div>

      <div className="inventory-metrics">
        <article className="metric-card">
          <span className="metric-label">Active SKUs</span>
          <strong>{summary.total}</strong>
        </article>
        <article className="metric-card">
          <span className="metric-label">Low stock</span>
          <strong>{summary.lowStock}</strong>
        </article>
        <article className="metric-card">
          <span className="metric-label">Expiring soon</span>
          <strong>{summary.expiringSoon}</strong>
        </article>
        <article className="metric-card">
          <span className="metric-label">Expired</span>
          <strong>{summary.expired}</strong>
        </article>
        <article className="metric-card">
          <span className="metric-label">Out of stock</span>
          <strong>{summary.outOfStock}</strong>
        </article>
      </div>

      <div className="inventory-toolbar">
        <input
          className="inventory-search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by medicine, generic name, barcode or batch..."
          aria-label="Search inventory"
        />
        <select className="inventory-filter" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
          <option value="all">All stock statuses</option>
          <option value="low">Low stock</option>
          <option value="expiring">Expiring soon</option>
          <option value="expired">Expired</option>
          <option value="out">Out of stock</option>
        </select>
      </div>

      {error && <p className="inventory-error" role="alert">{error}</p>}

      <div className="inventory-table-card">
        {loading ? (
          <p className="table-message">Loading inventory...</p>
        ) : filteredMedicines.length === 0 ? (
          <div className="table-message">
            <strong>{search ? 'No inventory items match your search.' : 'No inventory items available.'}</strong>
            {!search && <span>Use the medicine catalogue to add new stock.</span>}
          </div>
        ) : (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Medicine</th>
                  <th>Batch</th>
                  <th>Expiry</th>
                  <th>Stock</th>
                  <th>Status</th>
                  <th>Price</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredMedicines.map((medicine) => (
                  <tr key={medicine.id}>
                    <td><strong>{medicine.name}</strong><div className="subtext">{medicine.genericName || 'No generic name'}</div></td>
                    <td>{medicine.batchNumber}</td>
                    <td>
                      <div>{formatDate(medicine.expiryDate)}</div>
                      <div className="expiry-subtext">{new Date(medicine.expiryDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                    </td>
                    <td>{medicine.stockQuantity}</td>
                    <td><span className={getStatusClass(medicine.stockQuantity)}>{getStockLabel(medicine.stockQuantity)}</span></td>
                    <td>{formatMoney(medicine.sellingPrice)}</td>
                    <td><button className="inventory-action" onClick={() => navigate(`/medicines/${medicine.id}/edit`)}>Edit</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {!loading && totalPages > 1 && (
        <div className="inventory-pagination">
          <button onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page === 1}>Previous</button>
          <span>Page {page} of {totalPages}</span>
          <button onClick={() => setPage((current) => Math.min(totalPages, current + 1))} disabled={page === totalPages}>Next</button>
        </div>
      )}
    </section>
  )
}
