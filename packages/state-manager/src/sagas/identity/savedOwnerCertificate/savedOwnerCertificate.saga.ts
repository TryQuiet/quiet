import { type Socket, applyEmitParams } from '../../../types'
import { select, apply } from 'typed-redux-saga'
import { type PayloadAction } from '@reduxjs/toolkit'
import { type identityActions } from '../identity.slice'
import { communitiesSelectors } from '../../communities/communities.selectors'
import { identitySelectors } from '../identity.selectors'
import { type InitCommunityPayload, SocketActionTypes } from '@quiet/types'

export function* savedOwnerCertificateSaga(
  socket: Socket,
  action: PayloadAction<ReturnType<typeof identityActions.savedOwnerCertificate>['payload']>
): Generator {
  // TODO: Remove?
}
