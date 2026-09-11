import { testSaga } from 'redux-saga-test-plan'
import { nativeServicesCallbacksSaga } from './events/nativeServicesCallbacks'
import { flushPersistorWatcherSaga, nativeServicesMasterSaga } from './nativeServices.master.saga'

describe('nativeServicesMasterSaga', () => {
  it('installs the flush watcher before subscribing to lifecycle callbacks', () => {
    testSaga(nativeServicesMasterSaga).next().fork(flushPersistorWatcherSaga).next().fork(nativeServicesCallbacksSaga)
  })
})
