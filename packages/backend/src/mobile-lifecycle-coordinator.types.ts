import type { OpenServices } from './options'

export type MobileLifecycleIntent =
  | { type: 'paused' }
  | {
      type: 'active'
      services: OpenServices
    }

export interface MobileLifecycleHandlers {
  pause: () => Promise<void>
  activate: (services: OpenServices) => Promise<void>
}
