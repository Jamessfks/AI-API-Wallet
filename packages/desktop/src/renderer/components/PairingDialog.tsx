import React from 'react'

interface PairingDialogProps {
  appName: string
  permissions: string[]
  onApprove: () => void
  onDeny: () => void
}

export default function PairingDialog({ appName, permissions, onApprove, onDeny }: PairingDialogProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl max-w-sm w-full p-6">
        <div className="text-center mb-4">
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
            <span className="text-3xl">🔗</span>
          </div>
          <h2 className="text-lg font-bold">Connection Request</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            <span className="font-semibold text-gray-700 dark:text-gray-300">{appName}</span> wants
            to access your API keys
          </p>
        </div>

        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 mb-4">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
            Requested access:
          </p>
          <div className="flex flex-wrap gap-1">
            {permissions.map((p) => (
              <span
                key={p}
                className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full capitalize"
              >
                {p}
              </span>
            ))}
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onDeny}
            className="flex-1 py-2.5 text-sm font-medium rounded-xl border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Deny
          </button>
          <button
            onClick={onApprove}
            className="flex-1 py-2.5 text-sm font-medium rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            Allow
          </button>
        </div>
      </div>
    </div>
  )
}
