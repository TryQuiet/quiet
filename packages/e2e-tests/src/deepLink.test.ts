import { deepLinkCommand, openDeepLink } from './deepLink'

describe('deep-link command', () => {
  it('opens through each desktop platform’s handler', () => {
    expect(deepLinkCommand('quiet://?p=abc', 'linux')).toBe('xdg-open  "quiet://?p=abc"')
    expect(deepLinkCommand('quiet://?p=abc', 'darwin')).toBe('open  "quiet://?p=abc"')
    // `start` reads a lone quoted argument as the window title, so the URL needs its own.
    expect(deepLinkCommand('quiet://?p=abc', 'win32')).toBe('start "" "quiet://?p=abc"')
  })

  it('refuses a platform it has no opener for', () => {
    expect(() => deepLinkCommand('quiet://?p=abc', 'android')).toThrow('No deep-link opener is known')
  })
})

describe('opening a deep link', () => {
  it('returns once the opener has handed the URL over', () => {
    expect(() => openDeepLink('true', 10_000)).not.toThrow()
  })

  // A misconfigured x-scheme-handler/quiet entry makes the real opener block. The
  // run has to fail on that, naming the handler, rather than sit until the jest
  // timeout and then report a guest that never reached the username modal.
  it('fails and names the handler when the opener blocks', () => {
    const start = Date.now()
    expect(() => openDeepLink('sleep 30', 1_000)).toThrow(/x-scheme-handler\/quiet/)
    expect(Date.now() - start).toBeLessThan(15_000)
  })

  it('reports the command and the underlying failure when the opener errors', () => {
    expect(() => openDeepLink('exit 3', 10_000)).toThrow(/Opening the invitation deep link failed: exit 3/)
  })
})
