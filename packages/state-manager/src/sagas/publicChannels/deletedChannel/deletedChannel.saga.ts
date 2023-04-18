import { publicChannelsActions } from '../publicChannels.slice'
import { PayloadAction } from '@reduxjs/toolkit'
import { SocketActionTypes } from '../../socket/const/actionTypes'

import logger from '../../../utils/logger'
const log = logger('publicChannels')

export function* deletedChannelSaga(
  action: PayloadAction<ReturnType<typeof publicChannelsActions.deletedChannel>['payload']>
): Generator {
  log(`Deleted channel ${action.payload.channel} saga`)
  // clean redux
}
