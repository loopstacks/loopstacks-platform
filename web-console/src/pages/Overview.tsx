import { Bot, RefreshCw, Server, Heart } from 'lucide-react'
import { MetricCard } from '../components/MetricCard'
import { ProgressBar } from '../components/ProgressBar'
import { ActivityItem } from '../components/ActivityItem'
import { RealmCard } from '../components/RealmCard'
import type { MetricData, ActivityItem as ActivityType, RealmStatus } from '../types'

const metricData: MetricData[] = [
  {
    label: 'Total Agents',
    value: 127,
    change: '+12 today',
    changeType: 'positive',
    icon: Bot,
    color: 'primary'
  },
  {
    label: 'Active Loops',
    value: 23,
    change: '2 pending',
    changeType: 'neutral',
    icon: RefreshCw,
    color: 'success'
  },
  {
    label: 'Connected Realms',
    value: 8,
    change: 'All healthy',
    changeType: 'positive',
    icon: Server,
    color: 'warning'
  },
  {
    label: 'System Health',
    value: '98.7%',
    change: 'Last 24h',
    changeType: 'neutral',
    icon: Heart,
    color: 'success'
  }
]

const activityData: ActivityType[] = [
  {
    id: '1',
    type: 'success',
    title: 'Agent scaled up',
    description: 'sentiment-analyzer: 8 → 12 instances',
    timestamp: '2 minutes ago'
  },
  {
    id: '2',
    type: 'info',
    title: 'Loop completed',
    description: 'food-craving-intent-analysis',
    timestamp: '5 minutes ago'
  },
  {
    id: '3',
    type: 'info',
    title: 'Bridge connected',
    description: 'ai-provider-openai via gRPC',
    timestamp: '12 minutes ago'
  }
]

const realmData: RealmStatus[] = [
  {
    id: '1',
    name: 'production-east',
    status: 'healthy',
    agents: 38,
    loops: 8,
    cpu: 45
  },
  {
    id: '2',
    name: 'production-west',
    status: 'warning',
    agents: 29,
    loops: 15,
    cpu: 89
  },
  {
    id: '3',
    name: 'ai-provider-openai',
    status: 'healthy',
    agents: 0,
    loops: 0,
    cpu: 0,
    type: 'edge',
    protocol: 'gRPC',
    latency: '45ms'
  }
]

export function Overview() {
  return (
    <div className="p-6">
      {/* Page Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold mb-2">Platform Overview</h2>
        <p className="text-gray-600 dark:text-gray-400">
          Monitor your LoopStacks deployment, agents, and workflows
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {metricData.map((metric, index) => (
          <MetricCard key={index} {...metric} />
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Resource Usage */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold mb-4">Resource Usage</h3>
          <div className="space-y-4">
            <ProgressBar label="CPU Usage" value={68} />
            <ProgressBar label="Memory Usage" value={52} />
            <ProgressBar label="Network I/O" value={23} />
          </div>
        </div>

        {/* Activity Timeline */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
          <div className="space-y-4">
            {activityData.map((activity) => (
              <ActivityItem key={activity.id} {...activity} />
            ))}
          </div>
        </div>
      </div>

      {/* Realm Status */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold mb-4">Realm Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {realmData.map((realm) => (
            <RealmCard key={realm.id} {...realm} />
          ))}
        </div>
      </div>
    </div>
  )
}