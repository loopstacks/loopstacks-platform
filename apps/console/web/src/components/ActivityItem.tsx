interface ActivityItemProps {
  type: 'success' | 'info' | 'warning' | 'error'
  title: string
  description: string
  timestamp: string
}

export function ActivityItem({ type, title, description, timestamp }: ActivityItemProps) {
  const getStatusColor = () => {
    switch (type) {
      case 'success':
        return 'bg-success-500'
      case 'info':
        return 'bg-primary-500'
      case 'warning':
        return 'bg-warning-500'
      case 'error':
        return 'bg-error-500'
      default:
        return 'bg-gray-500'
    }
  }

  return (
    <div className="flex items-start space-x-3">
      <div className={`w-2 h-2 ${getStatusColor()} rounded-full mt-2 flex-shrink-0`} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{title}</p>
        <p className="text-xs text-gray-500 truncate">{description}</p>
        <p className="text-xs text-gray-400">{timestamp}</p>
      </div>
    </div>
  )
}