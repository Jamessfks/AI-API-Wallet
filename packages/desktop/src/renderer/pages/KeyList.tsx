import React, { useEffect, useState, useCallback } from 'react'
import KeyCard from '../components/KeyCard.js'
import PairingDialog from '../components/PairingDialog.js'

interface KeyEntry {
  id: string
  provider: string
  label: string
  keyPrefix: string
  createdAt: string
  lastUsedAt: string | null
}

interface PairingRequest {
  id: string
  appName: string
  permissions: string[]
}

export default function KeyList({ onAddKey }: { onAddKey: () => void }) {
  const [keys, setKeys] = useState<KeyEntry[]>([])
  const [pairingRequest, setPairingRequest] = useState<PairingRequest | null>(null)

  const loadKeys = useCallback(async () => {
    const result = await window.walletAPI.listKeys()
    setKeys(result)
  }, [])

  const pollPairings = useCallback(async () => {
    const pending = await window.walletAPI.getPendingPairings()
    if (pending.length > 0) {
      setPairingRequest(pending[0])
    }
  }, [])

  useEffect(() => {
    loadKeys()
    const keyInterval = setInterval(loadKeys, 2000)
    const pairInterval = setInterval(pollPairings, 1000)
    return () => {
      clearInterval(keyInterval)
      clearInterval(pairInterval)
    }
  }, [loadKeys, pollPairings])

  const handleDelete = async (id: string) => {
    await window.walletAPI.removeKey(id)
    loadKeys()
  }

  const handleApprovePairing = async () => {
    if (pairingRequest) {
      await window.walletAPI.approvePairing(pairingRequest.id)
      setPairingRequest(null)
    }
  }

  const handleDenyPairing = async () => {
    if (pairingRequest) {
      await window.walletAPI.denyPairing(pairingRequest.id)
      setPairingRequest(null)
    }
  }

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">API Keys</h1>
        <button
          onClick={onAddKey}
          className="px-4 py-1.5 text-sm font-medium bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
        >
          + Add Key
        </button>
      </div>

      {keys.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
            <span className="text-4xl">🔐</span>
          </div>
          <h2 className="text-lg font-semibold mb-1">No API Keys Yet</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs">
            Add your first API key or install the browser extension to auto-capture keys from
            provider dashboards.
          </p>
          <button
            onClick={onAddKey}
            className="mt-4 px-6 py-2 text-sm font-medium bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
          >
            Add Your First Key
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {keys.map((key) => (
            <KeyCard key={key.id} {...key} onDelete={handleDelete} />
          ))}
        </div>
      )}

      {pairingRequest && (
        <PairingDialog
          appName={pairingRequest.appName}
          permissions={pairingRequest.permissions}
          onApprove={handleApprovePairing}
          onDeny={handleDenyPairing}
        />
      )}
    </>
  )
}
