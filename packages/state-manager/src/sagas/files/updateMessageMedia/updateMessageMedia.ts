import { type PayloadAction } from '@reduxjs/toolkit'
import { select, put } from 'typed-redux-saga'
import { messagesSelectors } from '../../messages/messages.selectors'
import { messagesActions } from '../../messages/messages.slice'
import { type filesActions } from '../files.slice'
import { instanceOfChannelMessage, PROFILE_PHOTO_CHANNEL_ID, UserProfile } from '@quiet/types'
import { userProfileSelectors } from '../../users/userProfile/userProfile.selectors'
import { usersActions } from '../../users/users.slice'
import { createLogger } from '../../../utils/logger'

const logger = createLogger('updateMessageMedia')

export function* updateMessageMediaSaga(
  action: PayloadAction<ReturnType<typeof filesActions.updateMessageMedia>['payload']>
): Generator {
  if (action.payload.message.channelId === PROFILE_PHOTO_CHANNEL_ID) {
    logger.info('Updating profile photo attachment')
    const profiles = yield* select(userProfileSelectors.userProfiles)
    const updatedProfiles: UserProfile[] = []

    for (const profile of Object.values(profiles)) {
      if (profile.profilePhoto?.cid === action.payload.cid) {
        updatedProfiles.push({
          ...profile,
          profilePhoto: action.payload,
        })
      }
    }

    if (updatedProfiles.length > 0) {
      yield* put(usersActions.updateUserProfiles(updatedProfiles))
    }
    return
  }

  const channelMessages = yield* select(
    messagesSelectors.publicChannelMessagesEntities(action.payload.message.channelId)
  )

  const message = channelMessages[action.payload.message.id]
  if (!message || !instanceOfChannelMessage(message)) {
    logger.error(
      `Cannot update message media. Message ${action.payload.message.id} from #${action.payload.message.channelId} does not exist in local storage.`
    )
    return
  }

  yield* put(
    messagesActions.addMessages({
      messages: [
        {
          ...message,
          media: action.payload,
        },
      ],
      isVerified: true,
    })
  )
}
