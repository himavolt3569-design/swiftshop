import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface StatCardProps {
  label: string
  value: string | number
  trend?: number
  icon?: React.ReactNode
  accent?: boolean
}

export function StatCard({ label, value, trend, icon, accent }: StatCardProps) {
  const trendPositive = trend !== undefined && trend > 0
  const trendNegative = trend !== undefined && trend < 0

  return (
    <div className={`bg-surface-container-lowest p-8 rounded-lg shadow-ambient hover:shadow-float transition-shadow ${accent ? 'border-b-4 border-primary-container' : ''}`}>
      <div className="flex justify-between items-start mb-4">
        {icon && (
          <div className="p-2 bg-surface-container rounded-lg text-primary">
            {icon}
          </div>
        )}
        {trend !== undefined && (
          <span className={`text-[10px] font-bold tracking-widest uppercase flex items-center gap-1 ml-auto ${
            trendPositive ? 'text-success' : trendNegative ? 'text-error' : 'text-on-surface-variant'
          }`}>
            {trendPositive ? <TrendingUp className="w-3 h-3" /> : trendNegative ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
            {Math.abs(trend ?? 0)}%
          </span>
        )}
      </div>
      <p className="font-headline text-4xl font-bold text-on-surface mb-1">{value}</p>
      <p className="text-[10px] uppercase tracking-widest font-bold text-on-surface-variant font-label">{label}</p>
    </div>
  )
}
