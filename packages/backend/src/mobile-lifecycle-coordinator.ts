import type { OpenServices } from './options'
import type { MobileLifecycleHandlers, MobileLifecycleIntent } from './mobile-lifecycle-coordinator.types'

/**
 * Serializes mobile close/open events while coalescing superseded intents.
 * Active intents retain their payload because a new payload may describe a
 * replacement native Tor session even when the app is already foregrounded.
 */
export class MobileLifecycleCoordinator {
  private desiredIntent: MobileLifecycleIntent | undefined
  private transitionInFlight: Promise<void> | undefined

  constructor(private readonly handlers: MobileLifecycleHandlers) {}

  public pause(): Promise<void> {
    return this.request({ type: 'paused' })
  }

  public activate(services: OpenServices): Promise<void> {
    return this.request({ type: 'active', services: { ...services } })
  }

  private request(intent: MobileLifecycleIntent): Promise<void> {
    this.desiredIntent = intent

    if (!this.transitionInFlight) {
      const transition = this.drain()
      this.transitionInFlight = transition
      void transition.then(
        () => this.clearTransition(transition),
        () => this.clearTransition(transition)
      )
    }

    return this.transitionInFlight
  }

  private clearTransition(transition: Promise<void>): void {
    if (this.transitionInFlight === transition) {
      this.transitionInFlight = undefined
    }
  }

  private async drain(): Promise<void> {
    let transitionError: unknown
    let transitionFailed = false

    while (this.desiredIntent) {
      const intent = this.desiredIntent

      try {
        if (intent.type === 'paused') {
          await this.handlers.pause()
        } else {
          await this.handlers.activate(intent.services)
        }
      } catch (error) {
        if (!transitionFailed) {
          transitionError = error
          transitionFailed = true
        }

        // A newer request must still be applied even when the transition it
        // superseded failed. The shared request promise reports the failure
        // after the coordinator reaches the latest requested state.
        if (this.desiredIntent !== intent) {
          continue
        }
        throw transitionError
      }

      const latestIntent = this.desiredIntent
      if (latestIntent === intent) {
        if (transitionFailed) {
          throw transitionError
        }
        return
      }

      // Repeated close requests require no additional work. Active requests
      // are always replayed so the newest Tor control payload is applied.
      if (intent.type === 'paused' && latestIntent.type === 'paused') {
        if (transitionFailed) {
          throw transitionError
        }
        return
      }
    }
  }
}
