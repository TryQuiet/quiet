import { setupCrypto } from '@quiet/identity'
import { Store } from '../../store.types'
import { getFactory, Identity, MessageType, publicChannels } from '../../..'
import { prepareStore, reducers } from '../../../utils/tests/prepareStore'
import { publicChannelsActions } from './../publicChannels.slice'
import { communitiesActions, Community } from '../../communities/communities.slice'
import { identityActions } from '../../identity/identity.slice'
import { FactoryGirl } from 'factory-girl'
import { combineReducers } from 'redux'
import { expectSaga } from 'redux-saga-test-plan'
import { checkForMessagesSaga } from './checkForMessages.saga'
import { PublicChannel } from '../publicChannels.types'
import { DateTime } from 'luxon'

describe('checkForMessagesSaga', () => {
  let store: Store
  let factory: FactoryGirl

  let community: Community
  let alice: Identity
  let channel: PublicChannel

  beforeAll(async () => {
    setupCrypto()

    // Set date display format
    process.env.LC_ALL = 'en_US.UTF-8'

    store = prepareStore().store

    factory = await getFactory(store)

    community = await factory.create<
    ReturnType<typeof communitiesActions.addNewCommunity>['payload']
    >('Community')

    channel = publicChannels.selectors.publicChannels(store.getState())[0]

    alice = await factory.create<ReturnType<typeof identityActions.addNewIdentity>['payload']>(
      'Identity',
      { id: community.id, nickname: 'alice' }
    )
  })

  test('ask for missing messages', async () => {
    const types = [MessageType.Basic, MessageType.Empty, MessageType.Empty]

    const shuffled = types
      .map(value => ({ value, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort)
      .map(({ value }) => value)

    const messages = await Promise.all(
      shuffled.map(async type => {
        return await factory.create<
        ReturnType<typeof publicChannels.actions.test_message>['payload']
        >('Message', {
          identity: alice,
          message: {
            id: Math.random().toString(36).substr(2.9),
            type: type,
            message: 'message',
            createdAt: DateTime.utc().valueOf(),
            channelId: 'general',
            signature: '',
            pubKey: ''
          },
          verifyAutomatically: true
        })
      })
    )

    const empties = messages.filter(item => item.message.type === MessageType.Empty)
    const ids = empties.map(item => {
      return item.message.id
    })

    const reducer = combineReducers(reducers)
    await expectSaga(checkForMessagesSaga)
      .withReducer(reducer)
      .withState(store.getState())
      .put(
        publicChannelsActions.askForMessages({
          peerId: alice.peerId.id,
          communityId: community.id,
          channelAddress: channel.address,
          ids: ids
        })
      )
      .run()
  })
})
