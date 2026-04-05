import { Tray, Menu, nativeImage, app } from 'electron'

let tray: Tray | null = null

export function setupTray(onShowWindow: () => void) {
  // Create a simple tray icon (template image on macOS, standard icon on Windows)
  const icon = nativeImage.createEmpty()
  tray = new Tray(icon)
  tray.setToolTip('AI API Wallet')

  const contextMenu = Menu.buildFromTemplate([
    { label: 'Open AI Wallet', click: onShowWindow },
    { type: 'separator' },
    {
      label: 'Launch at Login',
      type: 'checkbox',
      checked: app.getLoginItemSettings().openAtLogin,
      click: (item) => {
        app.setLoginItemSettings({ openAtLogin: item.checked })
      },
    },
    { type: 'separator' },
    { label: 'Quit', click: () => app.quit() },
  ])

  tray.setContextMenu(contextMenu)
  tray.on('click', onShowWindow)
}
