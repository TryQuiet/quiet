import { type PayloadAction } from '@reduxjs/toolkit'
import { put } from 'typed-redux-saga'
import { type Socket } from '../../../types'
import { publicChannelsActions } from '../../publicChannels/publicChannels.slice'
import { communitiesActions } from '../communities.slice'

export function* saveCommunityMetadataSaga(
  socket: Socket,
  action: PayloadAction<ReturnType<typeof communitiesActions.saveCommunityMetadata>['payload']>
): Generator {
  console.log('save community metadata', action.payload)
  yield* put(
    communitiesActions.updateCommunity({
      rootCa: action.payload.rootCa,
    })
  )
  yield* put(
    communitiesActions.addOwnerCertificate({
      ownerCertificate: action.payload.ownerCertificate,
    })
  )

  yield* put(publicChannelsActions.sendUnregisteredInfoMessage())
}
