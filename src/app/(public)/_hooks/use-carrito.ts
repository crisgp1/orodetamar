'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'

const STORAGE_KEY = 'odt_carrito'

/** Serialise Map → localStorage */
function persistCart(map: Map<number, number>) {
  try {
    const arr = Array.from(map.entries())
    localStorage.setItem(STORAGE_KEY, JSON.stringify(arr))
  } catch { /* SSR / quota */ }
}

/** Read localStorage → Map (once, on mount) */
function loadCart(): Map<number, number> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const arr: [number, number][] = JSON.parse(raw)
      return new Map(arr)
    }
  } catch { /* SSR */ }
  return new Map()
}

type Producto = {
  id: number
  nombre: string
  presentacion: string
  peso_gramos: number
  precio_venta: number
  imagen_url: string | null
  es_snack: boolean
  categoria_id: number
}

export { STORAGE_KEY, loadCart }

export function useCarrito(productos: Producto[]) {
  const [carrito, setCarrito] = useState<Map<number, number>>(() => loadCart())

  /* Persist on every change (skip initial empty) */
  useEffect(() => {
    persistCart(carrito)
  }, [carrito])

  const totalItems = useMemo(() => {
    let sum = 0
    carrito.forEach((qty) => (sum += qty))
    return sum
  }, [carrito])

  const totalEstimado = useMemo(() => {
    let sum = 0
    carrito.forEach((qty, pid) => {
      const p = productos.find((pr) => pr.id === pid)
      if (p) sum += p.precio_venta * qty
    })
    return sum
  }, [carrito, productos])

  const carritoItems = useMemo(() => {
    const items: { producto: Producto; cantidad: number }[] = []
    carrito.forEach((qty, pid) => {
      const p = productos.find((pr) => pr.id === pid)
      if (p) items.push({ producto: p, cantidad: qty })
    })
    return items
  }, [carrito, productos])

  const agregar = useCallback((productoId: number) => {
    setCarrito((prev) => {
      const next = new Map(prev)
      next.set(productoId, (next.get(productoId) ?? 0) + 1)
      return next
    })
  }, [])

  const cambiarCantidad = useCallback((productoId: number, delta: number) => {
    setCarrito((prev) => {
      const next = new Map(prev)
      const newQty = (next.get(productoId) ?? 0) + delta
      if (newQty <= 0) next.delete(productoId)
      else next.set(productoId, newQty)
      return next
    })
  }, [])

  const quitar = useCallback((productoId: number) => {
    setCarrito((prev) => {
      const next = new Map(prev)
      next.delete(productoId)
      return next
    })
  }, [])

  const limpiar = useCallback(() => setCarrito(new Map()), [])

  return {
    carrito,
    totalItems,
    totalEstimado,
    carritoItems,
    agregar,
    cambiarCantidad,
    quitar,
    limpiar,
  }
}
