import { useState } from 'react'
import { Header } from './Header'
import { Sidebar } from './Sidebar'

interface LayoutProps {
  children: React.ReactNode
  activeTab: string
  onTabChange: (tabId: string) => void
}

export function Layout({ children, activeTab, onTabChange }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen)
  const closeSidebar = () => setSidebarOpen(false)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <Header onToggleSidebar={toggleSidebar} />

      <div className="flex">
        <Sidebar
          isOpen={sidebarOpen}
          activeTab={activeTab}
          onTabChange={onTabChange}
          onClose={closeSidebar}
        />

        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}