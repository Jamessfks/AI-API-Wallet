import { KEY_PATTERNS, detectKey, extractKey, type KeyPattern } from '../lib/patterns.js'

let toastElement: HTMLElement | null = null
let detectedKeys = new Set<string>()

function createToast(provider: string, displayName: string, keyPreview: string): HTMLElement {
  const toast = document.createElement('div')
  toast.className = 'ai-wallet-toast'
  toast.innerHTML = `
    <div class="ai-wallet-toast-header">
      <div class="ai-wallet-toast-icon">W</div>
      <div class="ai-wallet-toast-title">Save to AI Wallet?</div>
    </div>
    <div class="ai-wallet-toast-body">
      Detected a <strong>${displayName}</strong> API key:
      <span class="ai-wallet-toast-key">${keyPreview}</span>
    </div>
    <div class="ai-wallet-toast-actions" id="ai-wallet-actions">
      <button class="ai-wallet-toast-btn ai-wallet-toast-btn-secondary" id="ai-wallet-dismiss">
        Dismiss
      </button>
      <button class="ai-wallet-toast-btn ai-wallet-toast-btn-primary" id="ai-wallet-save">
        Save Key
      </button>
    </div>
  `
  return toast
}

function showToast(pattern: KeyPattern, fullKey: string) {
  // Don't show duplicate toasts
  if (detectedKeys.has(fullKey)) return
  detectedKeys.add(fullKey)

  // Remove existing toast
  removeToast()

  const keyPreview =
    fullKey.length > 12 ? fullKey.slice(0, 8) + '...' + fullKey.slice(-4) : fullKey

  toastElement = createToast(pattern.provider, pattern.displayName, keyPreview)
  document.body.appendChild(toastElement)

  // Save button
  const saveBtn = toastElement.querySelector('#ai-wallet-save')
  saveBtn?.addEventListener('click', async () => {
    const actionsEl = toastElement?.querySelector('#ai-wallet-actions')
    if (actionsEl) {
      actionsEl.innerHTML = '<div class="ai-wallet-toast-body">Saving...</div>'
    }

    // Send to background script → daemon
    chrome.runtime.sendMessage(
      { type: 'SAVE_KEY', provider: pattern.provider, key: fullKey },
      (response) => {
        if (response?.success) {
          if (actionsEl) {
            actionsEl.innerHTML =
              '<div class="ai-wallet-toast-success">Saved to AI Wallet</div>'
          }
          setTimeout(removeToast, 2000)
        } else {
          if (actionsEl) {
            actionsEl.innerHTML = `<div class="ai-wallet-toast-error">${response?.error || 'Failed to save'}</div>`
          }
          setTimeout(removeToast, 4000)
        }
      },
    )
  })

  // Dismiss button
  const dismissBtn = toastElement.querySelector('#ai-wallet-dismiss')
  dismissBtn?.addEventListener('click', removeToast)

  // Auto-dismiss after 30 seconds
  setTimeout(removeToast, 30000)
}

function removeToast() {
  if (toastElement) {
    toastElement.classList.add('ai-wallet-toast-exit')
    setTimeout(() => {
      toastElement?.remove()
      toastElement = null
    }, 200)
  }
}

function scanTextNode(node: Node) {
  const text = node.textContent || ''
  if (text.length < 20) return

  const pattern = detectKey(text)
  if (pattern) {
    const key = extractKey(text, pattern)
    if (key) {
      showToast(pattern, key)
    }
  }
}

function scanElement(element: Element) {
  // Check text content of the element and its children
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT)
  let node: Node | null
  while ((node = walker.nextNode())) {
    scanTextNode(node)
  }

  // Also check input/textarea values
  const inputs = element.querySelectorAll('input, textarea, code, pre, [data-testid]')
  inputs.forEach((input) => {
    const value = (input as HTMLInputElement).value || input.textContent || ''
    if (value.length >= 20) {
      const pattern = detectKey(value)
      if (pattern) {
        const key = extractKey(value, pattern)
        if (key) {
          showToast(pattern, key)
        }
      }
    }
  })
}

// Initial scan
scanElement(document.body)

// Watch for DOM mutations (new elements appearing, e.g., key reveal modals)
const observer = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    // Check added nodes
    for (const node of mutation.addedNodes) {
      if (node instanceof Element) {
        scanElement(node)
      } else if (node.nodeType === Node.TEXT_NODE) {
        scanTextNode(node)
      }
    }

    // Check attribute changes on inputs (value changes)
    if (mutation.type === 'attributes' && mutation.target instanceof HTMLInputElement) {
      const value = mutation.target.value
      if (value.length >= 20) {
        const pattern = detectKey(value)
        if (pattern) {
          const key = extractKey(value, pattern)
          if (key) {
            showToast(pattern, key)
          }
        }
      }
    }

    // Check characterData changes (text content updates)
    if (mutation.type === 'characterData' && mutation.target.textContent) {
      scanTextNode(mutation.target)
    }
  }
})

observer.observe(document.body, {
  childList: true,
  subtree: true,
  characterData: true,
  attributes: true,
  attributeFilter: ['value'],
})
