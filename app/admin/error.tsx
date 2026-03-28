'use client'

export default function AdminError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-admin px-4">
      <div className="text-center max-w-md">
        <h1 className="font-headline text-3xl font-bold text-on-surface mb-4">Something went wrong</h1>
        <p className="text-on-surface-variant font-body mb-6">
          {error.message || 'An error occurred in the admin panel.'}
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="admin-btn-primary"
          >
            Try Again
          </button>
          <a href="/admin" className="admin-btn-secondary">
            Back to Dashboard
          </a>
        </div>
      </div>
    </div>
  )
}
