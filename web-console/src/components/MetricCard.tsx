import { ComponentType } from 'react'

interface MetricCardProps {
  label: string
  value: string | number
  change?: string
  changeType?: 'positive' | 'negative' | 'neutral'
  icon: ComponentType<{ className?: string }>
  color: 'primary' | 'success' | 'warning' | 'error'
}

export function MetricCard({ label, value, change, changeType, icon: Icon, color }: MetricCardProps) {
  const getGradientClass = () => {
    switch (color) {
      case 'primary':
        return 'bg-gradient-primary'
      case 'success':
        return 'bg-gradient-success'
      case 'warning':
        return 'bg-gradient-warning'
      case 'error':
        return 'bg-gradient-error'
      default:
        return 'bg-gradient-primary'
    }
  }

  const getChangeColor = () => {
    switch (changeType) {
      case 'positive':
        return 'text-success-500'
      case 'negative':
        return 'text-error-500'
      case 'neutral':
      default:
        return 'text-gray-500'
    }
  }

  return (
    <div className="metric-card bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">{label}</p>
          <p className="text-3xl font-bold mt-1">{value}</p>
          {change && (
            <p className={`text-sm mt-1 ${getChangeColor()}`}>
              {changeType === 'positive' && '↗ '}
              {changeType === 'negative' && '↘ '}
              {change}
            </p>
          )}
        </div>
        <div className={`w-12 h-12 ${getGradientClass()} rounded-xl flex items-center justify-center`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  )
}