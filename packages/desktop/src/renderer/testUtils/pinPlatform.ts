/**
 * Pins `process.platform` for the enclosing `describe`, restoring it afterwards.
 *
 * Several components read `process.platform` directly — the sidebar's window-controls strip
 * (`headerTopInset`), the macOS drag region (`windowDragRegion`), the scanner's camera-denied
 * copy (`deniedCopy`) — so a snapshot or a copy assertion written on one OS fails on another.
 * CI runs the desktop suite on both ubuntu-22.04 and macos-26; a test whose expectation is one
 * platform's output pins that platform.
 */
export const pinPlatform = (platform: NodeJS.Platform): void => {
  const original = Object.getOwnPropertyDescriptor(process, 'platform')
  beforeAll(() => {
    Object.defineProperty(process, 'platform', { value: platform, configurable: true })
  })
  afterAll(() => {
    if (original) Object.defineProperty(process, 'platform', original)
  })
}
