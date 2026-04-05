import { KEY_PATTERNS, detectKey, extractKey, type KeyPattern } from '../lib/patterns.js'

const LOG_PREFIX = '[AI Wallet]'

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

  console.log(LOG_PREFIX, `Detected ${pattern.displayName} key: ${fullKey.slice(0, 12)}...`)

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

function checkText(text: string) {
  if (!text || text.length < 20) return
  const pattern = detectKey(text)
  if (pattern) {
    const key = extractKey(text, pattern)
    if (key) {
      showToast(pattern, key)
    }
  }
}

function scanTextNode(node: Node) {
  checkText(node.textContent || '')
}

function scanElement(element: Element) {
  // Check text content of the element and its children
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT)
  let node: Node | null
  while ((node = walker.nextNode())) {
    scanTextNode(node)
  }

  // Also check input/textarea values and element attributes
  const inputs = element.querySelectorAll('input, textarea, code, pre, [data-testid]')
  inputs.forEach((input) => {
    checkText((input as HTMLInputElement).value || input.textContent || '')
  })
}

// Full page scan — checks text nodes, input values, and all element text content
function fullScan() {
  // 1. Walk all text nodes
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
  let node: Node | null
  while ((node = walker.nextNode())) {
    checkText(node.textContent || '')
  }

  // 2. Check input/textarea values (React sets .value as property, not visible as text node)
  document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>(
    'input, textarea',
  ).forEach((el) => {
    checkText(el.value)
  })

  // 3. Check common key display containers
  document.querySelectorAll(
    'code, pre, [role="textbox"], [data-testid], [class*="key"], [class*="token"], [class*="secret"], [class*="api"], [class*="credential"]',
  ).forEach((el) => {
    checkText(el.textContent || '')
    // Also check data attributes that might hold key values
    for (const attr of el.attributes) {
      if (attr.name.startsWith('data-') && attr.value.length >= 20) {
        checkText(attr.value)
      }
    }
  })
}

console.log(LOG_PREFIX, 'Content script loaded on', window.location.hostname)

// Initial scan
fullScan()

// Periodic re-scan: catches React state changes, dynamically revealed keys, etc.
setInterval(fullScan, 2000)

// Watch for DOM mutations (new elements appearing, e.g., key reveal modals)
const observer = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    for (const node of mutation.addedNodes) {
      if (node instanceof Element) {
        scanElement(node)
      } else if (node.nodeType === Node.TEXT_NODE) {
        scanTextNode(node)
      }
    }

    if (mutation.type === 'characterData' && mutation.target.textContent) {
      scanTextNode(mutation.target)
    }
  }
})

observer.observe(document.body, {
  childList: true,
  subtree: true,
  characterData: true,
})

// Intercept clipboard writes — catches "Copy" buttons that use navigator.clipboard.writeText()
// This is the primary way provider dashboards let users copy keys
const originalWriteText = navigator.clipboard.writeText.bind(navigator.clipboard)
navigator.clipboard.writeText = async function (text: string) {
  console.log(LOG_PREFIX, 'Clipboard write intercepted, length:', text.length)
  checkText(text)
  return originalWriteText(text)
}

// Also intercept the older execCommand('copy') path
document.addEventListener('copy', () => {
  setTimeout(() => {
    const selection = document.getSelection()?.toString() || ''
    checkText(selection)
  }, 50)
})

// Intercept click events on buttons that look like copy buttons
// This catches cases where the key is in a nearby sibling element
document.addEventListener('click', (e) => {
  const target = e.target as HTMLElement
  if (!target) return

  const btn = target.closest('button, [role="button"], [data-copy], [class*="copy"]')
  if (!btn) return

  // After click, scan nearby elements for keys
  setTimeout(() => {
    const parent = btn.parentElement?.parentElement || btn.parentElement
    if (parent) {
      scanElement(parent)
    }
    // Also re-check clipboard after a copy button click
    navigator.clipboard.readText().then(checkText).catch(() => {})
  }, 200)
}, true)
