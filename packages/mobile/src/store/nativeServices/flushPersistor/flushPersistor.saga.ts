import { call } from 'typed-redux-saga'
import { persistor } from '../../store'

export function* flushPersistorSaga(): Generator {
  console.info('Flushing redux store')
  yield* call(persistor.flush)
}
