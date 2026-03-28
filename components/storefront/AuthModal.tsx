'use client'

import { useState } from 'react'
import { X, Mail, Lock, User, Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'

type Mode = 'login' | 'signup' | 'forgot'

interface AuthModalProps {
  open: boolean
  onClose: () => void
}

export function AuthModal({ open, onClose }: AuthModalProps) {
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  if (!open) return null

  const reset = () => {
    setError(null)
    setSuccess(null)
    setEmail('')
    setPassword('')
    setFullName('')
    setShowPassword(false)
    setLoading(false)
  }

  const switchMode = (m: Mode) => {
    reset()
    setMode(m)
  }

  const handleClose = () => {
    reset()
    setMode('login')
    onClose()
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) { setError(error.message); return }
    handleClose()
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    })
    setLoading(false)
    if (error) { setError(error.message); return }
    setSuccess('Check your email for a confirmation link!')
  }

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    setLoading(false)
    if (error) { setError(error.message); return }
    setSuccess('Password reset link sent to your email.')
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4"
      onClick={handleClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-on-background/30 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative w-full max-w-md bg-background rounded-2xl shadow-2xl border border-outline-variant/20 overflow-hidden animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Decorative top bar */}
        <div className="h-1 w-full bg-gradient-to-r from-primary via-primary-container to-primary-fixed-dim" />

        <div className="p-8">
          {/* Header */}
          <div className="flex items-start justify-between mb-8">
            <div>
              <h2 className="font-headline font-bold text-2xl text-on-surface tracking-tight">
                {mode === 'login' && 'Welcome back'}
                {mode === 'signup' && 'Create account'}
                {mode === 'forgot' && 'Reset password'}
              </h2>
              <p className="text-on-surface-variant text-sm mt-1 font-body">
                {mode === 'login' && 'Sign in to your Swift Shop account'}
                {mode === 'signup' && 'Join thousands of happy customers'}
                {mode === 'forgot' && "We'll send a reset link to your email"}
              </p>
            </div>
            <button
              onClick={handleClose}
              className="text-on-surface-variant hover:text-on-surface transition-colors p-1 rounded-lg hover:bg-surface-container"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Success state */}
          {success ? (
            <div className="text-center py-6">
              <div className="w-14 h-14 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-on-surface font-semibold font-label">{success}</p>
              <button
                onClick={() => switchMode('login')}
                className="mt-6 text-primary text-sm font-label font-medium hover:underline"
              >
                Back to login
              </button>
            </div>
          ) : (
            <>
              {/* Error */}
              {error && (
                <div className="mb-5 px-4 py-3 bg-error-container/30 border border-error/20 rounded-xl text-sm text-on-error-container font-body">
                  {error}
                </div>
              )}

              {/* Login Form */}
              {mode === 'login' && (
                <form onSubmit={handleLogin} className="space-y-4">
                  <Field label="Email address" icon={<Mail className="w-4 h-4" />}>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                      className="auth-input"
                    />
                  </Field>
                  <Field
                    label="Password"
                    icon={<Lock className="w-4 h-4" />}
                    trailing={
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-on-surface-variant hover:text-on-surface transition-colors">
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    }
                  >
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Your password"
                      required
                      className="auth-input"
                    />
                  </Field>
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => switchMode('forgot')}
                      className="text-xs text-primary hover:underline font-label"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <AuthButton loading={loading}>Sign In</AuthButton>
                </form>
              )}

              {/* Signup Form */}
              {mode === 'signup' && (
                <form onSubmit={handleSignup} className="space-y-4">
                  <Field label="Full name" icon={<User className="w-4 h-4" />}>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Your full name"
                      required
                      className="auth-input"
                    />
                  </Field>
                  <Field label="Email address" icon={<Mail className="w-4 h-4" />}>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                      className="auth-input"
                    />
                  </Field>
                  <Field
                    label="Password"
                    icon={<Lock className="w-4 h-4" />}
                    trailing={
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-on-surface-variant hover:text-on-surface transition-colors">
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    }
                  >
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min. 6 characters"
                      required
                      minLength={6}
                      className="auth-input"
                    />
                  </Field>
                  <AuthButton loading={loading}>Create Account</AuthButton>
                </form>
              )}

              {/* Forgot Password Form */}
              {mode === 'forgot' && (
                <form onSubmit={handleForgot} className="space-y-4">
                  <Field label="Email address" icon={<Mail className="w-4 h-4" />}>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                      className="auth-input"
                    />
                  </Field>
                  <AuthButton loading={loading}>Send Reset Link</AuthButton>
                </form>
              )}

              {/* Mode switcher */}
              <div className="mt-6 text-center text-sm text-on-surface-variant font-body">
                {mode === 'login' ? (
                  <>
                    Don&apos;t have an account?{' '}
                    <button onClick={() => switchMode('signup')} className="text-primary font-semibold hover:underline">
                      Sign up
                    </button>
                  </>
                ) : mode === 'signup' ? (
                  <>
                    Already have an account?{' '}
                    <button onClick={() => switchMode('login')} className="text-primary font-semibold hover:underline">
                      Sign in
                    </button>
                  </>
                ) : (
                  <button onClick={() => switchMode('login')} className="text-primary font-semibold hover:underline">
                    Back to login
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function Field({
  label,
  icon,
  trailing,
  children,
}: {
  label: string
  icon: React.ReactNode
  trailing?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-xs font-label font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">
        {label}
      </label>
      <div className="flex items-center gap-2.5 bg-surface-container rounded-xl px-3.5 py-3 border border-outline-variant/30 focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/20 transition-all">
        <span className="text-on-surface-variant shrink-0">{icon}</span>
        <div className="flex-1">{children}</div>
        {trailing && <span className="shrink-0">{trailing}</span>}
      </div>
    </div>
  )
}

function AuthButton({ loading, children }: { loading: boolean; children: React.ReactNode }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="w-full mt-2 bg-primary hover:bg-primary-container disabled:opacity-60 text-white py-3.5 rounded-xl font-label font-semibold text-sm transition-all duration-200 active:scale-[0.98] shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <>
          {children}
          <ArrowRight className="w-4 h-4" />
        </>
      )}
    </button>
  )
}
