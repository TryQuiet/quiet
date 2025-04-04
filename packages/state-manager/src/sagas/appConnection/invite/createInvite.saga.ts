import { apply, select, putResolve, delay } from 'typed-redux-saga'
import { type PayloadAction } from '@reduxjs/toolkit'
import { InviteResult } from '@localfirst/auth'

import { SocketActions } from '@quiet/types'

import { applyEmitParams, type Socket } from '../../../types'
import { connectionActions } from '../connection.slice'
import { connectionSelectors } from '../connection.selectors'
import { createLogger } from '../../../utils/logger'

const logger = createLogger('connection:invite:createInvite')

export function* createInviteSaga(
  socket: Socket,
  action: PayloadAction<ReturnType<typeof connectionActions.createInvite>['payload']>
): Generator {
  const existingLongLivedInvite: InviteResult | undefined = yield* select(connectionSelectors.longLivedInvite)
  const lfaInviteData: { valid: boolean; newInvite?: InviteResult } | undefined = yield* apply(
    socket,
    socket.emitWithAck,
    applyEmitParams(SocketActions.VALIDATE_OR_CREATE_LONG_LIVED_LFA_INVITE, { id: existingLongLivedInvite?.id })
  )
  if (!lfaInviteData?.valid && lfaInviteData?.newInvite != null) {
    yield* putResolve(connectionActions.setLongLivedInvite(lfaInviteData.newInvite))
  } else if (!lfaInviteData?.valid && lfaInviteData?.newInvite == null) {
    yield* putResolve(connectionActions.setLongLivedInvite(undefined))
  }
}
