import React, { useState } from 'react'
import ProviderLogo from '../components/ProviderLogo.js'

const PROVIDERS = [
  { id: 'anthropic', name: 'Anthropic (Claude)', placeholder: 'sk-ant-...' },
  { id: 'openai', name: 'OpenAI (ChatGPT)', placeholder: 'sk-...' },
  { id: 'google', name: 'Google (Gemini)', placeholder: 'AIza...' },
  { id: 'cohere', name: 'Cohere', placeholder: '' },
  { id: 'mistral', name: 'Mistral', placeholder: '' },
  { id: 'groq', name: 'Groq', placeholder: 'gsk_...' },
  { id: 'perplexity', name: 'Perplexity', placeholder: 'pplx-...' },
  { id: 'deepseek', name: 'DeepSeek', placeholder: 'sk-...' },
]

export default function AddKey({ onBack }: { onBack: () => void }) {
  const [provider, setProvider] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [label, setLabel] = useState('')
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const selectedProvider = PROVIDERS.find((p) => p.id === provider)

  const handleSave = async () => {
    if (!provider || !apiKey.trim()) {
      setError('Please select a provider and enter your API key')
      return
    }

    setSaving(true)
    setError('')

    try {
      await window.walletAPI.addKey(provider, apiKey.trim(), label.trim() || undefined)
      setSuccess(true)
      setTimeout(() => onBack(), 1200)
    } catch (err: any) {
      setError(err.message || 'Failed to save key')
    } finally {
      setSaving(false)
    }
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
          <span className="text-4xl">✓</span>
        </div>
        <h2 className="text-lg font-bold text-green-600 dark:text-green-400">Key Saved!</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Your {selectedProvider?.name} key is now securely stored.
        </p>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <button
          onClick={onBack}
          className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
        >
          ← Back
        </button>
        <h1 className="text-xl font-bold">Add API Key</h1>
      </div>

      {/* Provider selection */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Provider</label>
        <div className="grid grid-cols-2 gap-2">
          {PROVIDERS.map((p) => (
            <button
              key={p.id}
              onClick={() => setProvider(p.id)}
              className={`flex items-center gap-2 p-3 rounded-xl border text-left text-sm transition-all ${
                provider === p.id
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <ProviderLogo provider={p.id} size="sm" />
              <span className="truncate">{p.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* API Key input */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">API Key</label>
        <input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder={selectedProvider?.placeholder || 'Paste your API key here'}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Label (optional) */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">
          Label <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <input
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="e.g., Personal, Work, OpenClaw"
          className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-xl">
          {error}
        </div>
      )}

      <button
        onClick={handleSave}
        disabled={saving || !provider || !apiKey.trim()}
        className="w-full py-3 text-sm font-medium bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {saving ? 'Saving...' : 'Save Key Securely'}
      </button>

      <p className="text-xs text-gray-400 text-center mt-3">
        Encrypted with AES-256-GCM. Stored in macOS Keychain.
      </p>
    </div>
  )
}
