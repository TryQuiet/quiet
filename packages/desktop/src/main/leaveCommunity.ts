import { type ChildProcess } from 'child_process'
import { randomUUID } from 'crypto'
import { type BackendLeaveCommunityMessage, type BackendLeaveCommunityRequest } from '@quiet/types'

interface LeaveCommunityDependencies {
  getBackendProcess: () => ChildProcess | null
  setResetting: (resetting: boolean) => void
  logger: Pick<Console, 'info' | 'warn' | 'error'>
}

export const createLeaveCommunityHandler = ({
  getBackendProcess,
  setResetting,
  logger,
}: LeaveCommunityDependencies): (() => Promise<boolean>) => {
  let pending: Promise<boolean> | undefined

  return () => {
    if (pending) return pending

    const backend = getBackendProcess()
    if (!backend) return Promise.resolve(false)

    const request: BackendLeaveCommunityRequest = { type: 'leaveCommunity', requestId: randomUUID() }
    setResetting(true)
    pending = new Promise<boolean>(resolve => {
      let settled = false
      const finish = (success: boolean) => {
        if (settled) return
        settled = true
        backend.removeListener('message', onMessage)
        backend.removeListener('close', onClose)
        backend.removeListener('error', onError)
        backend.removeListener('disconnect', onDisconnect)
        resolve(success)
      }
      const onMessage = (message: unknown) => {
        const response = message as Partial<BackendLeaveCommunityMessage> | null
        if (
          response?.type === 'leftCommunity' &&
          response.requestId === request.requestId &&
          typeof response.success === 'boolean'
        ) {
          finish(response.success)
        }
      }
      const onClose = (code: number | null, signal: NodeJS.Signals | null) => {
        logger.warn('Backend closed before clear-community completed', code, signal)
        finish(false)
      }
      const onError = (error: Error) => {
        logger.error('Backend error before clear-community completed', error)
        finish(false)
      }
      const onDisconnect = () => {
        logger.warn('Backend disconnected before clear-community completed')
        finish(false)
      }

      backend.on('message', onMessage)
      backend.once('close', onClose)
      backend.once('error', onError)
      backend.once('disconnect', onDisconnect)
      try {
        logger.info('Requesting backend community cleanup')
        backend.send(request, error => {
          if (error) onError(error)
        })
      } catch (error) {
        logger.error('Failed to send leaveCommunity to backend', error)
        finish(false)
      }
    }).finally(() => {
      pending = undefined
      setResetting(false)
    })
    return pending
  }
}
