'use client'

import { useEffect, useState } from 'react'
import {
  CreditCard,
  Receipt,
  CookingPot,
  Package,
  Truck,
  CheckCircle,
  XCircle,
  WarningCircle,
  CalendarBlank,
} from '@phosphor-icons/react'

/* ── Timeline steps definition ── */

const TIMELINE_STEPS = [
  { key: 'PENDIENTE_PAGO', label: 'Pedido recibido', icon: Receipt },
  { key: 'PAGO_CONFIRMADO', label: 'Pago confirmado', icon: CreditCard },
  { key: 'EN_PREPARACION', label: 'En preparación', icon: CookingPot },
  { key: 'LISTO', label: 'Listo', icon: Package },
  { key: 'EN_RUTA', label: 'En camino', icon: Truck },
  { key: 'ENTREGADO', label: 'Entregado', icon: CheckCircle },
] as const

const ESTADO_INDEX: Record<string, number> = {
  PENDIENTE_PAGO: 0,
  RECIBIDO: 1,
  PAGO_CONFIRMADO: 1,
  EN_PREPARACION: 2,
  LISTO: 3,
  EN_RUTA: 4,
  ENTREGADO: 5,
  CANCELADO: -1,
}

type Props = {
  estado: string
  interactive?: boolean
  onChangeEstado?: (nuevoEstado: string) => void
  isPending?: boolean
  tieneDelay?: boolean
  delayMotivo?: string | null
  fechaEntregaEstimada?: string | null
}

