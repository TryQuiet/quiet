import { all, takeEvery, cancelled } from 'typed-redux-saga'
import { type Socket } from '../../types'
import { reactionsActions } from './reactions.slice'
import { messagesActions } from '../messages/messages.slice'
import { sendReactionSaga } from './sendReaction/sendReaction.saga'
import { extractReactionsSaga } from './extractReactions/extractReactions.saga'
import { createLogger } from '../../utils/logger'

const logger = createLogger('reactionsMasterSaga')

export function* reactionsMasterSaga(socket: Socket): Generator {
  logger.info('reactionsMasterSaga starting')
  try {
    yield all([
      takeEvery(reactionsActions.sendReaction.type, sendReactionSaga, socket),
      // Intercept incoming messages and extract reaction entries
      takeEvery(messagesActions.addMessages.type, extractReactionsSaga),
    ])
  } finally {
    logger.info('reactionsMasterSaga stopping')
    if (yield cancelled()) {
      logger.info('reactionsMasterSaga cancelled')
    }
  }
}
