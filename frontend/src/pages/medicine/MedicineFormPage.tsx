import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { createMedicine, getMedicine, updateMedicine } from '../../services/medicine.service'
import type { CreateMedicineRequest, Medicine } from '../../types/medicine'
import MedicineForm from './MedicineForm'
import './medicine-page.css'

export default function MedicineFormPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const editing = Boolean(id)
  const [medicine, setMedicine] = useState<Medicine | undefined>()
  const [loading, setLoading] = useState(editing)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  useEffect(() => { if (!id) return; void getMedicine(id).then(setMedicine).catch(() => setError('Medicine not found.')).finally(() => setLoading(false)) }, [id])
  const submit = async (data: CreateMedicineRequest) => { setSaving(true); try { if (id) await updateMedicine(id, data); else await createMedicine(data); navigate('/medicines') } catch (requestError: unknown) { const responseMessage = requestError && typeof requestError === 'object' && 'response' in requestError ? ((requestError as { response?: { data?: { message?: string } } }).response?.data?.message) : undefined; setError(responseMessage ?? 'Failed to save medicine.') } finally { setSaving(false) } }
  if (loading) return <section className="medicine-form-page"><p>Loading medicine...</p></section>
  return <section className="medicine-form-page"><div className="page-heading"><div><p className="eyebrow">Medicine catalog</p><h2>{editing ? 'Edit Medicine' : 'Add Medicine'}</h2><p>{editing ? 'Update the medicine details below.' : 'Add a medicine to the active catalog.'}</p></div></div>{error && <p className="medicine-error" role="alert">{error}</p>}<div className="medicine-form-card"><MedicineForm mode={editing ? 'edit' : 'create'} medicine={medicine} saving={saving} onCancel={() => navigate('/medicines')} onSubmit={submit} /></div></section>
}
