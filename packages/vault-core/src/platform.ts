export const isWindows = (): boolean => process.platform === 'win32'
export const isMacOS = (): boolean => process.platform === 'darwin'

export function getSecureStorageName(): string {
  if (isMacOS()) return 'macOS Keychain'
  if (isWindows()) return 'Windows DPAPI'
  return 'OS keychain'
}
