import { testSaga } from 'redux-saga-test-plan'

import { admissionResetMasterSaga } from './nativeServices/nativeServices.master.saga'
import { storeReadySaga } from './root.saga'

describe('storeReadySaga', () => {
  it('installs admission reset recovery before socket startup can receive a replay', () => {
    testSaga(storeReadySaga).next().fork(admissionResetMasterSaga)
  })
})
