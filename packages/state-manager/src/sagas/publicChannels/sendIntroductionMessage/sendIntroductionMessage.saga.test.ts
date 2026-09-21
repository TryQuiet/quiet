import { type FactoryGirl } from 'factory-girl'
import { expectSaga } from 'redux-saga-test-plan'
import { combineReducers, type AnyAction } from '@reduxjs/toolkit'
import { runSaga } from 'redux-saga'

import { setupCrypto } from '@quiet/identity'
import { userJoinedMessage } from '@quiet/common'

import { type Store } from '../../store.types'
import { prepareStore, testReducers } from '../../../utils/tests/prepareStore'
import { getReduxStoreFactory } from '../../..'
import { publicChannelsSelectors } from '../publicChannels.selectors'
import { publicChannelsActions } from './../publicChannels.slice'
import { communitiesActions } from '../../communities/communities.slice'
import { identityActions } from '../../identity/identity.slice'
import { identitySelectors } from '../../identity/identity.selectors'
import { messagesActions } from '../../messages/messages.slice'
import { sendIntroductionMessageSaga } from './sendIntroductionMessage.saga'
import { ChannelOperationStatus, CommunityOwnership, MessageType, type PublicChannel } from '@quiet/types'

describe('sendIntroductionMessageSaga', () => {
  let store: Store
  let factory: FactoryGirl

  beforeAll(async () => {
    setupCrypto()
  })

  beforeEach(async () => {
    store = prepareStore().store
    factory = await getReduxStoreFactory(store)
  })

  test('sends introduction message', async () => {
    const community = await factory.create('Community', { ownership: CommunityOwnership.User })

    store.dispatch(communitiesActions.updateCommunityData({ ...community, CA: null }))

    const identity = await factory.create('Identity', {
      communityId: community.id,
      userId: 'userId',
    })
    const userProfile = await factory.create('UserProfile', {
      userId: identity.userId,
    })

    await factory.create('PublicChannel')

    const generalChannel = publicChannelsSelectors.generalChannel(store.getState())
    if (!generalChannel) throw new Error('no general channel')

    const reducer = combineReducers(testReducers)

    await expectSaga(
      sendIntroductionMessageSaga,
      // @ts-ignore
      publicChannelsActions.sendIntroductionMessage()
    )
      .withReducer(reducer)
      .withState(store.getState())
      .call(userJoinedMessage, userProfile.nickname)
      .put(
        messagesActions.sendMessage({
          type: MessageType.Info,
          message: userJoinedMessage(userProfile.nickname),
          channelId: generalChannel.id,
        })
      )
      .put.like({
        action: { type: identityActions.updateIdentity.type, payload: { ...identity, introMessageSent: true } },
      })
      .run()
  })

  describe('general channel replication while joining', () => {
    const joinedAt = 1_790_000_000_000
    let sent: ReturnType<typeof messagesActions.sendMessage>[]
    let general: PublicChannel

    beforeEach(async () => {
      jest.spyOn(Date, 'now').mockReturnValue(joinedAt)
      const community = await factory.create('Community', { ownership: CommunityOwnership.User })
      const identity = await factory.create('Identity', { communityId: community.id, userId: 'userId' })
      await factory.create('UserProfile', { userId: identity.userId })
      general = publicChannelsSelectors.generalChannel(store.getState())!
      sent = []
    })

    afterEach(() => jest.restoreAllMocks())

    const introduce = async () => {
      await runSaga(
        {
          getState: store.getState,
          dispatch: (action: AnyAction) => {
            if (messagesActions.sendMessage.match(action)) sent.push(action)
            store.dispatch(action)
          },
        },
        sendIntroductionMessageSaga
      ).toPromise()
    }

    // Replay the reducer transitions made by channel replication and deletion.
    const replicateGeneral = (channel: PublicChannel) => {
      const current = publicChannelsSelectors.generalChannel(store.getState())
      if (current) store.dispatch(publicChannelsActions.deleteChannelFromStore({ channelId: current.id }))
      store.dispatch(publicChannelsActions.addChannel({ channel, status: ChannelOperationStatus.SUCCESS }))
    }

    test('repairs the stale target once when an existing replacement arrives', async () => {
      await introduce()
      const replacement = { ...general, id: 'replacement-general', timestamp: joinedAt - 20_000 }
      replicateGeneral(replacement)
      await introduce()
      await introduce()
      replicateGeneral(general)
      await introduce()
      replicateGeneral(replacement)
      await introduce()
      expect(sent.map(action => action.payload.channelId)).toEqual([general.id, replacement.id])
    })

    test('preserves repair state across renderer restarts', async () => {
      await introduce()
      store = prepareStore(JSON.parse(JSON.stringify(store.getState()))).store
      replicateGeneral({ ...general, id: 'replacement-general', timestamp: joinedAt - 20_000 })
      await introduce()
      await introduce()
      expect(sent.map(action => action.payload.channelId)).toEqual([general.id, 'replacement-general'])
    })

    test('does not reintroduce established members when general is recreated later', async () => {
      await introduce()
      jest.spyOn(Date, 'now').mockReturnValue(joinedAt + 60_000)
      replicateGeneral({ ...general, id: 'later-general', timestamp: joinedAt + 30_000 })
      await introduce()
      expect(sent).toHaveLength(1)
    })

    test('keeps the first announcement time after repairing a stale target', async () => {
      await introduce()
      jest.spyOn(Date, 'now').mockReturnValue(joinedAt + 60_000)
      replicateGeneral({ ...general, id: 'replacement-general', timestamp: joinedAt - 20_000 })
      await introduce()
      replicateGeneral({ ...general, id: 'later-general', timestamp: joinedAt + 30_000 })
      await introduce()
      expect(sent.map(action => action.payload.channelId)).toEqual([general.id, 'replacement-general'])
    })

    test('keeps already announced identities from older versions silent', async () => {
      const identity = identitySelectors.currentIdentity(store.getState())!
      store.dispatch(identityActions.updateIdentity({ ...identity, introMessageSent: true }))
      replicateGeneral({ ...general, id: 'replacement-general', timestamp: joinedAt - 20_000 })
      await introduce()
      expect(sent).toEqual([])
    })

    test('does not announce the owner', async () => {
      const identity = identitySelectors.currentIdentity(store.getState())!
      store.dispatch(
        communitiesActions.updateCommunityData({
          id: identity.communityId,
          updates: { ownership: CommunityOwnership.Owner },
        })
      )
      await introduce()
      expect(sent).toEqual([])
    })

    test('reserves the channel before a message triggers another replication event', async () => {
      let nested: Promise<void> | undefined
      await runSaga(
        {
          getState: store.getState,
          dispatch: (action: AnyAction) => {
            store.dispatch(action)
            if (messagesActions.sendMessage.match(action)) {
              sent.push(action)
              nested = introduce()
            }
          },
        },
        sendIntroductionMessageSaga
      ).toPromise()
      await nested
      expect(sent).toHaveLength(1)
    })

    test('announces once when general arrives after an empty initial snapshot', async () => {
      store.dispatch(publicChannelsActions.deleteChannelFromStore({ channelId: general.id }))
      await introduce()
      expect(sent).toEqual([])
      replicateGeneral(general)
      await introduce()
      await introduce()
      expect(sent).toHaveLength(1)
    })
  })
})
