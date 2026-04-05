import React, { useState } from 'react'
import ProviderLogo from './ProviderLogo.js'
import MaskedKey from './MaskedKey.js'

interface KeyCardProps {
  id: string
  provider: string
  label: string
  keyPrefix: string
  createdAt: string
  lastUsedAt: string | null
  onDelete: (id: string) => void
}

export default function KeyCard({
  id,
  provider,
  label,
  keyPrefix,
  createdAt,
  lastUsedAt,
  onDelete,
}: KeyCardProps) {
  const [confirming, setConfirming] = useState(false)

  const timeAgo = lastUsedAt
    ? formatTimeAgo(new Date(lastUsedAt))
    : 'Never used'

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3">
        <ProviderLogo provider={provider} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm capitalize truncate">{provider}</h3>
            {confirming ? (
              <div className="flex gap-1">
                <button
                  onClick={() => { onDelete(id); setConfirming(false) }}
                  className="text-xs px-2 py-0.5 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                >
                  Remove
                </button>
                <button
                  onClick={() => setConfirming(false)}
                  className="text-xs px-2 py-0.5 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirming(true)}
                className="text-gray-400 hover:text-red-500 transition-colors text-sm"
                title="Remove key"
              >
                ✕
              </button>
            )}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{label}</p>
          <div className="flex items-center gap-2 mt-2">
            <MaskedKey keyPrefix={keyPrefix} />
            <span className="text-xs text-gray-400">{timeAgo}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
  if (seconds < 60) return 'Just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  return `${Math.floor(seconds / 86400)}d ago`
}
