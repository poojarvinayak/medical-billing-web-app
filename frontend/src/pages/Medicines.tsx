import { useCallback, useEffect, useRef, useState } from 'react'
import * as XLSX from 'xlsx'
import { isAxiosError } from 'axios'
import { useNavigate } from 'react-router-dom'
import { createMedicine, deleteMedicine, getMedicines, importMedicines } from '../services/medicine.service'
import type { BulkImportFailure, Medicine } from '../types/medicine'
import './medicine/MedicineForm.css'
import './medicines.css'

const formatDate = (value: string): string => new Intl.DateTimeFormat('en-IN', { month: 'short', year: 'numeric' }).format(new Date(value))
const formatMoney = (value: string): string => `₹${Number(value).toFixed(2)}`

const importHeaders: Record<string, string> = {
  productid: 'id', medicineid: 'id', id: 'id',
  name: 'name', medicinename: 'name', medicine: 'name',
  genericname: 'genericName', generic: 'genericName',
  barcode: 'barcode', batchnumber: 'batchNumber', batch: 'batchNumber',
  expirydate: 'expiryDate', expiry: 'expiryDate',
  mrp: 'mrp', sellingprice: 'sellingPrice', saleprice: 'sellingPrice',
  gst: 'gstPercentage', gstpercentage: 'gstPercentage', gstpercent: 'gstPercentage',
  stock: 'stockQuantity', stockquantity: 'stockQuantity', quantity: 'stockQuantity',
}

const normalizeHeader = (value: unknown) => String(value ?? '').trim().toLowerCase().replace(/[^a-z0-9]/g, '')

