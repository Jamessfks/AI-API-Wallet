async function init() {
  const statusDot = document.getElementById('status-dot')
  const statusText = document.getElementById('status-text')
  const keyCount = document.getElementById('key-count')
  const info = document.getElementById('info')

  // Check daemon health
  chrome.runtime.sendMessage({ type: 'CHECK_HEALTH' }, (response) => {
    if (response?.healthy) {
      statusDot.className = 'status-dot connected'
      statusText.textContent = 'Connected to AI Wallet'
      info.textContent =
        'API keys are automatically captured when you visit provider dashboards.'
    } else {
      statusDot.className = 'status-dot disconnected'
      statusText.textContent = 'Not connected'
      keyCount.textContent = '-'
      info.textContent = 'Open the AI API Wallet desktop app to connect.'
    }
  })
}

init()
