import { PayloadAction } from '@reduxjs/toolkit'
import { put } from 'typed-redux-saga'
import { identityActions } from '../identity.slice'
import { Socket } from '../../../types'
import { createLogger } from '../../../utils/logger'

const logger = createLogger('registerUsernameSaga')

export function* registerUsernameSaga(
  socket: Socket,
  action: PayloadAction<ReturnType<typeof identityActions.registerUsername>['payload']>
): Generator {
  logger.info('Registering username', action.payload.nickname)

  const { nickname, isUsernameTaken = false } = action.payload
  yield* put(identityActions.setUsername(nickname))
  logger.info('Username registered')
}
