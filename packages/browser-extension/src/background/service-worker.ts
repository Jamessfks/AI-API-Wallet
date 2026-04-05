import { saveKeyToDaemon, checkDaemonHealth } from '../lib/daemon-client.js'

// Handle messages from content scripts
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'SAVE_KEY') {
    saveKeyToDaemon(message.provider, message.key, message.label).then((result) => {
      sendResponse(result)
    })
    return true // Keep message channel open for async response
  }

  if (message.type === 'CHECK_HEALTH') {
    checkDaemonHealth().then((healthy) => {
      sendResponse({ healthy })
    })
    return true
  }
})

// Check daemon health periodically and update badge
async function updateBadge() {
  const healthy = await checkDaemonHealth()
  if (healthy) {
    chrome.action.setBadgeBackgroundColor({ color: '#10b981' })
    chrome.action.setBadgeText({ text: '' })
  } else {
    chrome.action.setBadgeBackgroundColor({ color: '#ef4444' })
    chrome.action.setBadgeText({ text: '!' })
  }
}

// Check every 30 seconds
setInterval(updateBadge, 30000)

// Check on install/startup
chrome.runtime.onInstalled.addListener(updateBadge)
chrome.runtime.onStartup.addListener(updateBadge)
