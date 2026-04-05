import { detectKey, extractKey, type KeyPattern } from '../lib/patterns.js'

const LOG = '[AI Wallet]'

let toastElement: HTMLElement | null = null
const detectedKeys = new Set<string>()

function createToast(displayName: string, keyPreview: string): HTMLElement {
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

function removeToast() {
  if (toastElement) {
    toastElement.classList.add('ai-wallet-toast-exit')
    const el = toastElement
    toastElement = null
    setTimeout(() => el.remove(), 200)
  }
}

function showToast(pattern: KeyPattern, fullKey: string) {
  if (detectedKeys.has(fullKey)) return
  detectedKeys.add(fullKey)

  console.log(LOG, `Detected ${pattern.displayName} key: ${fullKey.slice(0, 12)}...`)

  removeToast()

  const keyPreview =
    fullKey.length > 12 ? fullKey.slice(0, 8) + '...' + fullKey.slice(-4) : fullKey

  toastElement = createToast(pattern.displayName, keyPreview)
  document.body.appendChild(toastElement)

  const saveBtn = toastElement.querySelector('#ai-wallet-save')
  saveBtn?.addEventListener('click', () => {
    const actionsEl = toastElement?.querySelector('#ai-wallet-actions')
    if (actionsEl) {
      actionsEl.innerHTML = '<div class="ai-wallet-toast-body">Saving...</div>'
    }

    chrome.runtime.sendMessage(
      { type: 'SAVE_KEY', provider: pattern.provider, key: fullKey },
      (response) => {
        if (!actionsEl) return
        if (response?.success) {
          actionsEl.innerHTML =
            '<div class="ai-wallet-toast-success">Saved to AI Wallet</div>'
          setTimeout(removeToast, 2000)
        } else {
          // Safe: use textContent to avoid XSS from daemon error messages
          const errDiv = document.createElement('div')
          errDiv.className = 'ai-wallet-toast-error'
          errDiv.textContent = response?.error || 'Failed to save'
          actionsEl.replaceChildren(errDiv)
          setTimeout(removeToast, 4000)
        }
      },
    )
  })

  toastElement.querySelector('#ai-wallet-dismiss')?.addEventListener('click', removeToast)
  setTimeout(removeToast, 30000)
}

// --- Detection helpers ---

function checkText(text: string) {
  if (!text || text.length < 20) return
  const pattern = detectKey(text)
  if (!pattern) return
  const key = extractKey(text, pattern)
  if (key) showToast(pattern, key)
}

function scanElement(el: Element) {
  // Text nodes
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
  let node: Node | null
  while ((node = walker.nextNode())) {
    checkText(node.textContent || '')
  }

  // Input/textarea .value (React sets this as a JS property, invisible to tree walker)
  el.querySelectorAll<HTMLInputElement>('input, textarea').forEach((input) => {
    checkText(input.value)
  })

  // Code/pre blocks and common key containers
  el.querySelectorAll('code, pre, [data-testid]').forEach((el) => {
    checkText(el.textContent || '')
  })
}

function fullScan() {
  // Walk all text nodes
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
  let node: Node | null
  while ((node = walker.nextNode())) {
    checkText(node.textContent || '')
  }

  // All inputs
  document.querySelectorAll<HTMLInputElement>('input, textarea').forEach((el) => {
    checkText(el.value)
  })

  // Common key display containers
  document.querySelectorAll(
    'code, pre, [role="textbox"], [data-testid], [class*="key"], [class*="token"], [class*="secret"], [class*="api"], [class*="credential"]',
  ).forEach((el) => {
    checkText(el.textContent || '')
  })
}

// --- Start detection ---

console.log(LOG, 'Loaded on', window.location.hostname)

// Initial scan
fullScan()

// Aggressive scanning for the first 30s (keys in modals appear briefly)
// then slow down to reduce CPU usage
let scanCount = 0
const fastScanId = setInterval(() => {
  fullScan()
  scanCount++
  if (scanCount >= 60) {
    // After 30s of fast scanning, switch to slow
    clearInterval(fastScanId)
    setInterval(fullScan, 3000)
  }
}, 500)

// MutationObserver for new DOM nodes (modals, revealed keys)
const observer = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    for (const node of mutation.addedNodes) {
      if (node instanceof Element) {
        scanElement(node)
      } else if (node.nodeType === Node.TEXT_NODE) {
        checkText(node.textContent || '')
      }
    }
    if (mutation.type === 'characterData') {
      checkText(mutation.target.textContent || '')
    }
  }
})

observer.observe(document.body, {
  childList: true,
  subtree: true,
  characterData: true,
})

// --- Clipboard interception ---
// Provider dashboards use navigator.clipboard.writeText() when you click "Copy".
// This does NOT fire a DOM 'copy' event, so we intercept the API directly.

const origWriteText = navigator.clipboard.writeText.bind(navigator.clipboard)
navigator.clipboard.writeText = async function (text: string) {
  console.log(LOG, 'Clipboard write intercepted, length:', text.length)
  checkText(text)
  return origWriteText(text)
}

// Fallback: selection-based copy (Ctrl+C / Cmd+C)
document.addEventListener('copy', () => {
  setTimeout(() => {
    const sel = document.getSelection()?.toString() || ''
    checkText(sel)
  }, 50)
})

// Catch clicks on copy-looking buttons, then re-scan their parent container
document.addEventListener(
  'click',
  (e) => {
    const target = e.target as HTMLElement
    if (!target) return

    const btn = target.closest('button, [role="button"], [data-copy], [class*="copy"]')
    if (!btn) return

    // Re-scan the nearby container after a short delay
    setTimeout(() => {
      const container = btn.closest('[class*="modal"], [class*="dialog"], [role="dialog"]')
        || btn.parentElement?.parentElement
        || btn.parentElement
      if (container instanceof Element) {
        scanElement(container)
      }
    }, 200)
  },
  true,
)
