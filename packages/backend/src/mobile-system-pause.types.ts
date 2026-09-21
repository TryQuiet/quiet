import type { SystemEventLock } from './rn-bridge'

export interface MobileSystemPauseChannel {
  on: (event: 'pause', listener: (eventLock: SystemEventLock) => void) => unknown
}

export interface MobileSystemPauseCoordinator {
  pause: () => Promise<void>
}

export interface MobileSystemPauseLogger {
  error: (message: string, context: Record<string, string>) => void
}
