export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="text-center max-w-md">
        <h1 className="font-headline text-6xl font-bold text-primary mb-4">404</h1>
        <p className="text-on-surface-variant font-body mb-6">The page you are looking for does not exist.</p>
        <a
          href="/"
          className="px-8 py-3 bg-primary text-white font-label font-semibold rounded-lg hover:bg-primary-container transition-all inline-block"
        >
          Back to Shop
        </a>
      </div>
    </div>
  )
}
