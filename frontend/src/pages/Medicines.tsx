import { useCallback, useEffect, useState } from 'react'
import { isAxiosError } from 'axios'
import { useNavigate } from 'react-router-dom'
import { createMedicine, deleteMedicine, getMedicines } from '../services/medicine.service'
import type { Medicine } from '../types/medicine'
import './medicine/MedicineForm.css'
import './medicines.css'

const formatDate = (value: string): string => new Intl.DateTimeFormat('en-IN', { month: 'short', year: 'numeric' }).format(new Date(value))
const formatMoney = (value: string): string => `₹${Number(value).toFixed(2)}`

export default function Medicines() {
  const navigate = useNavigate()
  const [medicines, setMedicines] = useState<Medicine[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<Medicine | null>(null)
  const [deleting, setDeleting] = useState(false)
  const loadMedicines = useCallback(async (currentPage: number, query: string) => { setLoading(true); setError(''); try { const result = await getMedicines({ page: currentPage, limit: 10, search: query }); setMedicines(result.medicines); setTotalPages(Math.max(1, result.pagination.totalPages)) } catch (requestError: unknown) { if (isAxiosError(requestError) && requestError.response?.status === 401) navigate('/login'); else setError('Failed to load medicines.') } finally { setLoading(false) } }, [navigate])
  useEffect(() => { const timer = window.setTimeout(() => { setPage(1); void loadMedicines(1, search) }, 300); return () => window.clearTimeout(timer) }, [search, loadMedicines])
  useEffect(() => { if (page > 1) void loadMedicines(page, search) }, [page, search, loadMedicines])
  const confirmDelete = async () => { if (!deleteTarget) return; setDeleting(true); try { await deleteMedicine(deleteTarget.id); setDeleteTarget(null); await loadMedicines(page, search) } catch { setError('Failed to delete medicine.') } finally { setDeleting(false) } }
  return <section className="medicine-page"><div className="page-heading"><div><p className="eyebrow">Catalog and stock foundation</p><h2>Medicines</h2><p>Manage the active medicine catalog for your store.</p></div><button className="primary-button" onClick={() => navigate('/medicines/new')}>+ Add Medicine</button></div><div className="medicine-toolbar"><input className="medicine-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search medicine, generic name, barcode or batch..." aria-label="Search medicines" /></div>{error && <p className="medicine-error" role="alert">{error}</p>}<div className="medicine-table-card">{loading ? <p className="table-message">Loading medicines...</p> : medicines.length === 0 ? <div className="table-message"><strong>{search ? 'No medicines match your search.' : 'No medicines found.'}</strong>{!search && <span>Add your first medicine to get started.</span>}</div> : <div className="table-scroll"><table><thead><tr><th>Medicine Name</th><th>Generic Name</th><th>Batch</th><th>Expiry</th><th>MRP</th><th>Selling Price</th><th>GST</th><th>Stock</th><th>Status</th><th>Actions</th></tr></thead><tbody>{medicines.map((medicine) => <tr key={medicine.id}><td><strong>{medicine.name}</strong></td><td>{medicine.genericName || '—'}</td><td>{medicine.batchNumber}</td><td>{formatDate(medicine.expiryDate)}</td><td>{formatMoney(medicine.mrp)}</td><td>{formatMoney(medicine.sellingPrice)}</td><td>{medicine.gstPercentage}%</td><td>{medicine.stockQuantity}</td><td><span className="active-pill">Active</span></td><td><div className="row-actions"><button onClick={() => navigate(`/medicines/${medicine.id}/edit`)}>Edit</button><button className="danger-action" onClick={() => setDeleteTarget(medicine)}>Delete</button></div></td></tr>)}</tbody></table></div>}{!loading && totalPages > 1 && <div className="pagination"><button onClick={() => setPage((current) => current - 1)} disabled={page === 1}>Previous</button><span>Page {page} of {totalPages}</span><button onClick={() => setPage((current) => current + 1)} disabled={page === totalPages}>Next</button></div>}</div>{deleteTarget && <div className="modal-backdrop" role="presentation"><div className="confirm-dialog" role="dialog" aria-modal="true"><h3>Delete medicine?</h3><p>Are you sure you want to delete this medicine?</p><div className="form-actions"><button className="secondary-button" onClick={() => setDeleteTarget(null)} disabled={deleting}>Cancel</button><button className="delete-button" onClick={() => void confirmDelete()} disabled={deleting}>{deleting ? 'Deleting…' : 'Delete'}</button></div></div></div>}</section>
}
