import type { EventEmitter } from 'events'

/** Recovery must arrive over the native bridge, independently of localhost. */
export const registerMobileSocketRecovery = (
  channels: Pick<EventEmitter, 'on'>[],
  socket: { recoverLocalConnection: () => Promise<void> },
  onError: (error: unknown) => void
): void => {
  for (const channel of channels) {
    channel.on('recoverSocket', () => {
      void socket.recoverLocalConnection().catch(onError)
    })
  }
}
