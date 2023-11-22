import { setupCrypto } from '@quiet/identity'
import { type Store } from '../../store.types'
import { getFactory, MessageType } from '../../..'
import { prepareStore, reducers } from '../../../utils/tests/prepareStore'
import { combineReducers } from '@reduxjs/toolkit'
import { expectSaga } from 'redux-saga-test-plan'
import { type Socket } from 'socket.io-client'
import { type communitiesActions } from '../../communities/communities.slice'
import { type identityActions } from '../../identity/identity.slice'
import { type FactoryGirl } from 'factory-girl'
import { type publicChannelsActions } from '../../publicChannels/publicChannels.slice'
import { DateTime } from 'luxon'
import { messagesActions } from '../../messages/messages.slice'
import {
    type Community,
    type FileMetadata,
    type Identity,
    type PublicChannel,
    SocketActionTypes,
    ChannelMessage,
    SendingStatus,
} from '@quiet/types'
import { generateChannelId } from '@quiet/common'
import { currentChannelId } from '../../publicChannels/publicChannels.selectors'
import { uploadFileSaga } from './uploadFile.saga'

describe('uploadFileSaga', () => {
    let store: Store
    let factory: FactoryGirl

    let community: Community
    let alice: Identity

    let sailingChannel: PublicChannel

    let message: ChannelMessage

    let media: FileMetadata

    beforeEach(async () => {
        setupCrypto()

        store = prepareStore().store

        factory = await getFactory(store)

        community = await factory.create<ReturnType<typeof communitiesActions.addNewCommunity>['payload']>('Community')

        alice = await factory.create<ReturnType<typeof identityActions.addNewIdentity>['payload']>('Identity', {
            id: community.id,
            nickname: 'alice',
        })

        sailingChannel = (
            await factory.create<ReturnType<typeof publicChannelsActions.addChannel>['payload']>('PublicChannel', {
                channel: {
                    name: 'comics',
                    description: 'Welcome to #comics',
                    timestamp: DateTime.utc().valueOf(),
                    owner: alice.nickname,
                    id: generateChannelId('comics'),
                },
            })
        ).channel

        const messageId = Math.random().toString(36).substr(2.9)

        media = {
            cid: `uploading_${messageId}`,
            path: 'temp/name.ext',
            name: 'name',
            ext: 'ext',
            message: {
                id: messageId,
                channelId: sailingChannel.id,
            },
        }

        message = (
            await factory.create<ReturnType<typeof publicChannelsActions.test_message>['payload']>('Message', {
                identity: alice,
                message: {
                    id: messageId,
                    type: MessageType.Basic,
                    message: 'message',
                    createdAt: 99999999999999,
                    channelId: sailingChannel.id,
                    signature: '',
                    pubKey: '',
                    media: media,
                },
                verifyAutomatically: true,
            })
        ).message
    })

    test('should upload file while message is being saved to db', async () => {
        const socket = { emit: jest.fn() } as unknown as Socket

        const currentChannel = currentChannelId(store.getState())

        if (!currentChannel) throw new Error('no current channel id')

        const peerId = alice.peerId.id

        const reducer = combineReducers(reducers)
        await expectSaga(
            uploadFileSaga,
            socket,
            messagesActions.addMessagesSendingStatus({ message, status: SendingStatus.Pending })
        )
            .withReducer(reducer)
            .withState(store.getState())
            .apply(socket, socket.emit, [
                SocketActionTypes.UPLOAD_FILE,
                {
                    file: media,
                    peerId,
                },
            ])
            .run()
    })

    test('should not upload file if message has no media', async () => {
        const socket = { emit: jest.fn() } as unknown as Socket

        const currentChannel = currentChannelId(store.getState())

        if (!currentChannel) throw new Error('no current channel id')

        const peerId = alice.peerId.id

        const messageWithoutMedia = {
            ...message,
            media: undefined,
        }

        const reducer = combineReducers(reducers)
        await expectSaga(
            uploadFileSaga,
            socket,
            messagesActions.addMessagesSendingStatus({ message: messageWithoutMedia, status: SendingStatus.Pending })
        )
            .withReducer(reducer)
            .withState(store.getState())
            .not.apply(socket, socket.emit, [
                SocketActionTypes.UPLOAD_FILE,
                {
                    file: media,
                    peerId,
                },
            ])
            .run()
    })
})
