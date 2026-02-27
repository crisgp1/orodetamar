'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { SignOutButton } from '@clerk/nextjs'
import {
  ChartBar,
  Package,
  Warehouse,
  Handshake,
  ShoppingCart,
  Users,
  Storefront,
  MapPin,
  Flask,
  Receipt,
  TrendUp,
  SignOut,
  List,
  X,
} from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import { Separator } from '@/components/ui/separator'

type NavItem = { name: string; href: string; icon: React.ComponentType<{ size?: number; weight?: 'regular' | 'fill' }> }

const sections: { label: string; items: NavItem[] }[] = [
  {
    label: 'Principal',
    items: [
      { name: 'Dashboard', href: '/dashboard', icon: ChartBar },
      { name: 'Consignaciones', href: '/consignaciones', icon: Handshake },
      { name: 'Inventario', href: '/inventario', icon: Warehouse },
      { name: 'Ventas Stand', href: '/ventas-stand', icon: Storefront },
    ],
  },
  {
    label: 'Catálogo',
    items: [
      { name: 'Productos', href: '/productos', icon: Package },
      { name: 'Clientes', href: '/clientes', icon: Users },
    ],
  },
  {
    label: 'Operaciones',
    items: [
      { name: 'Pedidos', href: '/pedidos', icon: ShoppingCart },
    ],
  },
  {
    label: 'Administración',
    items: [
      { name: 'Materias Primas', href: '/materias-primas', icon: Flask },
      { name: 'Gastos', href: '/gastos', icon: Receipt },
      { name: 'Ubicaciones', href: '/ubicaciones', icon: MapPin },
      { name: 'Rentabilidad', href: '/rentabilidad', icon: TrendUp },
    ],
  },
]

interface SidebarProps {
  open: boolean
  onClose: () => void
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname()

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-border bg-sidebar transition-transform duration-200 lg:static lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Header */}
        <div className="flex h-14 items-center justify-between border-b border-border px-4">
          <Link href="/dashboard" className="text-lg font-semibold text-sidebar-foreground">
            Oro de Tamar
          </Link>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-sidebar-foreground hover:bg-sidebar-accent lg:hidden"
          >
            <X size={20} weight="regular" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-3">
          {sections.map((section, idx) => (
            <div key={section.label}>
              {idx > 0 && <Separator className="my-2" />}
              <p className="mb-1 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {section.label}
              </p>
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onClose}
                      className={cn(
                        'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                          : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
                      )}
                    >
                      <Icon size={20} weight={isActive ? 'fill' : 'regular'} />
                      {item.name}
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t border-border p-3">
          <SignOutButton>
            <button className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent/50">
              <SignOut size={20} weight="regular" />
              Cerrar sesión
            </button>
          </SignOutButton>
        </div>
      </aside>
    </>
  )
}

export function SidebarTrigger({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="rounded-md p-2 text-foreground hover:bg-accent lg:hidden"
    >
      <List size={20} weight="regular" />
    </button>
  )
}
