import React from 'react'

const PROVIDER_COLORS: Record<string, string> = {
  anthropic: 'bg-orange-500',
  openai: 'bg-emerald-600',
  google: 'bg-blue-500',
  cohere: 'bg-purple-600',
  mistral: 'bg-orange-600',
  groq: 'bg-indigo-600',
  perplexity: 'bg-teal-600',
  deepseek: 'bg-blue-700',
}

const PROVIDER_INITIALS: Record<string, string> = {
  anthropic: 'A',
  openai: 'O',
  google: 'G',
  cohere: 'C',
  mistral: 'M',
  groq: 'GQ',
  perplexity: 'P',
  deepseek: 'DS',
}

export default function ProviderLogo({ provider, size = 'md' }: { provider: string; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-lg',
  }

  return (
    <div
      className={`${sizeClasses[size]} ${PROVIDER_COLORS[provider] || 'bg-gray-500'} rounded-xl flex items-center justify-center text-white font-bold shadow-sm`}
    >
      {PROVIDER_INITIALS[provider] || provider.slice(0, 2).toUpperCase()}
    </div>
  )
}
