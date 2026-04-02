'use client'

import { useState } from 'react'
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react'

export interface Column<T> {
  key:       keyof T | string
  label:     string
  sortable?:  boolean
  render?:   (row: T) => React.ReactNode
  width?:    string
  mobileHide?: boolean  // hide this column on small screens
}

interface AdminTableProps<T extends Record<string, unknown>> {
  columns:  Column<T>[]
  data:     T[]
  onRowClick?: (row: T) => void
  loading?: boolean
  emptyMessage?: string
  keyField: keyof T
}

export function AdminTable<T extends Record<string, unknown>>({
  columns, data, onRowClick, loading, emptyMessage = 'No records found.', keyField
}: AdminTableProps<T>) {
  const [sortKey, setSortKey]     = useState<string | null>(null)
  const [sortDir, setSortDir]     = useState<'asc' | 'desc'>('asc')

  const handleSort = (key: string) => {
    if (sortKey === key) setSortDir((d) => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
  }

  const sorted = [...data].sort((a, b) => {
    if (!sortKey) return 0
    const av = a[sortKey] as string | number | null | undefined
    const bv = b[sortKey] as string | number | null | undefined
    if (av == null) return 1
    if (bv == null) return -1
    const cmp = av < bv ? -1 : av > bv ? 1 : 0
    return sortDir === 'asc' ? cmp : -cmp
  })

  return (
    <div className="overflow-x-auto rounded-2xl border border-outline-variant/20 shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-surface-container/60 border-b border-outline-variant/15">
            {columns.map((col) => (
              <th
                key={String(col.key)}
                className={`px-3 sm:px-4 py-3.5 text-left text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/70 font-label transition-colors duration-150 ${col.sortable ? 'cursor-pointer hover:text-on-surface select-none' : ''} ${col.width ?? ''} ${col.mobileHide ? 'hidden sm:table-cell' : ''}`}
                onClick={() => col.sortable && handleSort(String(col.key))}
              >
                <div className="flex items-center gap-1">
                  {col.label}
                  {col.sortable && (
                    sortKey === String(col.key)
                      ? sortDir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                      : <ChevronsUpDown className="w-3 h-3 opacity-40" />
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading && Array.from({ length: 5 }).map((_, i) => (
            <tr key={i} className="border-b border-outline-variant/10 animate-pulse">
              {columns.map((col) => (
                <td key={String(col.key)} className={`px-3 sm:px-4 py-3 ${col.mobileHide ? 'hidden sm:table-cell' : ''}`}>
                  <div className="h-4 bg-surface-container rounded w-3/4" />
                </td>
              ))}
            </tr>
          ))}

          {!loading && sorted.length === 0 && (
            <tr>
              <td colSpan={columns.length} className="px-4 py-12 text-center text-on-surface-variant font-body text-sm">
                {emptyMessage}
              </td>
            </tr>
          )}

          {!loading && sorted.map((row) => (
            <tr
              key={String(row[keyField])}
              className={`border-b border-outline-variant/10 last:border-0 hover:bg-surface-container-low/70 transition-colors duration-150 ${onRowClick ? 'cursor-pointer active:bg-surface-container' : ''}`}
              onClick={() => onRowClick?.(row)}
            >
              {columns.map((col) => (
                <td key={String(col.key)} className={`px-3 sm:px-4 py-3 text-on-surface font-body ${col.mobileHide ? 'hidden sm:table-cell' : ''}`}>
                  {col.render ? col.render(row) : String(row[String(col.key) as keyof T] ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
