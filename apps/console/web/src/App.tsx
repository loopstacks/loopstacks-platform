import { useState } from 'react'
import { Layout } from './components/Layout'
import { Overview } from './pages/Overview'
import { Realms } from './pages/Realms'
import { Agents } from './pages/Agents'
import { Loops } from './pages/Loops'
import { Bridges } from './pages/Bridges'
import { Monitoring } from './pages/Monitoring'
import { Settings } from './pages/Settings'

function App() {
  const [activeTab, setActiveTab] = useState('overview')

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <Overview />
      case 'realms':
        return <Realms />
      case 'agents':
        return <Agents />
      case 'loops':
        return <Loops />
      case 'bridges':
        return <Bridges />
      case 'monitoring':
        return <Monitoring />
      case 'settings':
        return <Settings />
      default:
        return <Overview />
    }
  }

  return (
    <Layout activeTab={activeTab} onTabChange={setActiveTab}>
      {renderContent()}
    </Layout>
  )
}

export default App
