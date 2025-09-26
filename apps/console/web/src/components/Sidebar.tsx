import {
  BarChart3,
  Bot,
  Link,
  Monitor,
  RefreshCw,
  Server,
  Settings,
  LayoutDashboard
} from 'lucide-react'
import type { NavItem } from '../types/index'

interface SidebarProps {
  isOpen: boolean
  activeTab: string
  onTabChange: (tabId: string) => void
  onClose: () => void
}

const navItems: NavItem[] = [
  {
    id: 'overview',
    label: 'Overview',
    icon: LayoutDashboard
  },
  {
    id: 'realms',
    label: 'Realms',
    icon: Server
  },
  {
    id: 'agents',
    label: 'Agents',
    icon: Bot
  },
  {
    id: 'loops',
    label: 'Loops',
    icon: RefreshCw
  },
  {
    id: 'bridges',
    label: 'Bridges',
    icon: Link
  },
  {
    id: 'monitoring',
    label: 'Monitoring',
    icon: BarChart3
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: Settings
  }
]

export function Sidebar({ isOpen, activeTab, onTabChange, onClose }: SidebarProps) {
  const handleNavClick = (tabId: string) => {
    onTabChange(tabId)
    if (window.innerWidth < 1024) {
      onClose()
    }
  }

  return (
    <>
      {/* Mobile Overlay */}
      <div
        className={`fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Sidebar */}
      <aside
        className={`w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 sidebar-transition
          lg:translate-x-0 fixed lg:static inset-y-0 z-40 pt-16 lg:pt-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <nav className="p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <div
                key={item.id}
                className={`nav-item p-3 rounded-lg cursor-pointer ${
                  activeTab === item.id ? 'active' : ''
                }`}
                onClick={() => handleNavClick(item.id)}
              >
                <div className="flex items-center space-x-3">
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </div>
              </div>
            )
          })}
        </nav>
      </aside>
    </>
  )
}