import { call } from 'typed-redux-saga'
import { persistor } from '../../store'
import { createLogger } from '../../../utils/logger'

const logger = createLogger('flushPersistor')

export function* flushPersistorSaga(): Generator {
  logger.info('Flushing redux store')
  yield* call(persistor.flush)
}
