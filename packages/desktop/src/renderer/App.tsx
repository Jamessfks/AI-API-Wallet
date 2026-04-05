import React, { useEffect, useState } from 'react'
import KeyList from './pages/KeyList.js'
import AddKey from './pages/AddKey.js'
import AuthorizedApps from './pages/AuthorizedApps.js'
import Settings from './pages/Settings.js'

type Page = 'keys' | 'add' | 'apps' | 'settings'

export default function App() {
  const [page, setPage] = useState<Page>('keys')
  const [isMac, setIsMac] = useState(true)

  useEffect(() => {
    window.walletAPI.getPlatform().then((p) => setIsMac(p === 'darwin'))
  }, [])

  return (
    <div className="flex flex-col h-screen">
      {/* Title bar drag area (macOS only — Windows uses native title bar) */}
      {isMac && <div className="titlebar h-8 flex-shrink-0" />}

      {/* Main content */}
      <div className="flex-1 overflow-auto px-4 pb-4">
        {page === 'keys' && <KeyList onAddKey={() => setPage('add')} />}
        {page === 'add' && <AddKey onBack={() => setPage('keys')} />}
        {page === 'apps' && <AuthorizedApps />}
        {page === 'settings' && <Settings />}
      </div>

      {/* Bottom navigation */}
      <nav className="flex-shrink-0 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
        <div className="flex">
          <NavButton active={page === 'keys'} onClick={() => setPage('keys')} label="Keys" icon="🔑" />
          <NavButton active={page === 'apps'} onClick={() => setPage('apps')} label="Apps" icon="📱" />
          <NavButton active={page === 'settings'} onClick={() => setPage('settings')} label="Settings" icon="⚙️" />
        </div>
      </nav>
    </div>
  )
}

function NavButton({
  active,
  onClick,
  label,
  icon,
}: {
  active: boolean
  onClick: () => void
  label: string
  icon: string
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex flex-col items-center py-2 text-xs transition-colors ${
        active
          ? 'text-blue-600 dark:text-blue-400'
          : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
      }`}
    >
      <span className="text-lg">{icon}</span>
      <span className="mt-0.5">{label}</span>
    </button>
  )
}
