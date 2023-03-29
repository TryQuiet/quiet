import { communities, Community, CommunityOwnership, CreateNetworkPayload, getFactory, Store } from '@quiet/state-manager'
import { FactoryGirl } from 'factory-girl'
import { expectSaga } from 'redux-saga-test-plan'
import { handleInvitationCodeSaga } from './handleInvitationCode.saga'
import { SocketState } from '../socket/socket.slice'
import { reducers } from '../../store/reducers'
import { prepareStore } from '../../testUtils/prepareStore'
import { StoreKeys } from '../../store/store.keys'

describe('Handle invitation code', () => {
  let store: Store
  let factory: FactoryGirl
  let community: Community
  let validInvitationCode: string

  beforeEach(async () => {
    store = (await prepareStore({
      [StoreKeys.Socket]: {
        ...new SocketState(),
        isConnected: true
      }
    })).store

    factory = await getFactory(store)
    validInvitationCode = 'bb5wacaftixjl3yhq2cp3ls2ife2e5wlwct3hjlb4lyk4iniypmgozyd'
  })

  it('creates network if code is valid', async () => {
    const payload: CreateNetworkPayload = {
      ownership: CommunityOwnership.User,
      registrar: validInvitationCode
    }
    await expectSaga(
      handleInvitationCodeSaga,
      communities.actions.handleInvitationCode(validInvitationCode)
    )
    .withState(store.getState())
    .put(communities.actions.createNetwork(payload))
    .run()
  })

  it('does not try to create network if user is already in community', async () => {
    community = await factory.create<ReturnType<typeof communities.actions.addNewCommunity>['payload']>('Community')
    const payload: CreateNetworkPayload = {
      ownership: CommunityOwnership.User,
      registrar: validInvitationCode
    }

    await expectSaga(
      handleInvitationCodeSaga,
      communities.actions.handleInvitationCode(validInvitationCode)
    )
    .withState(store.getState())
    .not.put(communities.actions.createNetwork(payload))
    .run()
  })

  it('does not try to create network if code is invalid', async () => {
    const code = 'invalid'
    const payload: CreateNetworkPayload = {
      ownership: CommunityOwnership.User,
      registrar: code
    }

    await expectSaga(
      handleInvitationCodeSaga,
      communities.actions.handleInvitationCode(code)
    )
    .withState(store.getState())
    .not.put(communities.actions.createNetwork(payload))
    .run()
  })
})