const toDateInput = (value: unknown): string => {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value.toISOString().slice(0, 10)
  if (typeof value === 'number') {
    const parsed = XLSX.SSF.parse_date_code(value)
    if (parsed) return `${parsed.y}-${String(parsed.m).padStart(2, '0')}-${String(parsed.d).padStart(2, '0')}`
  }
  const text = String(value ?? '').trim()
  if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(text)) return text
  const match = text.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})$/)
  if (match) return `${match[3]}-${match[2].padStart(2, '0')}-${match[1].padStart(2, '0')}`
  return text
}

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
  const [importing, setImporting] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [importResult, setImportResult] = useState('')
  const [failedImports, setFailedImports] = useState<BulkImportFailure[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const loadMedicines = useCallback(async (currentPage: number, query: string) => { setLoading(true); setError(''); try { const result = await getMedicines({ page: currentPage, limit: 10, search: query }); setMedicines(result.medicines); setTotalPages(Math.max(1, result.pagination.totalPages)) } catch (requestError: unknown) { if (isAxiosError(requestError) && requestError.response?.status === 401) navigate('/login'); else setError('Failed to load medicines.') } finally { setLoading(false) } }, [navigate])
  useEffect(() => { const timer = window.setTimeout(() => { setPage(1); void loadMedicines(1, search) }, 300); return () => window.clearTimeout(timer) }, [search, loadMedicines])
  useEffect(() => { if (page > 1) void loadMedicines(page, search) }, [page, search, loadMedicines])
  const confirmDelete = async () => { if (!deleteTarget) return; setDeleting(true); try { await deleteMedicine(deleteTarget.id); setDeleteTarget(null); await loadMedicines(page, search) } catch { setError('Failed to delete medicine.') } finally { setDeleting(false) } }

  const downloadTemplate = () => {
    const worksheet = XLSX.utils.json_to_sheet([{
      'Product ID': '', 'Medicine Name': '', 'Generic Name': '', Barcode: '', 'Batch Number': '', 'Expiry Date': '2027-12-31', MRP: '', 'Selling Price': '', 'GST %': 0, 'Stock Quantity': 0,
    }])
    worksheet['!cols'] = [{ wch: 26 }, { wch: 24 }, { wch: 20 }, { wch: 16 }, { wch: 16 }, { wch: 14 }, { wch: 12 }, { wch: 14 }, { wch: 10 }, { wch: 14 }]
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Products')
    XLSX.writeFile(workbook, 'medicine-import-template.xlsx')
  }

  const exportProducts = async () => {
    setExporting(true)
    setError('')
    try {
      const all: Medicine[] = []
      let currentPage = 1
      let totalPagesToExport = 1
      do {
        const result = await getMedicines({ page: currentPage, limit: 100, search })
        all.push(...result.medicines)
        totalPagesToExport = result.pagination.totalPages
        currentPage += 1
      } while (currentPage <= totalPagesToExport)

      const worksheet = XLSX.utils.json_to_sheet(all.map((medicine) => ({
        'Product ID': medicine.id,
        'Medicine Name': medicine.name,
        'Generic Name': medicine.genericName ?? '',
        Barcode: medicine.barcode ?? '',
        'Batch Number': medicine.batchNumber,
        'Expiry Date': medicine.expiryDate.slice(0, 10),
        MRP: medicine.mrp,
        'Selling Price': medicine.sellingPrice,
        'GST %': medicine.gstPercentage,
        'Stock Quantity': medicine.stockQuantity,
      })))
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Products')
      XLSX.writeFile(workbook, 'products.xlsx')
    } catch {
      setError('Failed to export products.')
    } finally {
      setExporting(false)
    }
  }

  const downloadFailedImports = () => {
    if (failedImports.length === 0) return
    const worksheet = XLSX.utils.json_to_sheet(failedImports.map((failure) => ({
      'Product ID': failure.id ?? '',
      'Medicine Name': failure.name ?? '',
      'Generic Name': failure.genericName ?? '',
      Barcode: failure.barcode ?? '',
      'Batch Number': failure.batchNumber ?? '',
      'Expiry Date': toDateInput(failure.expiryDate),
      MRP: failure.mrp ?? '',
      'Selling Price': failure.sellingPrice ?? '',
      'GST %': failure.gstPercentage ?? 0,
      'Stock Quantity': failure.stockQuantity ?? 0,
      'Excel Row': failure.row,
      'Error Message': failure.error,
    })))
    worksheet['!cols'] = [{ wch: 26 }, { wch: 24 }, { wch: 20 }, { wch: 16 }, { wch: 16 }, { wch: 14 }, { wch: 12 }, { wch: 14 }, { wch: 10 }, { wch: 14 }, { wch: 12 }, { wch: 50 }]
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Failed Products')
    XLSX.writeFile(workbook, 'failed-imported-products.xlsx')
  }

  const handleImport = async (file: File) => {
    setImporting(true)
    setError('')
    setImportResult('')
    setFailedImports([])
    try {
      const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array', cellDates: true })
      const firstSheet = workbook.SheetNames[0]
      if (!firstSheet) throw new Error('No worksheet found')
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets[firstSheet], { defval: '' })
      const payload = rows.flatMap((row, index) => {
        const mapped: Record<string, unknown> = {}
        Object.entries(row).forEach(([header, value]) => {
          const field = importHeaders[normalizeHeader(header)]
          if (field) mapped[field] = value
        })
        if (!Object.values(mapped).some((value) => String(value ?? '').trim())) return []
        return [{
          row: index + 2,
          id: String(mapped.id ?? '').trim(),
          medicine: {
            name: String(mapped.name ?? '').trim(),
            genericName: String(mapped.genericName ?? '').trim(),
            barcode: String(mapped.barcode ?? '').trim(),
            batchNumber: String(mapped.batchNumber ?? '').trim(),
            expiryDate: toDateInput(mapped.expiryDate),
            mrp: String(mapped.mrp ?? '').trim(),
            sellingPrice: String(mapped.sellingPrice ?? '').trim(),
            gstPercentage: Number(mapped.gstPercentage ?? 0),
            stockQuantity: Number(mapped.stockQuantity ?? 0),
          },
        }]
      })
      if (payload.length === 0) throw new Error('The Excel sheet contains no product rows')
      const result = await importMedicines(payload)
      await loadMedicines(1, search)
      setPage(1)
      setImportResult(result.failed.length === 0
        ? `${result.imported} product(s) added; ${result.updated} product(s) updated successfully.`
        : `${result.imported} added; ${result.updated} updated; ${result.failed.length} failed.${result.failed.length ? ` First issue: Row ${result.failed[0].row}: ${result.failed[0].error}` : ''}`)
      if (result.failed.length) {
        setFailedImports(result.failed)
        setError(`${result.failed.length} row(s) could not be imported. Download the failed-products Excel sheet to correct and re-import them.`)
      }
    } catch (requestError: unknown) {
      setError(isAxiosError(requestError) ? (requestError as { response?: { data?: { message?: string } } }).response?.data?.message ?? 'Failed to import products.' : requestError instanceof Error ? requestError.message : 'Failed to import products.')
    } finally {
      setImporting(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }
  return <section className="medicine-page"><div className="page-heading"><div><p className="eyebrow">Catalog and stock foundation</p><h2>Medicines</h2><p>Manage the active medicine catalog for your store.</p></div><div className="page-heading-actions"><button className="secondary-button" type="button" onClick={downloadTemplate}>Download Template</button><button className="secondary-button" type="button" onClick={() => void exportProducts()} disabled={exporting}>{exporting ? 'Exporting…' : 'Export Excel'}</button><button className="secondary-button" type="button" onClick={() => fileInputRef.current?.click()} disabled={importing}>{importing ? 'Importing…' : 'Import Excel'}</button><button className="primary-button" onClick={() => navigate('/medicines/new')}>+ Add Medicine</button><input ref={fileInputRef} className="excel-file-input" type="file" accept=".xlsx,.xls,.csv" onChange={(event) => { const file = event.target.files?.[0]; if (file) void handleImport(file) }} /></div></div><div className="medicine-toolbar"><input className="medicine-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search medicine, generic name, barcode or batch..." aria-label="Search medicines" /></div>{error && <p className="medicine-error" role="alert">{error}</p>}{importResult && <div className="medicine-import-result" role="status"><span>{importResult}</span>{failedImports.length > 0 && <button type="button" className="download-failed-button" onClick={downloadFailedImports}>Download Failed Products</button>}</div>}<div className="medicine-table-card">{loading ? <p className="table-message">Loading medicines...</p> : medicines.length === 0 ? <div className="table-message"><strong>{search ? 'No medicines match your search.' : 'No medicines found.'}</strong>{!search && <span>Add your first medicine to get started.</span>}</div> : <div className="table-scroll"><table><thead><tr><th>Product ID</th><th>Medicine Name</th><th>Generic Name</th><th>Batch</th><th>Expiry</th><th>MRP</th><th>Selling Price</th><th>GST</th><th>Stock</th><th>Status</th><th>Actions</th></tr></thead><tbody>{medicines.map((medicine) => <tr key={medicine.id}><td><code>{medicine.id}</code></td><td><strong>{medicine.name}</strong></td><td>{medicine.genericName || '—'}</td><td>{medicine.batchNumber}</td><td>{formatDate(medicine.expiryDate)}</td><td>{formatMoney(medicine.mrp)}</td><td>{formatMoney(medicine.sellingPrice)}</td><td>{medicine.gstPercentage}%</td><td>{medicine.stockQuantity}</td><td><span className="active-pill">Active</span></td><td><div className="row-actions"><button onClick={() => navigate(`/medicines/${medicine.id}/edit`)}>Edit</button><button className="danger-action" onClick={() => setDeleteTarget(medicine)}>Delete</button></div></td></tr>)}</tbody></table></div>}{!loading && totalPages > 1 && <div className="pagination"><button onClick={() => setPage((current) => current - 1)} disabled={page === 1}>Previous</button><span>Page {page} of {totalPages}</span><button onClick={() => setPage((current) => current + 1)} disabled={page === totalPages}>Next</button></div>}</div>{deleteTarget && <div className="modal-backdrop" role="presentation"><div className="confirm-dialog" role="dialog" aria-modal="true"><h3>Delete medicine?</h3><p>Are you sure you want to delete this medicine?</p><div className="form-actions"><button className="secondary-button" onClick={() => setDeleteTarget(null)} disabled={deleting}>Cancel</button><button className="delete-button" onClick={() => void confirmDelete()} disabled={deleting}>{deleting ? 'Deleting…' : 'Delete'}</button></div></div></div>}</section>
}
