import { testSaga } from 'redux-saga-test-plan'

import {
  CommunityOwnership,
  type DeviceInvitationDataV5,
  InvitationDataVersion,
  InvitationKind,
  LoadingPanelType,
  type ResponseLinkDevicePayload,
  SocketActions,
} from '@quiet/types'

import type { Socket } from '../../../types'
import { generateId } from '../../../utils/cryptography/cryptography'
import { identityActions } from '../../identity/identity.slice'
import { networkActions } from '../../network/network.slice'
import { communitiesActions } from '../communities.slice'
import { linkDeviceSaga } from './linkDevice.saga'

describe('linkDeviceSaga', () => {
  const communityId = 'linked-community-id'
  const inviteData: DeviceInvitationDataV5 = {
    kind: InvitationKind.Device,
    version: InvitationDataVersion.v5,
    pairs: [],
    psk: 'device-link-psk',
    authData: {
      communityName: 'Linked community',
      seed: 'device-invite-seed',
      teamId: 'team-id',
      userId: 'user-id',
      userName: 'alice',
    },
    qssEnabled: true,
    qssEndpoint: 'ws://localhost:3003',
  }
  const socket = {
    emitWithAck: jest.fn(),
  } as unknown as Socket
  const action = communitiesActions.linkDevice({ inviteData })
  const payload = {
    id: communityId,
    inviteData,
    deviceName: undefined,
  }

  it('stores and launches the linked community without creating a new profile', () => {
    const response: ResponseLinkDevicePayload = {
      id: communityId,
      community: {
        id: communityId,
        ownership: CommunityOwnership.User,
        name: inviteData.authData.communityName,
        teamId: inviteData.authData.teamId,
      },
      identity: {
        communityId,
        userId: inviteData.authData.userId,
        joinTimestamp: 1_700_000_000_000,
        networkInfo: {
          hiddenService: {
            onionAddress: 'linked-device.onion',
            privateKey: 'private-key',
          },
          peerId: {
            id: 'peer-id',
            privKey: 'private-key',
          },
        },
      },
    }

    testSaga(linkDeviceSaga, socket, action)
      .next()
      .put(networkActions.setLoadingPanelType(LoadingPanelType.Joining))
      .next()
      .call(generateId)
      .next(communityId)
      .put(communitiesActions.setInvitationCodes(inviteData))
      .next()
      .apply(socket, socket.emitWithAck, [SocketActions.LINK_DEVICE, payload])
      .next(response)
      .put(communitiesActions.addNewCommunity(response.community))
      .next()
      .put(communitiesActions.setCurrentCommunity(response.community.id))
      .next()
      .put(identityActions.addNewIdentity(response.identity))
      .next()
      .put(communitiesActions.launchCommunity(response.community))
      .next()
      .put(communitiesActions.clearInvitationCodes())
      .next()
      .isDone()
  })

  it('clears onboarding state and displays failure when the backend rejects the link', () => {
    testSaga(linkDeviceSaga, socket, action)
      .next()
      .put(networkActions.setLoadingPanelType(LoadingPanelType.Joining))
      .next()
      .call(generateId)
      .next(communityId)
      .put(communitiesActions.setInvitationCodes(inviteData))
      .next()
      .apply(socket, socket.emitWithAck, [SocketActions.LINK_DEVICE, payload])
      .next(undefined)
      .put(communitiesActions.clearInvitationCodes())
      .next()
      .put(networkActions.setLoadingPanelType(LoadingPanelType.Failed))
      .next()
      .isDone()
  })
})
