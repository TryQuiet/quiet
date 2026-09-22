import { execSync } from 'child_process'
import { type SupportedPlatformDesktop } from '@quiet/types'

/** The program each desktop platform uses to hand a URL to its registered handler. */
const OPENERS: Record<SupportedPlatformDesktop, string> = {
  linux: 'xdg-open',
  darwin: 'open',
  win32: 'start',
}

/** The shell command that opens `url` through the OS handler on `platform`. */
export const deepLinkCommand = (url: string, platform: NodeJS.Platform = process.platform): string => {
  const opener = OPENERS[platform as SupportedPlatformDesktop]
  if (!opener) throw new Error(`No deep-link opener is known for platform ${platform}`)
  // `start` treats its first quoted argument as a window title, so it needs an empty one.
  return `${opener} ${platform === 'win32' ? '""' : ''} "${url}"`
}

/**
 * Run a deep-link opener, bounded.
 *
 * Which program handles `quiet://` is OS configuration, not Quiet. A stale or
 * malformed `x-scheme-handler/quiet` association makes the opener block instead
 * of forwarding the URL to the running app. Unbounded, that surfaces minutes
 * later as a guest that never reached the username modal, which reads as a
 * regression in the join flow rather than as local configuration.
 */
export const openDeepLink = (command: string, timeoutMs = 60_000): void => {
  try {
    execSync(command, { timeout: timeoutMs })
  } catch (error) {
    throw new Error(
      `Opening the invitation deep link failed: ${command}. ` +
        `Check the quiet:// handler (xdg-mime query default x-scheme-handler/quiet on Linux). ` +
        `Underlying error: ${(error as Error).message}`
    )
  }
}
