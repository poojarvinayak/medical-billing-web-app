import { Navigate, Route, Routes } from 'react-router-dom'
import AppLayout from '../layouts/AppLayout'
import ComingSoonPage from '../pages/ComingSoonPage'
import DashboardPage from '../pages/DashboardPage'
import Login from '../pages/Login'
import ProtectedRoute from './ProtectedRoute'
import Medicines from '../pages/Medicines'
import MedicineFormPage from '../pages/medicine/MedicineFormPage'
import Customers from '../pages/Customers'
import CustomerFormPage from '../pages/customer/CustomerFormPage'
import Billing from '../pages/Billing'
import InvoicePreview from '../pages/InvoicePreview'
import Inventory from '../pages/Inventory'
import Sales from '../pages/Sales'

const placeholderPaths = ['billing', 'medicines', 'purchases', 'customers', 'suppliers', 'reports', 'settings']

export default function AppRoutes() {
  return <Routes><Route path="/login" element={<Login />} /><Route element={<ProtectedRoute />}><Route element={<AppLayout />}><Route path="/dashboard" element={<DashboardPage />} /><Route path="/billing" element={<Billing />} /><Route path="/sales" element={<Sales />} /><Route path="/inventory" element={<Inventory />} /><Route path="/invoices/:saleId" element={<InvoicePreview />} /><Route path="/medicines" element={<Medicines />} /><Route path="/medicines/new" element={<MedicineFormPage />} /><Route path="/medicines/:id/edit" element={<MedicineFormPage />} /><Route path="/customers" element={<Customers />} /><Route path="/customers/new" element={<CustomerFormPage />} /><Route path="/customers/:id/edit" element={<CustomerFormPage />} />{placeholderPaths.filter((path) => path !== 'billing' && path !== 'medicines' && path !== 'customers').map((path) => <Route key={path} path={`/${path}`} element={<ComingSoonPage />} />)}</Route></Route><Route path="*" element={<Navigate to="/dashboard" replace />} /></Routes>
}
