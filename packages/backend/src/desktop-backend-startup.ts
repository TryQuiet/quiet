import { type EventEmitter } from 'events'

interface DesktopBackend<T> {
  value: T
  close: () => Promise<void>
}

/** Capture quit requests while Nest providers are still initializing. */
export const startDesktopBackend = async <T>(
  initialize: () => Promise<DesktopBackend<T>>,
  logger: Pick<Console, 'info' | 'error'>,
  messages: Pick<EventEmitter, 'on' | 'removeListener'> = process
): Promise<T> => {
  let backend: DesktopBackend<T> | undefined
  let closeRequested = false
  let closing: Promise<void> | undefined
  const close = () => {
    if (!backend) return
    closing ??= Promise.resolve().then(async () => await backend!.close())
    return closing
  }
  const onMessage = (message: unknown) => {
    if (message !== 'close') return
    logger.info('Received close message from parent process')
    closeRequested = true
    void close()?.catch(error => logger.error('Failed to close desktop backend', error))
  }

  messages.on('message', onMessage)
  try {
    backend = await initialize()
    if (closeRequested) await close()
    return backend.value
  } catch (error) {
    messages.removeListener('message', onMessage)
    throw error
  }
}
