import React, { useEffect, useState, useCallback } from 'react'

interface AuthorizedApp {
  id: string
  name: string
  approvedAt: string
  permissions: string[]
}

export default function AuthorizedApps() {
  const [apps, setApps] = useState<AuthorizedApp[]>([])

  const loadApps = useCallback(async () => {
    const result = await window.walletAPI.listApps()
    setApps(result)
  }, [])

  useEffect(() => {
    loadApps()
  }, [loadApps])

  const handleRevoke = async (id: string) => {
    await window.walletAPI.removeApp(id)
    loadApps()
  }

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">Connected Apps</h1>

      {apps.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
            <span className="text-4xl">📱</span>
          </div>
          <h2 className="text-lg font-semibold mb-1">No Connected Apps</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs">
            When apps like OpenClaw or Claude Code request access to your keys, they'll appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {apps.map((app) => (
            <div
              key={app.id}
              className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-sm">{app.name}</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Connected {new Date(app.approvedAt).toLocaleDateString()}
                  </p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {app.permissions.map((p) => (
                      <span
                        key={p}
                        className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded-full capitalize"
                      >
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => handleRevoke(app.id)}
                  className="text-xs px-3 py-1.5 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  Revoke
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
