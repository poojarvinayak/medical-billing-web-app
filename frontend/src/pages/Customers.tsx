import { useCallback, useEffect, useState } from 'react'
import { isAxiosError } from 'axios'
import { useNavigate } from 'react-router-dom'
import { getCustomers } from '../services/customer.service'
import type { Customer } from '../types/customer'
import './customers.css'

export default function Customers() {
  const navigate = useNavigate(); const [customers, setCustomers] = useState<Customer[]>([]); const [page, setPage] = useState(1); const [totalPages, setTotalPages] = useState(1); const [search, setSearch] = useState(''); const [loading, setLoading] = useState(true); const [error, setError] = useState('')
  const loadCustomers = useCallback(async (currentPage: number, query: string) => { setLoading(true); setError(''); try { const result = await getCustomers({ page: currentPage, limit: 10, search: query }); setCustomers(result.customers); setTotalPages(Math.max(1, result.pagination.totalPages)) } catch (requestError: unknown) { if (isAxiosError(requestError) && requestError.response?.status === 401) navigate('/login'); else setError('Failed to load customers.') } finally { setLoading(false) } }, [navigate])
  useEffect(() => { const timer = window.setTimeout(() => { setPage(1); void loadCustomers(1, search) }, 350); return () => window.clearTimeout(timer) }, [search, loadCustomers])
  useEffect(() => { if (page > 1) void loadCustomers(page, search) }, [page, search, loadCustomers])
  const pageNumbers = Array.from({ length: totalPages }, (_, index) => index + 1).slice(Math.max(0, page - 3), Math.min(totalPages, page + 2))
  const formatDate = (dateString?: string) => dateString ? new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(dateString)) : '—'
  const isReminderDue = (dateString?: string) => {
    if (!dateString) return false
    const date = new Date(dateString)
    const today = new Date()
    const tomorrow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)
    return date.toDateString() === tomorrow.toDateString()
  }
  return <section className="customer-page"><div className="page-heading"><div><p className="eyebrow">Customer master records</p><h2>Customers</h2><p>Manage the customer directory for future billing workflows.</p></div><button className="primary-button" onClick={() => navigate('/customers/new')}>+ Add Customer</button></div><input className="customer-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by name, phone or email..." aria-label="Search customers" />{error && <p className="customer-error" role="alert">{error}</p>}<div className="customer-table-card">{loading ? <p className="customer-table-message">Loading customers...</p> : customers.length === 0 ? <div className="customer-table-message"><strong>{search ? 'No customers match your search.' : 'No customers found.'}</strong>{!search && <span>Add your first customer to get started.</span>}</div> : <div className="customer-table-scroll"><table className="customer-table"><thead><tr><th>Name</th><th>Phone</th><th>Email</th><th>City</th><th>State</th><th>Reminder</th><th>Actions</th></tr></thead><tbody>{customers.map((customer) => <tr key={customer.id}><td><strong>{customer.name}</strong></td><td>{customer.phone}</td><td>{customer.email || '—'}</td><td>{customer.city || '—'}</td><td>{customer.state || '—'}</td><td>{isReminderDue(customer.reminderDate) ? <span className="reminder-badge">Reminder tomorrow</span> : formatDate(customer.reminderDate)}</td><td><button className="customer-row-action" onClick={() => navigate(`/customers/${customer.id}/edit`)}>Edit</button></td></tr>)}</tbody></table></div>}{!loading && totalPages > 1 && <div className="customer-pagination"><button onClick={() => setPage((current) => current - 1)} disabled={page === 1}>Previous</button>{pageNumbers.map((number) => <button key={number} className={number === page ? 'current-page' : ''} onClick={() => setPage(number)}>{number}</button>)}<button onClick={() => setPage((current) => current + 1)} disabled={page === totalPages}>Next</button></div>}</div></section>
}
