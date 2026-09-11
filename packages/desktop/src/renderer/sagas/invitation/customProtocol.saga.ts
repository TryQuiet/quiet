import { PayloadAction } from '@reduxjs/toolkit'
import { select, put, delay } from 'typed-redux-saga'
import {
  type InvitationData,
  type JoinCommunityPayload,
  type LinkDevicePayload,
  isDeviceInvitationData,
} from '@quiet/types'
import { communities, identity } from '@quiet/state-manager'
import { socketSelectors } from '../socket/socket.selectors'
import { ModalName } from '../modals/modals.types'
import { modalsActions } from '../modals/modals.slice'
import { argvInvitationLink } from '@quiet/common'
import {
  AlreadyBelongToCommunityWarning,
  InvalidInvitationLinkError,
  JoiningAnotherCommunityWarning,
} from '@quiet/common'
import { createLogger } from '../../logger'

const logger = createLogger('customProtocol')

export function* customProtocolSaga(
  action: PayloadAction<ReturnType<typeof communities.actions.customProtocol>['payload']>
): Generator {
  const code = action.payload
  logger.info('Custom protocol received')
  logger.info('Waiting for websocket connection before proceeding with deep link flow.')

  while (true) {
    const connected = yield* select(socketSelectors.isConnected)
    if (connected) {
      break
    }
    yield* delay(500)
  }

  logger.info('Continuing on deep link flow.')

  let data: InvitationData | null

  try {
    data = argvInvitationLink(code)
  } catch {
    logger.warn('Failed to parse custom protocol invitation')
    yield* put(
      modalsActions.openModal({
        name: ModalName.warningModal,
        args: {
          title: InvalidInvitationLinkError.TITLE,
          subtitle: InvalidInvitationLinkError.MESSAGE,
        },
      })
    )
    logger.warn('Failed processing custom protocol invitation')
    return
  }

  if (data === null) {
    logger.warn('Failed processing custom protocol invitation (parser returned null)')
    return
  }

  let isAlreadyConnected = false
  // TODO: Remove this once multiple communities are supported
  // Check if the user is already connected to a community
  const community = yield* select(communities.selectors.currentCommunity)
  if (community) {
    const currentIdentity = yield* select(identity.selectors.currentIdentity)
    if (currentIdentity && currentIdentity.communityId === community.id) {
      isAlreadyConnected = true
    }
  }

  logger.info('Checking if user is already connected to a community', isAlreadyConnected)

  // User already belongs to a community
  if (isAlreadyConnected) {
    logger.warn('Displaying error (user already belongs to a community).')
    yield* put(
      modalsActions.openModal({
        name: ModalName.warningModal,
        args: {
          title: AlreadyBelongToCommunityWarning.TITLE,
          subtitle: AlreadyBelongToCommunityWarning.MESSAGE,
        },
      })
    )
    logger.info('Returning because user already belongs to a community')
    return
  }

  if (isDeviceInvitationData(data)) {
    const payload: LinkDevicePayload = {
      inviteData: data,
    }
    logger.info('Dispatching link device action')
    yield* put(modalsActions.openModal({ name: ModalName.loadingPanel }))
    yield* put(communities.actions.linkDevice(payload))
    return
  }

  const payload: JoinCommunityPayload = {
    inviteData: data,
  }

  logger.info('Dispatching join community action')
  yield* put(communities.actions.joinCommunity(payload))
  yield* put(modalsActions.openModal({ name: ModalName.createUsernameModal }))
}
