import type { OpenServices } from './options'

export enum MobileLifecycleIntentType {
  PAUSED = 'paused',
  ACTIVE = 'active',
}

export type MobileLifecycleIntent =
  | { type: MobileLifecycleIntentType.PAUSED }
  | {
      type: MobileLifecycleIntentType.ACTIVE
      services: OpenServices
    }

export interface MobileLifecycleHandlers {
  pause: () => Promise<void>
  activate: (services: OpenServices) => Promise<void>
}
