import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import type { Medicine } from '../types/medicine'
import { cartItemFromMedicine, type CartItem } from '../types/cart'

interface CartContextValue {
  cartItems: CartItem[]
  subtotal: number
  addItem: (medicine: Medicine) => { added: boolean; message?: string }
  removeItem: (medicineId: string) => void
  updateQuantity: (medicineId: string, quantity: number) => { updated: boolean; message?: string }
  clearCart: () => void
}

const CartContext = createContext<CartContextValue | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const addItem = useCallback((medicine: Medicine) => {
    if (medicine.stockQuantity < 1) return { added: false, message: 'This medicine is out of stock.' }
    const expired = new Date(medicine.expiryDate).getTime() <= Date.now()
    if (expired) return { added: false, message: 'Expired medicine cannot be sold.' }
    const existing = cartItems.find((item) => item.medicineId === medicine.id)
    if (existing && existing.quantity >= existing.availableStock) return { added: false, message: `Only ${existing.availableStock} units available.` }
    setCartItems((items) => existing ? items.map((item) => item.medicineId === medicine.id ? { ...item, quantity: item.quantity + 1 } : item) : [...items, cartItemFromMedicine(medicine)])
    return { added: true }
  }, [cartItems])
  const removeItem = useCallback((medicineId: string) => setCartItems((items) => items.filter((item) => item.medicineId !== medicineId)), [])
  const updateQuantity = useCallback((medicineId: string, quantity: number) => {
    const item = cartItems.find((candidate) => candidate.medicineId === medicineId)
    if (!item) return { updated: false, message: 'Cart item not found.' }
    if (quantity < 1) return { updated: false, message: 'Quantity cannot be less than 1.' }
    if (quantity > item.availableStock) return { updated: false, message: `Only ${item.availableStock} units available.` }
    setCartItems((items) => items.map((candidate) => candidate.medicineId === medicineId ? { ...candidate, quantity } : candidate))
    return { updated: true }
  }, [cartItems])
  const clearCart = useCallback(() => setCartItems([]), [])
  const subtotal = useMemo(() => cartItems.reduce((total, item) => total + Number(item.unitPrice) * item.quantity, 0), [cartItems])
  const value = useMemo(() => ({ cartItems, subtotal, addItem, removeItem, updateQuantity, clearCart }), [cartItems, subtotal, addItem, removeItem, updateQuantity, clearCart])
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart(): CartContextValue { const context = useContext(CartContext); if (!context) throw new Error('useCart must be used inside CartProvider'); return context }
