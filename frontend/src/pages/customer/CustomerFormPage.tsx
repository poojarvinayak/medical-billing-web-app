import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { createCustomer, getCustomer, updateCustomer } from '../../services/customer.service'
import type { CreateCustomerRequest, Customer } from '../../types/customer'
import CustomerForm from './CustomerForm'
import './customer-page.css'

export default function CustomerFormPage() {
  const { id } = useParams<{ id: string }>(); const navigate = useNavigate(); const editing = Boolean(id)
  const [customer, setCustomer] = useState<Customer>(); const [loading, setLoading] = useState(editing); const [saving, setSaving] = useState(false); const [error, setError] = useState('')
  useEffect(() => { if (!id) return; void getCustomer(id).then(setCustomer).catch(() => setError('Customer not found.')).finally(() => setLoading(false)) }, [id])
  const submit = async (data: CreateCustomerRequest) => { setSaving(true); try { if (id) await updateCustomer(id, data); else await createCustomer(data); navigate('/customers') } catch (requestError: unknown) { const responseMessage = requestError && typeof requestError === 'object' && 'response' in requestError ? ((requestError as { response?: { data?: { message?: string } } }).response?.data?.message) : undefined; setError(responseMessage ?? 'Failed to save customer.') } finally { setSaving(false) } }
  if (loading) return <section className="customer-form-page"><p>Loading customer...</p></section>
  return <section className="customer-form-page"><div className="page-heading"><div><p className="eyebrow">Customer master records</p><h2>{editing ? 'Edit Customer' : 'Add Customer'}</h2><p>{editing ? 'Update the customer details below.' : 'Add a customer to the store directory.'}</p></div></div>{error && <p className="customer-error" role="alert">{error}</p>}<div className="customer-form-card"><CustomerForm mode={editing ? 'edit' : 'create'} customer={customer} saving={saving} onCancel={() => navigate('/customers')} onSubmit={submit} /></div></section>
}
