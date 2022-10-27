import { setupCrypto } from '@quiet/identity'
import { FactoryGirl } from 'factory-girl'
import { DateTime } from 'luxon'
import { Store } from 'redux'
import { getFactory } from '../../utils/tests/factories'
import { prepareStore } from '../../utils/tests/prepareStore'

import { communitiesActions, Community } from '../communities/communities.slice'
import { identityActions } from '../identity/identity.slice'
import { Identity } from '../identity/identity.types'
import { publicChannelsActions } from '../publicChannels/publicChannels.slice'
import { ChannelMessage } from '../publicChannels/publicChannels.types'
import { validCurrentPublicChannelMessagesEntries } from './messages.selectors'
import { messagesActions } from './messages.slice'
import { MessagesTransform } from './messages.transform'
import { MessageType } from './messages.types'

describe('messages transform', () => {
    let store: Store
    let factory: FactoryGirl
    let community: Community
    let alice: Identity
    let message: ChannelMessage
    let messageStatusWithWrongKeyName: any

    beforeAll(async () => {
        setupCrypto()

        store = prepareStore().store

        factory = await getFactory(store)

        community = await factory.create<
            ReturnType<typeof communitiesActions.addNewCommunity>['payload']
        >('Community')

        alice = await factory.create<ReturnType<typeof identityActions.addNewIdentity>['payload']>(
            'Identity',
            { id: community.id, nickname: 'alice' }
        )

        message = (
            await factory.build<typeof publicChannelsActions.test_message>('Message', {
                identity: alice,
                message: {
                    id: Math.random().toString(36).substr(2.9),
                    type: MessageType.Basic,
                    message: 'message',
                    createdAt: DateTime.utc().valueOf(),
                    channelAddress: 'general',
                    signature: '',
                    pubKey: ''
                },
                verifyAutomatically: false
            })
        ).payload.message

        messageStatusWithWrongKeyName = {
            publicKey: message.pubKey,
            signature: message.signature,
            verified: true
        }

        store.dispatch(
            messagesActions.incomingMessages({
                messages: [message],
                isVerified: true
            })
        )
    })

    test('message with old verification format is not valid, when is not transformed', async () => {
        // Add message status with wrong key name
        store.dispatch(
            messagesActions.addMessageVerificationStatus(messageStatusWithWrongKeyName)
        )

        const validMessage = validCurrentPublicChannelMessagesEntries(store.getState())
            .find((item)=> item.id === message.id)
        
        // Expect there is no valid message
        expect(validMessage).not.toBeDefined()
    })


    test('message with old verification format is valid, after transform', async () => {
        // Add message status with wrong key name
        store.dispatch(
            messagesActions.addMessageVerificationStatus(messageStatusWithWrongKeyName)
        )

        // Transform messages and replace new reducer
        const messages = MessagesTransform.out(store.getState().Messages, 'Files', {})
        store.replaceReducer((storeState) => {
            return { ...storeState, Messages: messages }
        })

        const validMessage = validCurrentPublicChannelMessagesEntries(store.getState())
            .find((item)=> item.id === message.id)

        // Expect there is valid message
        expect(validMessage).toBeDefined()
    })
})
