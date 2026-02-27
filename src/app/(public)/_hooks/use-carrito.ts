'use client'

import { useState, useMemo, useCallback } from 'react'

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

export function useCarrito(productos: Producto[]) {
  const [carrito, setCarrito] = useState<Map<number, number>>(() => new Map())

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
