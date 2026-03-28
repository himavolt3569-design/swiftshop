'use client'

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="text-center max-w-md">
        <h1 className="font-headline text-3xl font-bold text-on-surface mb-4">Something went wrong</h1>
        <p className="text-on-surface-variant font-body mb-6">
          {error.message || 'An unexpected error occurred. Please try again.'}
        </p>
        <button
          onClick={reset}
          className="px-8 py-3 bg-primary text-white font-label font-semibold rounded-lg hover:bg-primary-container transition-all active:scale-95"
        >
          Try Again
        </button>
      </div>
    </div>
  )
}
