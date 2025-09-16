import type { RealmStatus } from '../types'

interface RealmCardProps extends RealmStatus {}

export function RealmCard({ name, status, agents, loops, cpu, type, protocol, latency }: RealmCardProps) {
  const getStatusColor = () => {
    switch (status) {
      case 'healthy':
        return 'bg-success-500'
      case 'warning':
        return 'bg-warning-500'
      case 'error':
        return 'bg-error-500'
      default:
        return 'bg-gray-500'
    }
  }

  return (
    <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-medium truncate">{name}</h4>
        <span className={`w-2 h-2 ${getStatusColor()} rounded-full flex-shrink-0`} />
      </div>
      <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
        {type !== 'edge' ? (
          <>
            <div>Agents: {agents}</div>
            <div>Loops: {loops}</div>
            <div>CPU: {cpu}%</div>
          </>
        ) : (
          <>
            <div>Type: Edge</div>
            {protocol && <div>Protocol: {protocol}</div>}
            {latency && <div>Latency: {latency}</div>}
          </>
        )}
      </div>
    </div>
  )
}