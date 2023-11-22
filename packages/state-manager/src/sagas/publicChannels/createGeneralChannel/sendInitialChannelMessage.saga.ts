import { type PayloadAction } from '@reduxjs/toolkit'
import { put, select, call } from 'typed-redux-saga'
import { messagesActions } from '../../messages/messages.slice'
import { publicChannelsSelectors } from '../publicChannels.selectors'
import { publicChannelsActions } from '../publicChannels.slice'
import { MessageType, type WriteMessagePayload } from '@quiet/types'
import { identitySelectors } from '../../identity/identity.selectors'
import { generalChannelDeletionMessage, userCreatedChannelMessage } from '@quiet/common'

export function* sendInitialChannelMessageSaga(
    action: PayloadAction<ReturnType<typeof publicChannelsActions.sendInitialChannelMessage>['payload']>
): Generator {
    const { channelName, channelId } = action.payload
    const generalChannel = yield* select(publicChannelsSelectors.generalChannel)
    if (!generalChannel) return
    const isGeneral = channelId === generalChannel.id

    const pendingGeneralChannelRecreation = yield* select(publicChannelsSelectors.pendingGeneralChannelRecreation)

    const user = yield* select(identitySelectors.currentIdentity)

    const message =
        pendingGeneralChannelRecreation && isGeneral
            ? yield* call(generalChannelDeletionMessage, user?.nickname || '')
            : yield* call(userCreatedChannelMessage, user?.nickname || '', channelName)

    const payload: WriteMessagePayload = {
        type: MessageType.Info,
        message,
        channelId,
    }

    if (isGeneral) {
        yield* put(publicChannelsActions.finishGeneralRecreation())
    }

    yield* put(messagesActions.sendMessage(payload))
}
