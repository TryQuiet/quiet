import { communities, getFactory, Store } from '@quiet/state-manager'
import { Community, CommunityOwnership, CreateNetworkPayload, InvitationData, InvitationDataV1 } from '@quiet/types'
import { FactoryGirl } from 'factory-girl'
import { expectSaga } from 'redux-saga-test-plan'
import { customProtocolSaga } from './customProtocol.saga'
import { SocketState } from '../socket/socket.slice'
import { prepareStore } from '../../testUtils/prepareStore'
import { StoreKeys } from '../../store/store.keys'
import { modalsActions } from '../modals/modals.slice'
import { ModalName } from '../modals/modals.types'
import { getValidInvitationUrlTestData, validInvitationDatav1 } from '@quiet/common'

describe('Handle invitation code', () => {
  let store: Store
  let factory: FactoryGirl
  let community: Community
  let validInvitationData: InvitationDataV1
  let validInvitationDeepUrl: string

  beforeEach(async () => {
    store = (
      await prepareStore({
        [StoreKeys.Socket]: {
          ...new SocketState(),
          isConnected: true,
        },
      })
    ).store

    factory = await getFactory(store)

    validInvitationData = getValidInvitationUrlTestData(validInvitationDatav1[0]).data
    validInvitationDeepUrl = getValidInvitationUrlTestData(validInvitationDatav1[0]).deepUrl()
  })

  it('creates network if code is valid', async () => {
    const payload: CreateNetworkPayload = {
      ownership: CommunityOwnership.User,
      peers: validInvitationData.pairs,
      psk: validInvitationData.psk,
      ownerOrbitDbIdentity: validInvitationData.ownerOrbitDbIdentity,
    }
    await expectSaga(customProtocolSaga, communities.actions.customProtocol([validInvitationDeepUrl]))
      .withState(store.getState())
      .put(communities.actions.createNetwork(payload))
      .run()
  })

  it('does not try to create network if user is already in community', async () => {
    community = await factory.create<ReturnType<typeof communities.actions.addNewCommunity>['payload']>('Community')
    const payload: CreateNetworkPayload = {
      ownership: CommunityOwnership.User,
      peers: validInvitationData.pairs,
      psk: validInvitationData.psk,
    }

    await expectSaga(customProtocolSaga, communities.actions.customProtocol([validInvitationDeepUrl]))
      .withState(store.getState())
      .put(
        modalsActions.openModal({
          name: ModalName.warningModal,
          args: {
            title: 'You already belong to a community',
            subtitle: "We're sorry but for now you can only be a member of a single community at a time.",
          },
        })
      )
      .not.put(communities.actions.createNetwork(payload))
      .run()
  })

  it('does not try to create network if code is missing psk', async () => {
    const payload: CreateNetworkPayload = {
      ownership: CommunityOwnership.User,
      peers: [],
    }

    await expectSaga(
      customProtocolSaga,
      communities.actions.customProtocol(['someArg', 'quiet://?k=BNlxfE2WBF7LrlpIX0CvECN5o1oZtA16PkAb7GYiwYw='])
    )
      .withState(store.getState())
      .put(communities.actions.clearInvitationCodes())
      .put(
        modalsActions.openModal({
          name: ModalName.warningModal,
          args: {
            title: 'Invalid link',
            subtitle: 'The invite link you received is not valid. Please check it and try again.',
          },
        })
      )
      .not.put(communities.actions.createNetwork(payload))
      .run()
  })

  it('does not try to create network if code is missing psk', async () => {
    const payload: CreateNetworkPayload = {
      ownership: CommunityOwnership.User,
      peers: [],
    }

    await expectSaga(
      customProtocolSaga,
      communities.actions.customProtocol([
        'quiet://?QmZoiJNAvCffeEHBjk766nLuKVdkxkAT7wfFJDPPLsbKSE=y7yczmugl2tekami7sbdz5pfaemvx7bahwthrdvcbzw5vex2crsr26qd',
      ])
    )
      .withState(store.getState())
      .put(communities.actions.clearInvitationCodes())
      .put(
        modalsActions.openModal({
          name: ModalName.warningModal,
          args: {
            title: 'Invalid link',
            subtitle: 'The invite link you received is not valid. Please check it and try again.',
          },
        })
      )
      .not.put(communities.actions.createNetwork(payload))
      .run()
  })
})
