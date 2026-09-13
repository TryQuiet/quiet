import { type PayloadAction } from '@reduxjs/toolkit'
import { delay, put, select } from 'typed-redux-saga'

import { type DeviceLinkInvite } from '@quiet/types'

import { connectionSelectors } from '../connection.selectors'
import { connectionActions } from '../connection.slice'

export function* expireDeviceLinkSaga(action: PayloadAction<DeviceLinkInvite | undefined>): Generator {
  const deviceLinkInvite = action.payload
  if (!deviceLinkInvite) return

  yield* delay(Math.max(0, deviceLinkInvite.expiresAt - Date.now()))

  const activeInvite = yield* select(connectionSelectors.deviceLinkInvite)
  if (activeInvite?.id !== deviceLinkInvite.id || activeInvite.expiresAt !== deviceLinkInvite.expiresAt) return

  yield* put(connectionActions.setDeviceLinkInvite(undefined))
}
