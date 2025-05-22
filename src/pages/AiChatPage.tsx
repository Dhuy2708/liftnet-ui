import { useState } from "react"
import AnatomyViewer from "@/components/ui/anatomy/anatomy-viewer"

const sidebarTabs = [
  { id: 'statistic', label: 'Statistic Knowledge' },
  { id: 'planning', label: 'Planning' },
  { id: 'ai-chat', label: 'AI Chat (Full Screen)' },
]

export default function AiChatPage() {
  const [activeTab, setActiveTab] = useState('statistic')
  return (
    <main className="flex min-h-screen bg-[#f9fafb]">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r flex flex-col py-8 px-4">
        <h2 className="text-lg font-bold text-gray-900 mb-6">Fitness Explorer</h2>
        <nav className="space-y-2">
          {sidebarTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeTab === tab.id
                  ? 'bg-[#de9151] text-white'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </aside>
      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-between p-4 md:p-8">
        <div className="w-full max-w-7xl">
          <h1 className="text-3xl font-bold mb-6 text-center" style={{ color: "#de9151" }}>
            Interactive Fitness Explorer
          </h1>
          <p className="text-center mb-8" style={{ color: "#737373" }}>
            Explore muscle groups, track body metrics, and discover workout splits
          </p>
          <AnatomyViewer activeTab={activeTab} />
        </div>
      </div>
    </main>
  )
}
