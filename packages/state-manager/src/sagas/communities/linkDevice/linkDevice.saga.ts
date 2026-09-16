import { type PayloadAction } from '@reduxjs/toolkit'
import { apply, call, put } from 'typed-redux-saga'

import {
  type InitDeviceLinkPayload,
  InvitationDataVersion,
  type LinkDevicePayload,
  LoadingPanelType,
  type ResponseLinkDevicePayload,
  SocketActions,
} from '@quiet/types'

import { applyEmitParams, type Socket } from '../../../types'
import { createLogger } from '../../../utils/logger'
import { generateId } from '../../../utils/cryptography/cryptography'
import { identityActions } from '../../identity/identity.slice'
import { networkActions } from '../../network/network.slice'
import { communitiesActions } from '../communities.slice'

const logger = createLogger('linkDeviceSaga')

export function* linkDeviceSaga(
  socket: Socket,
  action: PayloadAction<ReturnType<typeof communitiesActions.linkDevice>['payload']>
): Generator {
  logger.info('Starting linkDeviceSaga')

  const { inviteData, deviceName, deviceLinkConsent, confirmedQssEndpoint } = action.payload as LinkDevicePayload

  const qssEndpointMatches =
    inviteData.version !== InvitationDataVersion.v5 ||
    inviteData.qssEnabled !== true ||
    confirmedQssEndpoint === inviteData.qssEndpoint
  if (deviceLinkConsent !== true || !qssEndpointMatches) {
    logger.error('Refusing to link a device without consent for its network endpoint')
    yield* put(networkActions.setLoadingPanelType(LoadingPanelType.Failed))
    return
  }

  yield* put(networkActions.setLoadingPanelType(LoadingPanelType.Joining))

  const communityId = yield* call(generateId)
  yield* put(communitiesActions.setInvitationCodes(inviteData))

  const payload: InitDeviceLinkPayload = {
    id: communityId,
    inviteData,
    deviceName,
    deviceLinkConsent,
    confirmedQssEndpoint,
  }
  const response: ResponseLinkDevicePayload | undefined = yield* apply(
    socket,
    socket.emitWithAck,
    applyEmitParams(SocketActions.LINK_DEVICE, payload)
  )

  if (!response) {
    logger.error('Failed to link device - invalid response from backend')
    yield* put(communitiesActions.clearInvitationCodes())
    yield* put(networkActions.setLoadingPanelType(LoadingPanelType.Failed))
    return
  }

  yield* put(communitiesActions.addNewCommunity(response.community))
  yield* put(communitiesActions.setCurrentCommunity(response.community.id))
  yield* put(identityActions.addNewIdentity(response.identity))
  yield* put(communitiesActions.launchCommunity(response.community))
  yield* put(communitiesActions.clearInvitationCodes())
}