export function PedidoTimeline({
  estado,
  interactive = false,
  onChangeEstado,
  isPending = false,
  tieneDelay = false,
  delayMotivo,
  fechaEntregaEstimada,
}: Props) {
  const [phase, setPhase] = useState<0 | 1 | 2>(0)

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 80)
    const t2 = setTimeout(() => setPhase(2), 600)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [])

  const currentIndex = ESTADO_INDEX[estado] ?? -1
  const isCancelado = estado === 'CANCELADO'
  const isFinished = estado === 'ENTREGADO'

  const lineDuration = Math.max(800, currentIndex * 350)
  const iconActivateDelay = (i: number) => {
    if (currentIndex <= 0) return 0
    return (i / currentIndex) * lineDuration
  }

  const showDelay = tieneDelay && !isFinished
  const fechaFormateada = fechaEntregaEstimada
    ? new Date(fechaEntregaEstimada + 'T12:00:00').toLocaleDateString('es-MX', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      })
    : null

  if (isCancelado) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-dashed border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950/30">
        <XCircle size={24} weight="fill" className="shrink-0 text-red-500" />
        <div>
          <p className="text-sm font-medium text-red-700 dark:text-red-400">Pedido cancelado</p>
          <p className="text-xs text-red-500/70 dark:text-red-400/50">Este pedido ya no está activo.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        {/* Inline keyframes */}
        <style>{`
          @keyframes timeline-ripple {
            0% { box-shadow: 0 0 0 0 rgba(16,185,129,0.35); }
            70% { box-shadow: 0 0 0 10px rgba(16,185,129,0); }
            100% { box-shadow: 0 0 0 0 rgba(16,185,129,0); }
          }
          @keyframes timeline-ripple-amber {
            0% { box-shadow: 0 0 0 0 rgba(245,158,11,0.35); }
            70% { box-shadow: 0 0 0 10px rgba(245,158,11,0); }
            100% { box-shadow: 0 0 0 0 rgba(245,158,11,0); }
          }
          @keyframes timeline-line-shimmer {
            0% { background-position: -200% 0; }
            100% { background-position: 200% 0; }
          }
        `}</style>

        {/* Connecting line */}
        <div
          className="absolute left-0 right-0 px-[8.3%]"
          style={{
            top: '19px',
            zIndex: 0,
            opacity: phase >= 2 ? 1 : 0,
            transition: 'opacity 300ms ease',
          }}
        >
          <div className="relative h-[3px] w-full rounded-full bg-border/60">
            <div
              className="absolute inset-y-0 left-0 rounded-full"
              style={{
                background: showDelay
                  ? 'linear-gradient(90deg, rgb(16 185 129) 0%, rgb(245 158 11) 100%)'
                  : 'rgb(16 185 129)',
                width:
                  currentIndex > 0
                    ? `${(currentIndex / (TIMELINE_STEPS.length - 1)) * 100}%`
                    : '0%',
                transition: `width ${lineDuration}ms cubic-bezier(.25,.46,.45,.94)`,
              }}
            >
              <div
                className="absolute inset-0 rounded-full"
                style={{
                  background:
                    'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.35) 50%, transparent 100%)',
                  backgroundSize: '200% 100%',
                  animation:
                    phase >= 2 && currentIndex > 0
                      ? 'timeline-line-shimmer 2s ease-in-out infinite'
                      : 'none',
                  opacity: phase >= 2 && currentIndex > 0 ? 1 : 0,
                }}
              />
            </div>
          </div>
        </div>

        {/* Steps */}
        <div className="relative z-10 flex justify-between">
          {TIMELINE_STEPS.map((step, i) => {
            const Icon = step.icon
            const isActivated = i <= currentIndex
            const isCurrent = i === currentIndex
            const isDelayStep = showDelay && isCurrent
            const activateMs = iconActivateDelay(i)
            const fadeInDelay = i * 60

            const canClick =
              interactive &&
              !isPending &&
              i > currentIndex &&
              i === currentIndex + 1

            const activeColor = isDelayStep
              ? 'rgb(245 158 11)'
              : 'rgb(16 185 129)'

            const activeTextClass = isDelayStep
              ? 'text-amber-600 dark:text-amber-400'
              : 'text-emerald-600 dark:text-emerald-400'

            const rippleAnim = isDelayStep
              ? 'timeline-ripple-amber'
              : 'timeline-ripple'

            return (
              <div
                key={step.key}
                className="flex flex-1 flex-col items-center"
                style={{
                  opacity: phase >= 1 ? 1 : 0,
                  transform: phase >= 1 ? 'translateY(0)' : 'translateY(8px)',
                  transition: `opacity 400ms cubic-bezier(.22,1,.36,1) ${fadeInDelay}ms, transform 400ms cubic-bezier(.22,1,.36,1) ${fadeInDelay}ms`,
                }}
              >
                <button
                  type="button"
                  disabled={!canClick}
                  onClick={() => canClick && onChangeEstado?.(step.key)}
                  className={`
                    relative flex h-10 w-10 items-center justify-center rounded-full border-2
                    ${canClick ? 'cursor-pointer hover:scale-110 hover:shadow-md' : 'cursor-default'}
                  `}
                  style={{
                    borderColor: isActivated ? activeColor : 'rgb(209 213 219)',
                    backgroundColor: isActivated ? activeColor : 'rgb(243 244 246)',
                    color: isActivated ? 'white' : 'rgb(156 163 175)',
                    transition: `border-color 400ms ease ${activateMs}ms, background-color 400ms ease ${activateMs}ms, color 400ms ease ${activateMs}ms, transform 200ms ease`,
                    ...(isCurrent && isActivated
                      ? {
                          animation: `${rippleAnim} 2s cubic-bezier(0,0,0.2,1) infinite ${activateMs + 400}ms`,
                        }
                      : {}),
                  }}
                  title={interactive ? `Cambiar a: ${step.label}` : step.label}
                >
                  {isDelayStep && isActivated ? (
                    <WarningCircle size={18} weight="fill" />
                  ) : (
                    <Icon size={16} weight={isActivated ? 'fill' : 'regular'} />
                  )}
                </button>

                <span className="mt-2 text-center text-[10px] font-medium leading-tight sm:text-[11px]">
                  <span
                    className={`transition-colors duration-400 ${
                      isActivated ? activeTextClass : 'text-muted-foreground'
                    } ${isCurrent && isActivated ? 'font-semibold' : ''}`}
                    style={{ transitionDelay: `${activateMs}ms` }}
                  >
                    {isDelayStep && isActivated ? 'Con retraso' : step.label}
                  </span>
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* MercadoLibre-style delivery / delay banner */}
      {(fechaFormateada || showDelay) && (
        <div
          className={`flex items-center gap-3 rounded-lg px-4 py-3 ${
            showDelay
              ? 'bg-amber-50 border border-amber-200 dark:bg-amber-950/30 dark:border-amber-900'
              : 'bg-emerald-50 border border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-900'
          }`}
          style={{
            opacity: phase >= 2 ? 1 : 0,
            transform: phase >= 2 ? 'translateY(0)' : 'translateY(4px)',
            transition: 'opacity 400ms ease 300ms, transform 400ms ease 300ms',
          }}
        >
          {showDelay ? (
            <WarningCircle size={20} weight="fill" className="shrink-0 text-amber-500" />
          ) : (
            <CalendarBlank size={20} weight="fill" className="shrink-0 text-emerald-500" />
          )}
          <div className="min-w-0">
            {fechaFormateada ? (
              <p
                className={`text-sm font-semibold ${
                  showDelay
                    ? 'text-amber-800 dark:text-amber-300'
                    : 'text-emerald-800 dark:text-emerald-300'
                }`}
              >
                {showDelay ? 'Nueva fecha estimada: ' : 'Llega el '}
                <span className="capitalize">{fechaFormateada}</span>
              </p>
            ) : showDelay ? (
              <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
                Tu pedido tiene un retraso en la preparación
              </p>
            ) : null}
            {showDelay && delayMotivo && (
              <p className="text-xs text-amber-600/80 dark:text-amber-400/70 mt-0.5">
                {delayMotivo}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}