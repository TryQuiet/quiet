import { type TestApi, expectSaga } from 'redux-saga-test-plan'
import { apply } from 'redux-saga-test-plan/matchers'
import { combineReducers } from '@reduxjs/toolkit'
import { type Socket } from 'socket.io-client'

import { type GetMessagesPayload, SocketActionTypes } from '@quiet/types'

import { getFactory } from '../../..'
import { prepareStore } from '../../../utils/tests/prepareStore'
import { reducers } from '../../reducers'
import { communitiesActions } from '../../communities/communities.slice'
import { communitiesSelectors } from '../../communities/communities.selectors'
import { filesActions } from '../../files/files.slice'
import { getMessagesSaga } from './getMessages.saga'
import { messagesActions } from '../messages.slice'

describe('getMessagesSaga', () => {
  test('should retrieve and add messages', async () => {
    const reducer = combineReducers(reducers)
    const store = prepareStore().store
    const factory = await getFactory(store)
    const community =
      await factory.create<ReturnType<typeof communitiesActions.addNewCommunity>['payload']>('Community')

    const mockGetMessagesResponse = { messages: [] }
    const socket = { emit: jest.fn(), emitWithAck: jest.fn(async () => mockGetMessagesResponse) } as unknown as Socket
    const getMessagesPayload: GetMessagesPayload = {
      peerId: '',
      communityId: '',
      channelId: '',
      ids: [],
    }

    await expectSaga(getMessagesSaga, socket, messagesActions.getMessages(getMessagesPayload))
      .withReducer(reducer)
      .withState(store.getState())
      .apply(socket, socket.emitWithAck, [SocketActionTypes.GET_MESSAGES, getMessagesPayload])
      .select(communitiesSelectors.currentCommunityId)
      .put(messagesActions.addMessages(mockGetMessagesResponse))
      .put(filesActions.checkForMissingFiles(community.id))
      .run()
  })
})
