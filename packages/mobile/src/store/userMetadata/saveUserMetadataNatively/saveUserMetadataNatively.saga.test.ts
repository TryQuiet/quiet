import { NativeModules } from 'react-native'
import { expectSaga } from 'redux-saga-test-plan'

import { saveUserMetadataNativelySaga } from './saveUserMetadataNatively.saga'
import { usersMetadataActions } from '../usersMetadata.slice'

describe('saveUserMetadataNativelySaga', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('serializes new and updated profiles before storing them natively', async () => {
    const payload = {
      new: [{ userId: 'new-user', nickname: 'Alice' }],
      updates: [{ userId: 'updated-user', nickname: 'Bob' }],
    }

    await expectSaga(saveUserMetadataNativelySaga, usersMetadataActions.saveUserMetadataNatively(payload))
      .call(
        NativeModules.CommunicationModule.saveUserMetadata,
        payload.new.concat(payload.updates).map(profile => JSON.stringify(profile))
      )
      .run()
  })
})
