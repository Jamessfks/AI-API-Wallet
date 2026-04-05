import { app, BrowserWindow, nativeTheme } from 'electron'
import path from 'node:path'
import { initSafeStorage } from './safe-storage.js'
import { startDaemon, stopDaemon } from './daemon-bridge.js'
import { setupTray } from './tray.js'
import { registerIpcHandlers } from './ipc-handlers.js'

let mainWindow: BrowserWindow | null = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 480,
    height: 680,
    minWidth: 400,
    minHeight: 500,
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    backgroundColor: nativeTheme.shouldUseDarkColors ? '#1a1a2e' : '#ffffff',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  // In dev, load from Vite dev server; in prod, load built HTML
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.whenReady().then(async () => {
  // Initialize encryption via OS secure storage (Keychain on macOS, DPAPI on Windows)
  initSafeStorage()

  // Start the daemon server
  await startDaemon()

  // Set up IPC handlers for renderer
  registerIpcHandlers()

  // Create main window
  createWindow()

  // Set up system tray
  setupTray(() => {
    if (mainWindow) {
      mainWindow.show()
      mainWindow.focus()
    } else {
      createWindow()
    }
  })

  // macOS: re-create window when dock icon clicked (this event only fires on macOS)
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  // On macOS and Windows, keep app running in system tray
  if (process.platform === 'linux') {
    app.quit()
  }
})

app.on('before-quit', async () => {
  await stopDaemon()
})
