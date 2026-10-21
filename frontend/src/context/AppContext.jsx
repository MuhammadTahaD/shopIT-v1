import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { authApi } from '../services/shop'

const AppContext = createContext(null)
const storedCart = () => { try { return JSON.parse(localStorage.getItem('shopit-cart') || '[]') } catch { return [] } }

export function AppProvider({ children }) {
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [cart, setCart] = useState(storedCart)
  useEffect(() => { localStorage.setItem('shopit-cart', JSON.stringify(cart)) }, [cart])
  useEffect(() => { authApi.me().then(({ data }) => setUser(data.user)).catch(() => setUser(null)).finally(() => setAuthLoading(false)) }, [])
  const addToCart = (product, quantity = 1) => setCart((items) => {
    const id = product._id
    const existing = items.find((item) => item.product._id === id)
    if (existing) return items.map((item) => item.product._id === id ? { ...item, quantity: Math.min(item.quantity + quantity, product.stock) } : item)
    return [...items, { product, quantity: Math.min(quantity, product.stock) }]
  })
  const updateQuantity = (id, quantity) => setCart((items) => items.map((item) => item.product._id === id ? { ...item, quantity: Math.max(1, Math.min(Number(quantity), item.product.stock)) } : item))
  const removeFromCart = (id) => setCart((items) => items.filter((item) => item.product._id !== id))
  const logout = async () => { try { await authApi.logout() } finally { setUser(null) } }
  const value = useMemo(() => ({ user, setUser, authLoading, cart, setCart, addToCart, updateQuantity, removeFromCart, logout, cartCount: cart.reduce((sum, i) => sum + i.quantity, 0), subtotal: cart.reduce((sum, i) => sum + i.product.price * i.quantity, 0) }), [user, authLoading, cart])
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}
export const useApp = () => useContext(AppContext)
