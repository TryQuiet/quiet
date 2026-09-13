import { communities, getReduxStoreFactory, Store } from '@quiet/state-manager'
import {
  Community,
  type DeviceInvitationDataV4,
  InvitationKind,
  JoinCommunityPayload,
  type InvitationDataV4,
} from '@quiet/types'
import { FactoryGirl } from 'factory-girl'
import { expectSaga } from 'redux-saga-test-plan'
import { customProtocolSaga } from './customProtocol.saga'
import { SocketState } from '../socket/socket.slice'
import { prepareStore } from '../../testUtils/prepareStore'
import { StoreKeys } from '../../store/store.keys'
import { modalsActions } from '../modals/modals.slice'
import { ModalName } from '../modals/modals.types'
import { getValidInvitationUrlTestData, JoiningAnotherCommunityWarning, validInvitationDatav4 } from '@quiet/common'
import { AlreadyBelongToCommunityWarning, InvalidInvitationLinkError } from '@quiet/common'

describe('Handle invitation code', () => {
  let store: Store
  let factory: FactoryGirl
  let community: Community
  let validInvitationData: InvitationDataV4
  let validInvitationDeepUrl: string
  let validDeviceInvitationData: DeviceInvitationDataV4
  let validDeviceInvitationDeepUrl: string

  beforeEach(async () => {
    store = (
      await prepareStore({
        [StoreKeys.Socket]: {
          ...new SocketState(),
          isConnected: true,
        },
      })
    ).store

    factory = await getReduxStoreFactory(store)

    validInvitationData = {
      ...getValidInvitationUrlTestData(validInvitationDatav4[0]).data,
      kind: InvitationKind.Member,
    }
    validInvitationDeepUrl = getValidInvitationUrlTestData(validInvitationDatav4[0]).deepUrl()
    validDeviceInvitationData = {
      ...validInvitationData,
      kind: InvitationKind.Device,
      authData: {
        ...validInvitationData.authData,
        userId: 'device-owner-id',
        userName: 'device-owner',
      },
    }
    validDeviceInvitationDeepUrl = getValidInvitationUrlTestData(validDeviceInvitationData).deepUrl()
  })

  it('joins network if code is valid', async () => {
    const joinCommunityPayload: JoinCommunityPayload = {
      inviteData: validInvitationData,
    }
    await expectSaga(customProtocolSaga, communities.actions.customProtocol([validInvitationDeepUrl]))
      .withState(store.getState())
      .not.put(
        modalsActions.openModal({
          name: ModalName.warningModal,
          args: {
            title: AlreadyBelongToCommunityWarning.TITLE,
            subtitle: AlreadyBelongToCommunityWarning.MESSAGE,
          },
        })
      )
      .put(communities.actions.joinCommunity(joinCommunityPayload))
      .run()
  })

  it('links a device without opening username registration', async () => {
    await expectSaga(customProtocolSaga, communities.actions.customProtocol([validDeviceInvitationDeepUrl]))
      .withState(store.getState())
      .put(modalsActions.openModal({ name: ModalName.loadingPanel }))
      .put(communities.actions.linkDevice({ inviteData: validDeviceInvitationData }))
      .not.put(modalsActions.openModal({ name: ModalName.createUsernameModal }))
      .run()
  })

  // TODO: https://github.com/TryQuiet/quiet/issues/2628
  it('joins network if v4 code is valid', async () => {
    const validInvitationData: InvitationDataV4 = {
      ...getValidInvitationUrlTestData(validInvitationDatav4[0]).data,
      kind: InvitationKind.Member,
    }
    const validInvitationDeepUrl = getValidInvitationUrlTestData(validInvitationDatav4[0]).deepUrl()
    const joinCommunityPayload: JoinCommunityPayload = {
      inviteData: validInvitationData,
    }
    await expectSaga(customProtocolSaga, communities.actions.customProtocol([validInvitationDeepUrl]))
      .withState(store.getState())
      .put(communities.actions.joinCommunity(joinCommunityPayload))
      .run()
  })

  it('does not try to create network if user is already in community', async () => {
    community = await factory.create('Community')
    const identity = await factory.create('Identity', {
      communityId: community.id,
    })
    const joinCommunityPayload: JoinCommunityPayload = {
      inviteData: validInvitationData,
    }

    await expectSaga(customProtocolSaga, communities.actions.customProtocol([validInvitationDeepUrl]))
      .withState(store.getState())
      .put(
        modalsActions.openModal({
          name: ModalName.warningModal,
          args: {
            title: AlreadyBelongToCommunityWarning.TITLE,
            subtitle: AlreadyBelongToCommunityWarning.MESSAGE,
          },
        })
      )
      .not.put(communities.actions.joinCommunity(joinCommunityPayload))
      .run()
  })

  // TODO: https://github.com/TryQuiet/quiet/issues/2628
  // it('does not try to create network if user used v4 invitation link and is joining another community', async () => {
  //   const invitationData = validInvitationDatav4[0]
  //   community = await factory.create('Community', {
  //     name: '',
  //     inviteData: invitationData,
  //   })
  //   const newInvitationData = {
  //     ...invitationData,
  //     serverAddress: 'http://something-else.pl',
  //   }
  //   const joinCommunityPayload: JoinCommunityPayload = {
  //     inviteData: newInvitationData,
  //   }

  //   store.dispatch(communities.actions.addNewCommunity(community))
  //   store.dispatch(communities.actions.setCurrentCommunity(community.id))

  //   await expectSaga(
  //     customProtocolSaga,
  //     communities.actions.customProtocol([getValidInvitationUrlTestData(newInvitationData).deepUrl()])
  //   )
  //     .withState(store.getState())
  //     .put(
  //       modalsActions.openModal({
  //         name: ModalName.warningModal,
  //         args: {
  //           title: JoiningAnotherCommunityWarning.TITLE,
  //           subtitle: JoiningAnotherCommunityWarning.MESSAGE,
  //         },
  //       })
  //     )
  //     .not.put(communities.actions.joinCommunity(joinCommunityPayload))
  //     .run()
  // })

  it('does not try to create network if code is missing data', async () => {
    const joinCommunityPayload: JoinCommunityPayload = {
      inviteData: validInvitationData,
    }

    await expectSaga(
      customProtocolSaga,
      communities.actions.customProtocol(['someArg', 'quiet://?k=BNlxfE2WBF7LrlpIX0CvECN5o1oZtA16PkAb7GYiwYw='])
    )
      .withState(store.getState())
      .put(
        modalsActions.openModal({
          name: ModalName.warningModal,
          args: {
            title: InvalidInvitationLinkError.TITLE,
            subtitle: InvalidInvitationLinkError.MESSAGE,
          },
        })
      )
      // .not.put(communities.actions.joinCommunity(joinCommunityPayload))
      .run()
  })

  // test("doesn't display error if user is connecting with the same community", async () => {
  //   community = await factory.create('Community', {
  //     name: '',
  //     psk: validInvitationData.psk,
  //   })

  //   const joinCommunityPayload: JoinCommunityPayload = {
  //     inviteData: validInvitationData,
  //   }

  //   store.dispatch(communities.actions.addNewCommunity(community))
  //   store.dispatch(communities.actions.setCurrentCommunity(community.id))

  //   await expectSaga(customProtocolSaga, communities.actions.customProtocol([validInvitationDeepUrl]))
  //     .withState(store.getState())
  //     .not.put.like({
  //       action: {
  //         type: modalsActions.openModal.type,
  //         payload: {
  //           name: ModalName.warningModal,
  //           params: {
  //             title: AlreadyBelongToCommunityWarning.TITLE,
  //             message: AlreadyBelongToCommunityWarning.MESSAGE,
  //           },
  //         },
  //       },
  //     })
  //     .put(communities.actions.joinCommunity(joinCommunityPayload))
  //     .run()
  // })
})
