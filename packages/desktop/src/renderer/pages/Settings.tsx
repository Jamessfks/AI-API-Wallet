import React, { useEffect, useState } from 'react'

export default function Settings() {
  const [port, setPort] = useState<number | null>(null)

  useEffect(() => {
    window.walletAPI.getDaemonPort().then(setPort)
  }, [])

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">Settings</h1>

      <div className="space-y-4">
        {/* Daemon status */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4">
          <h3 className="font-semibold text-sm mb-2">Daemon Status</h3>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${port ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {port ? `Running on port ${port}` : 'Not running'}
            </span>
          </div>
        </div>

        {/* Shell hook status */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4">
          <h3 className="font-semibold text-sm mb-2">Environment Variables</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
            Automatically set API keys as environment variables in every new terminal session.
          </p>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
            <code className="text-xs font-mono text-gray-600 dark:text-gray-400">
              # Add to ~/.zshrc:{'\n'}
              eval "$(ai-wallet-cli env)"
            </code>
          </div>
        </div>

        {/* Browser extension */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4">
          <h3 className="font-semibold text-sm mb-2">Browser Extension</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
            Auto-capture API keys from provider dashboards. No more copy-paste.
          </p>
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <span>Load the unpacked extension from:</span>
          </div>
          <code className="text-xs font-mono text-gray-500 dark:text-gray-500 mt-1 block">
            packages/browser-extension/dist/
          </code>
        </div>

        {/* About */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4">
          <h3 className="font-semibold text-sm mb-2">About</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            AI API Wallet v0.1.0
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Keys encrypted with AES-256-GCM. Master key stored in macOS Keychain.
          </p>
        </div>
      </div>
    </div>
  )
}
