import { useEffect, useState } from 'react'
import { isAxiosError } from 'axios'
import { useNavigate } from 'react-router-dom'
import { getDashboardSummary } from '../services/dashboard.service'
import type { DashboardSummary } from '../types/dashboard'
import './dashboard.css'

const formatCurrency = (value: string): string => `₹${Number(value).toFixed(2)}`
const formatDate = (value: string): string => new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short' }).format(new Date(value))
const formatReminderDate = (value: string): string => {
  const reminder = new Date(value)
  const today = new Date()
  reminder.setHours(0, 0, 0, 0)
  today.setHours(0, 0, 0, 0)
  const days = Math.round((reminder.getTime() - today.getTime()) / 86400000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Tomorrow'
  if (days > 1) return `In ${days} days`
  return `${Math.abs(days)} day${Math.abs(days) === 1 ? '' : 's'} overdue`
}

const polarToCartesian = (cx: number, cy: number, radius: number, angleInDegrees: number) => {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0
  return {
    x: cx + radius * Math.cos(angleInRadians),
    y: cy + radius * Math.sin(angleInRadians),
  }
}

const describeArc = (x: number, y: number, radius: number, startAngle: number, endAngle: number) => {
  const start = polarToCartesian(x, y, radius, endAngle)
  const end = polarToCartesian(x, y, radius, startAngle)
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1'
  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y} L ${x} ${y} Z`
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadSummary = async () => {
      setLoading(true)
      setError('')
      try {
        const data = await getDashboardSummary()
        setSummary(data)
      } catch (requestError: unknown) {
        if (isAxiosError(requestError) && requestError.response?.status === 401) navigate('/login')
        else setError('Unable to load dashboard data.')
      } finally {
        setLoading(false)
      }
    }

    void loadSummary()
  }, [navigate])

  const healthyStock = Math.max(0, summary ? summary.totalMedicines - summary.lowStockMedicines - summary.expiringSoonMedicines : 0)
  const pieData = summary ? [
    { label: 'Healthy stock', value: healthyStock, color: '#22c55e' },
    { label: 'Low stock', value: summary.lowStockMedicines, color: '#f59e0b' },
    { label: 'Expiring soon', value: summary.expiringSoonMedicines, color: '#38bdf8' },
  ] : []
  const pieTotal = pieData.reduce((sum, item) => sum + item.value, 0)
  let currentAngle = 0
  const pieSegments = pieData.map((item) => {
    const startAngle = currentAngle
    const sweep = pieTotal ? (item.value / pieTotal) * 360 : 0
    const endAngle = startAngle + sweep
    const segment = { ...item, path: describeArc(120, 120, 90, startAngle, endAngle), percentage: pieTotal ? ((item.value / pieTotal) * 100).toFixed(0) : '0' }
    currentAngle = endAngle
    return segment
  })
  const completedCount = summary ? summary.recentSales.filter((sale) => sale.status === 'COMPLETED').length : 0
  const cancelledCount = summary ? summary.recentSales.filter((sale) => sale.status === 'CANCELLED').length : 0
  const salesTotal = summary ? summary.recentSales.reduce((sum, sale) => sum + Number(sale.grandTotal), 0) : 0

  return (
    <section className="dashboard-page dashboard-enter">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Business overview</p>
          <h2>Dashboard</h2>
          <p>Track sales, inventory and customer health in one place.</p>
        </div>
      </div>

      {error && <div className="dashboard-error">{error}</div>}

      {loading || !summary ? (
        <div className="dashboard-empty">Loading dashboard...</div>
      ) : (
        <>
          <div className="dashboard-grid">
            <article className="dashboard-card compact-card">
              <span className="dashboard-card-label">Sales today</span>
              <strong>{summary.totalSalesToday}</strong>
            </article>
            <article className="dashboard-card compact-card">
              <span className="dashboard-card-label">Revenue today</span>
              <strong>{formatCurrency(summary.totalRevenueToday)}</strong>
            </article>
            <article className="dashboard-card compact-card">
              <span className="dashboard-card-label">Active customers</span>
              <strong>{summary.totalCustomers}</strong>
            </article>
            <article className="dashboard-card compact-card">
              <span className="dashboard-card-label">Active medicines</span>
              <strong>{summary.totalMedicines}</strong>
            </article>
            <article className="dashboard-card compact-card">
              <span className="dashboard-card-label">Low stock</span>
              <strong>{summary.lowStockMedicines}</strong>
            </article>
            <article className="dashboard-card compact-card">
              <span className="dashboard-card-label">Expiring soon</span>
              <strong>{summary.expiringSoonMedicines}</strong>
            </article>
          </div>

          <div className="dashboard-splits">
            <article className="dashboard-card chart-card">
              <div className="chart-card-header">
                <div>
                  <h3>Stock health</h3>
                  <p>Proportion of healthy, low and soon-expiring inventory.</p>
                </div>
              </div>
              <div className="pie-chart-card">
                <svg width="240" height="240" viewBox="0 0 240 240" className="dashboard-pie">
                  <circle cx="120" cy="120" r="90" fill="#f8fbfd" />
                  {pieSegments.map((segment) => segment.value > 0 && (
                    <path key={segment.label} d={segment.path} fill={segment.color} />
                  ))}
                  <circle cx="120" cy="120" r="60" fill="#ffffff" />
                  <text x="120" y="115" textAnchor="middle" fill="#12344d" fontSize="18" fontWeight="700">{pieTotal}</text>
                  <text x="120" y="135" textAnchor="middle" fill="#6a8290" fontSize="12">items</text>
                </svg>
                <ul className="chart-legend">
                  {pieSegments.map((segment) => (
                    <li key={segment.label}>
                      <span className="legend-signal" style={{ background: segment.color }} />
                      <span>{segment.label}</span>
                      <strong>{segment.value}</strong>
                    </li>
                  ))}
                </ul>
              </div>
            </article>

            <article className="dashboard-card pivot-card">
              <div className="chart-card-header">
                <div>
                  <h3>Recent sales pivot</h3>
                  <p>Summary of the latest invoices by status and amount.</p>
                </div>
              </div>
              <table className="pivot-table">
                <thead>
                  <tr>
                    <th>Category</th>
                    <th>Count</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Completed</td>
                    <td>{completedCount}</td>
                    <td>{formatCurrency(String(summary.recentSales.filter((sale) => sale.status === 'COMPLETED').reduce((sum, sale) => sum + Number(sale.grandTotal), 0)))}</td>
                  </tr>
                  <tr>
                    <td>Cancelled</td>
                    <td>{cancelledCount}</td>
                    <td>{formatCurrency(String(summary.recentSales.filter((sale) => sale.status === 'CANCELLED').reduce((sum, sale) => sum + Number(sale.grandTotal), 0)))}</td>
                  </tr>
                  <tr className="pivot-total-row">
                    <td>Total</td>
                    <td>{summary.recentSales.length}</td>
                    <td>{formatCurrency(String(salesTotal))}</td>
                  </tr>
                </tbody>
              </table>
            </article>
          </div>

          <section className="reminder-section">
            <div className="section-header">
              <div>
                <h3>Customer reminders</h3>
                <p>Follow-up and refill reminders due in the next 7 days.</p>
              </div>
            </div>
            {summary.reminderCustomers.length === 0 ? (
              <div className="reminder-empty">No customer reminders due this week.</div>
            ) : (
              <div className="reminder-list">
                {summary.reminderCustomers.map((customer) => (
                  <button key={customer.id} type="button" className="reminder-item" onClick={() => navigate(`/customers/${customer.id}/edit`)}>
                    <div className="reminder-avatar" aria-hidden="true">{customer.name.charAt(0).toUpperCase()}</div>
                    <div className="reminder-details">
                      <strong>{customer.name}</strong>
                      <span>{customer.phone}</span>
                    </div>
                    <span className="reminder-date">{formatReminderDate(customer.reminderDate)}</span>
                  </button>
                ))}
              </div>
            )}
          </section>

          <section className="dashboard-section">
            <div className="section-header">
              <div>
                <h3>Recent sales</h3>
                <p>Latest invoices created in the store.</p>
              </div>
            </div>
            <div className="dashboard-table-card">
              {summary.recentSales.length === 0 ? (
                <p className="dashboard-table-empty">No recent sales yet.</p>
              ) : (
                <div className="table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th>Invoice</th>
                        <th>Customer</th>
                        <th>Date</th>
                        <th>Amount</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {summary.recentSales.map((sale) => (
                        <tr key={sale.id}>
                          <td>{sale.invoiceNumber}</td>
                          <td>{sale.customerName}</td>
                          <td>{formatDate(sale.createdAt)}</td>
                          <td>{formatCurrency(sale.grandTotal)}</td>
                          <td><span className={`status-pill ${sale.status === 'COMPLETED' ? 'completed' : 'cancelled'}`}>{sale.status}</span></td>
                          <td><button className="dashboard-action" onClick={() => navigate(`/invoices/${sale.id}`)}>View</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        </>
      )}
    </section>
  )
}
