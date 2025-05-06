import { type TestApi, expectSaga } from 'redux-saga-test-plan'
import { apply } from 'redux-saga-test-plan/matchers'
import { combineReducers } from '@reduxjs/toolkit'
import { type Socket } from '../../../types'
import { MockedSocket } from '../../../utils/tests/mockedSocket'
import { getSocketFactory } from '../../../utils/tests/factories'

import { type GetMessagesPayload, SocketActions } from '@quiet/types'

import { getReduxStoreFactory } from '../../..'
import { prepareStore, testReducers } from '../../../utils/tests/prepareStore'
import { reducers } from '../../reducers'
import { communitiesActions } from '../../communities/communities.slice'
import { communitiesSelectors } from '../../communities/communities.selectors'
import { filesActions } from '../../files/files.slice'
import { getMessagesSaga } from './getMessages.saga'
import { messagesActions } from '../messages.slice'

describe('getMessagesSaga', () => {
  test('should retrieve and add messages', async () => {
    const reducer = combineReducers(testReducers)
    const store = prepareStore().store
    const factory = await getReduxStoreFactory(store)
    const community =
      await factory.create<ReturnType<typeof communitiesActions.addNewCommunity>['payload']>('Community')

    const mockGetMessagesResponse = { messages: [] }
    const socketPayloadFactory = await getSocketFactory()
    const socket = new MockedSocket()
    socket.registerExpectedResponse(SocketActions.GET_MESSAGES, mockGetMessagesResponse)
    const getMessagesPayload: GetMessagesPayload = {
      peerId: '',
      communityId: '',
      channelId: '',
      ids: [],
    }

    await expectSaga(getMessagesSaga, socket as unknown as Socket, messagesActions.getMessages(getMessagesPayload))
      .withReducer(reducer)
      .withState(store.getState())
      .apply(socket, socket.emitWithAck, [SocketActions.GET_MESSAGES, getMessagesPayload])
      .select(communitiesSelectors.currentCommunityId)
      .put(messagesActions.addMessages(mockGetMessagesResponse))
      .put(filesActions.checkForMissingFiles(community.id))
      .run()
  })
})
