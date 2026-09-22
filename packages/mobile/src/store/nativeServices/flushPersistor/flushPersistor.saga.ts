import { NativeModules } from 'react-native'
import { call, cancelled } from 'typed-redux-saga'
import { persistor } from '../../store'
import { createLogger } from '../../../utils/logger'
import { nativeServicesActions } from '../nativeServices.slice'

const logger = createLogger('flushPersistor')

export const flushPersistorForTransition = async (transitionId?: string): Promise<void> => {
  let success = false

  try {
    await persistor.flush()
    success = true
  } catch (error) {
    logger.error(
      `Failed to flush redux store before background transition; transition=${transitionId ?? 'legacy'}`,
      error instanceof Error ? error.name : typeof error
    )
  } finally {
    if (transitionId) {
      const completeAppPause = NativeModules.CommunicationModule?.completeAppPause
      if (completeAppPause) {
        completeAppPause.call(NativeModules.CommunicationModule, transitionId, success)
      } else {
        logger.error(`Cannot acknowledge redux store flush; transition=${transitionId} completeAppPause is unavailable`)
      }
    }
  }
}

export function* flushPersistorSaga(action: ReturnType<typeof nativeServicesActions.flushPersistor>): Generator {
  logger.info('Flushing redux store')
  try {
    yield* call(flushPersistorForTransition, action.payload?.transitionId)
  } finally {
    if (yield* cancelled()) {
      logger.warn(
        `Redux flush watcher cancelled; transition=${action.payload?.transitionId ?? 'legacy'} flush continues`
      )
    }
  }
}
