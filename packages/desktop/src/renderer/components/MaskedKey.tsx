import React from 'react'

export default function MaskedKey({ keyPrefix }: { keyPrefix: string }) {
  return (
    <code className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded font-mono">
      {keyPrefix}
    </code>
  )
}
