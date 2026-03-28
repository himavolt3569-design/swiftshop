'use client'

import { CheckCircle, Circle, AlertCircle, PauseCircle } from 'lucide-react'
import { OrderStatus, OrderEvent } from '@/lib/types'

const MILESTONES: { status: OrderStatus; label: string }[] = [
  { status: 'placed',      label: 'Order Placed'     },
  { status: 'confirmed',   label: 'Order Confirmed'  },
  { status: 'picked_up',  label: 'Picked Up'         },
  { status: 'on_the_way', label: 'On the Way'        },
  { status: 'delivered',   label: 'Delivered'         },
]

const STATUS_ORDER: OrderStatus[] = ['placed', 'confirmed', 'picked_up', 'on_the_way', 'delivered']

interface OrderTimelineProps {
  currentStatus: OrderStatus
  events: OrderEvent[]
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('en-NP', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

export function OrderTimeline({ currentStatus, events }: OrderTimelineProps) {
  const currentIndex = STATUS_ORDER.indexOf(currentStatus)
  const hasFailed    = currentStatus === 'failed'

  return (
    <div className="space-y-0">
      {MILESTONES.map((milestone, i) => {
        const reached  = STATUS_ORDER.indexOf(milestone.status) <= currentIndex
        const active   = milestone.status === currentStatus && !hasFailed
        const event    = events.find((e) => e.status === milestone.status)

        return (
          <div key={milestone.status} className="flex gap-4">
            {/* Icon column */}
            <div className="flex flex-col items-center">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center border-2 transition-colors ${
                reached
                  ? 'bg-primary border-primary text-white'
                  : 'bg-transparent border-outline-variant text-outline-variant'
              } ${active ? 'animate-pulse-dot' : ''}`}>
                {reached
                  ? <CheckCircle className="w-4 h-4" />
                  : <Circle      className="w-4 h-4" />}
              </div>
              {i < MILESTONES.length - 1 && (
                <div className={`w-0.5 flex-1 min-h-[2rem] my-1 transition-colors ${reached ? 'bg-primary/40' : 'bg-outline-variant/30'}`} />
              )}
            </div>

            {/* Label column */}
            <div className="pb-5 pt-0.5 flex-1">
              <p className={`text-sm font-semibold font-label ${reached ? 'text-on-surface' : 'text-on-surface-variant/50'}`}>
                {milestone.label}
              </p>
              {event && (
                <p className="text-xs text-on-surface-variant font-body mt-0.5">{formatDate(event.created_at)}</p>
              )}
              {event?.note && (
                <p className="text-xs text-on-surface-variant font-body mt-0.5 italic">{event.note}</p>
              )}
            </div>
          </div>
        )
      })}

      {/* Failed entry */}
      {hasFailed && (
        <div className="flex gap-4">
          <div className="flex flex-col items-center">
            <div className="w-7 h-7 rounded-full flex items-center justify-center border-2 bg-error border-error text-white">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="pb-5 pt-0.5 flex-1">
            <p className="text-sm font-semibold text-error font-label">Delivery Attempt Failed</p>
            <p className="text-xs text-on-surface-variant font-body mt-0.5">Our team will attempt re-delivery shortly.</p>
          </div>
        </div>
      )}

      {/* Held entry */}
      {currentStatus === 'held' && (
        <div className="flex gap-4">
          <div className="flex flex-col items-center">
            <div className="w-7 h-7 rounded-full flex items-center justify-center border-2 bg-surface-container-highest border-outline text-on-surface-variant">
              <PauseCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="pb-5 pt-0.5 flex-1">
            <p className="text-sm font-semibold text-on-surface-variant font-label">Order On Hold</p>
            <p className="text-xs text-on-surface-variant font-body mt-0.5">Your order is temporarily on hold. We will resume processing shortly.</p>
          </div>
        </div>
      )}
    </div>
  )
}
