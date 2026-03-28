'use client'

import { useState, useEffect } from 'react'
import { Lock } from 'lucide-react'

const ADMIN_ID  = process.env.NEXT_PUBLIC_ADMIN_ID  ?? 'admin'
const ADMIN_PWD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD ?? 'swiftshop2024'
const SESSION_KEY = 'ss_admin_auth'

interface Props {
  onAuth: () => void
}

export function AdminLogin({ onAuth }: Props) {
  const [id,  setId]  = useState('')
  const [pwd, setPwd] = useState('')
  const [err, setErr] = useState(false)

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (id.trim() === ADMIN_ID && pwd === ADMIN_PWD) {
      sessionStorage.setItem(SESSION_KEY, '1')
      onAuth()
    } else {
      setErr(true)
      setPwd('')
    }
  }

  return (
    <div className="min-h-screen bg-admin flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-lift p-10">
        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 mb-8 mx-auto">
          <Lock className="w-5 h-5 text-primary" strokeWidth={1.5} />
        </div>
        <h1 className="font-headline text-2xl font-bold text-on-surface text-center mb-1">Admin Access</h1>
        <p className="text-on-surface-variant text-sm text-center mb-8 font-body">SwiftShop control panel</p>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="admin-label">Admin ID</label>
            <input
              className="admin-input"
              type="text"
              autoComplete="username"
              value={id}
              onChange={(e) => { setId(e.target.value); setErr(false) }}
              placeholder="Enter your ID"
            />
          </div>
          <div>
            <label className="admin-label">Password</label>
            <input
              className="admin-input"
              type="password"
              autoComplete="current-password"
              value={pwd}
              onChange={(e) => { setPwd(e.target.value); setErr(false) }}
              placeholder="Enter your password"
            />
          </div>

          {err && (
            <p className="text-error text-sm font-body">Invalid credentials. Please try again.</p>
          )}

          <button type="submit" className="admin-btn-primary w-full mt-2">
            Sign In
          </button>
        </form>
      </div>
    </div>
  )
}

export function useAdminAuth() {
  const [authed, setAuthed] = useState<boolean | null>(null)

  useEffect(() => {
    setAuthed(sessionStorage.getItem(SESSION_KEY) === '1')
  }, [])

  return { authed, setAuthed }
}
