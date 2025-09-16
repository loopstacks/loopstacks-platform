import { ComponentType } from 'react'

export interface NavItem {
  id: string
  label: string
  icon: ComponentType<{ className?: string }>
  href?: string
}

export interface MetricData {
  label: string
  value: string | number
  change?: string
  changeType?: 'positive' | 'negative' | 'neutral'
  icon: ComponentType<{ className?: string }>
  color: 'primary' | 'success' | 'warning' | 'error'
}

export interface ActivityItem {
  id: string
  type: 'success' | 'info' | 'warning' | 'error'
  title: string
  description: string
  timestamp: string
}

export interface RealmStatus {
  id: string
  name: string
  status: 'healthy' | 'warning' | 'error'
  agents: number
  loops: number
  cpu: number
  type?: 'standard' | 'edge'
  protocol?: string
  latency?: string
}