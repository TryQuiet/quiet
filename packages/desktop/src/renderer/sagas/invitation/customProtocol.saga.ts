import { PayloadAction } from '@reduxjs/toolkit'
import { select, put, delay } from 'typed-redux-saga'
import { CommunityOwnership, CreateNetworkPayload, InvitationData, InvitationDataVersion } from '@quiet/types'
import { communities } from '@quiet/state-manager'
import { socketSelectors } from '../socket/socket.selectors'
import { ModalName } from '../modals/modals.types'
import { modalsActions } from '../modals/modals.slice'
import { argvInvitationCode } from '@quiet/common'
import {
  AlreadyBelongToCommunityWarning,
  InvalidInvitationLinkError,
  JoiningAnotherCommunityWarning,
} from '@quiet/common'
import _ from 'lodash'
import logger from '../../logger'
const log = logger('customProtocol')

export function* customProtocolSaga(
  action: PayloadAction<ReturnType<typeof communities.actions.customProtocol>['payload']>
): Generator {
  const code = action.payload
  log('Custom protocol', code)
  log('Waiting for websocket connection before proceeding with deep link flow.')

  while (true) {
    const connected = yield* select(socketSelectors.isConnected)
    if (connected) {
      break
    }
    yield* delay(500)
  }

  log('Continuing on deep link flow.')

  let data: InvitationData | null

  try {
    data = argvInvitationCode(code)
  } catch (e) {
    console.warn(e.message)
    yield* put(
      modalsActions.openModal({
        name: ModalName.warningModal,
        args: {
          title: InvalidInvitationLinkError.TITLE,
          subtitle: InvalidInvitationLinkError.MESSAGE,
        },
      })
    )
    return
  }

  if (data === null) {
    log(`Not processing invitation code ${code}`)
    return
  }

  const community = yield* select(communities.selectors.currentCommunity)

  const isAlreadyConnected = Boolean(community?.name)

  // User already belongs to a community
  if (isAlreadyConnected) {
    log('Displaying error (user already belongs to a community).')
    yield* put(
      modalsActions.openModal({
        name: ModalName.warningModal,
        args: {
          title: AlreadyBelongToCommunityWarning.TITLE,
          subtitle: AlreadyBelongToCommunityWarning.MESSAGE,
        },
      })
    )
    return
  }

  let isJoiningAnotherCommunity = false

  switch (data.version) {
    case InvitationDataVersion.v1:
      const storedPsk = yield* select(communities.selectors.psk)
      const currentPsk = data.psk
      isJoiningAnotherCommunity = Boolean(storedPsk && storedPsk !== currentPsk)
      break
    case InvitationDataVersion.v2:
      const inviteData = yield* select(communities.selectors.inviteData)
      isJoiningAnotherCommunity = Boolean(inviteData && !_.isEqual(inviteData, data))
      break
  }

  const connectingWithAnotherCommunity = isJoiningAnotherCommunity && !isAlreadyConnected

  if (connectingWithAnotherCommunity) {
    log('Displaying error (user is already connecting to another community).')
    yield* put(
      modalsActions.openModal({
        name: ModalName.warningModal,
        args: {
          title: JoiningAnotherCommunityWarning.TITLE,
          subtitle: JoiningAnotherCommunityWarning.MESSAGE,
        },
      })
    )

    return
  }

  const payload: CreateNetworkPayload = {
    ownership: CommunityOwnership.User,
    inviteData: data,
  }

  yield* put(communities.actions.createNetwork(payload))
}
