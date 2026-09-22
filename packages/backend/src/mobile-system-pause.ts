import type {
  MobileSystemPauseChannel,
  MobileSystemPauseCoordinator,
  MobileSystemPauseLogger,
} from './mobile-system-pause.types'

const errorType = (error: unknown): string => (error instanceof Error ? error.name : typeof error)

/**
 * Connects the native system pause lock to the serialized backend lifecycle.
 * Native owns the timeout; this listener always acknowledges when backend work
 * settles so one failed participant cannot strand the UIKit background task.
 */
export const registerMobileSystemPause = (
  systemChannel: MobileSystemPauseChannel,
  lifecycle: MobileSystemPauseCoordinator,
  logger: MobileSystemPauseLogger
): void => {
  systemChannel.on('pause', eventLock => {
    void (async () => {
      try {
        await lifecycle.pause()
      } catch (error) {
        logger.error('Mobile system pause participant failed', {
          participant: 'backend',
          eventId: eventLock.eventId ?? 'missing',
          errorType: errorType(error),
        })
      } finally {
        eventLock.release()
      }
    })()
  })
}
