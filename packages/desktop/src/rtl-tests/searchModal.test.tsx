import React from 'react'
import '@testing-library/jest-dom/extend-expect'
import userEvent from '@testing-library/user-event'
import { act } from 'react-dom/test-utils'
import { fireEvent, screen } from '@testing-library/dom'
import { Task } from 'redux-saga'
import MockedSocket from 'socket.io-mock'
import { ioMock } from '../shared/setupTests'
import { renderComponent } from '../renderer/testUtils/renderComponent'
import { prepareStore } from '../renderer/testUtils/prepareStore'
import { apply } from 'typed-redux-saga'

import {
    getFactory,
    identity,
    publicChannels,
    communities,
    Identity,
    Store,
    MessageType,
    ChannelMessage,
    SocketActionTypes,
} from '@quiet/state-manager'

import { FactoryGirl } from 'factory-girl'
import SearchModal from '../renderer/components/SearchModal/SearchModal'
import { modalsActions } from '../renderer/sagas/modals/modals.slice'
import { ModalName } from '../renderer/sagas/modals/modals.types'
import { DateTime } from 'luxon'
import { type Community } from '@quiet/types'

jest.setTimeout(20_000)

jest.mock('electron', () => {
    return {
        ipcRenderer: { on: () => {}, send: jest.fn(), sendSync: jest.fn() },
        remote: {
            BrowserWindow: {
                getAllWindows: () => {
                    return [
                        {
                            show: jest.fn(),
                            isFocused: jest.fn(),
                        },
                    ]
                },
            },
        },
    }
})

describe('Switch channels', () => {
    let socket: MockedSocket

    let redux: {
        store: Store
        runSaga: (saga: any) => Task
    }
    let factory: FactoryGirl

    let community: Community
    let alice: Identity

    const channelFun = { name: 'fun', timestamp: 1673857606990 }
    const channelsMocks = [
        channelFun,
        { name: 'random', timestamp: 1673854900410 },
        { name: 'test', timestamp: 1673623514097 },
    ]

    beforeEach(async () => {
        socket = new MockedSocket()
        ioMock.mockImplementation(() => socket)
        window.ResizeObserver = jest.fn().mockImplementation(() => ({
            observe: jest.fn(),
            unobserve: jest.fn(),
            disconnect: jest.fn(),
        }))

        redux = await prepareStore({}, socket)
        factory = await getFactory(redux.store)

        community = await factory.create<ReturnType<typeof communities.actions.addNewCommunity>['payload']>('Community')

        alice = await factory.create<ReturnType<typeof identity.actions.addNewIdentity>['payload']>('Identity', {
            id: community.id,
            nickname: 'alice',
        })

        // Automatically create channels
        for (const channelMock of channelsMocks) {
            await factory.create<ReturnType<typeof publicChannels.actions.addChannel>['payload']>('PublicChannel', {
                channel: {
                    name: channelMock.name,
                    description: `Welcome to #${channelMock.name}`,
                    timestamp: channelMock.timestamp,
                    owner: alice.nickname,
                    id: channelMock.name,
                },
            })
        }
    })

    it('Select channel by writing name and pressing enter', async () => {
        renderComponent(
            <>
                <SearchModal />
            </>,
            redux.store
        )
        redux.store.dispatch(modalsActions.openModal({ name: ModalName.searchChannelModal }))

        const input = await screen.findByPlaceholderText('Channel name')
        await userEvent.type(input, channelFun.name)
        const tab = await screen.findByText('# fun')
        await userEvent.type(tab, '{ArrowDown}')
        await userEvent.type(tab, '{enter}')

        await act(async () => {})

        const currentChannel = publicChannels.selectors.currentChannel(redux.store.getState())

        expect(currentChannel?.name).toEqual(channelFun.name)
    })

    it('Select channel by writing name and clicking', async () => {
        renderComponent(
            <>
                <SearchModal />
            </>,
            redux.store
        )
        redux.store.dispatch(modalsActions.openModal({ name: ModalName.searchChannelModal }))

        const input = await screen.findByPlaceholderText('Channel name')
        await userEvent.type(input, channelFun.name)
        const tab = await screen.findByText('# fun')
        fireEvent.click(tab)

        await act(async () => {})

        const currentChannel = publicChannels.selectors.currentChannel(redux.store.getState())

        expect(currentChannel?.name).toEqual(channelFun.name)
    })

    it('Select most recent channel by clicking arrow down and enter', async () => {
        const CHANNEL_NAME = 'fun'
        renderComponent(
            <>
                <SearchModal />
            </>,
            redux.store
        )
        redux.store.dispatch(modalsActions.openModal({ name: ModalName.searchChannelModal }))

        await act(async () => {
            await userEvent.tab()

            await userEvent.keyboard('[ArrowDown]')
            await userEvent.keyboard('[Enter]')
        })

        const currentChannel = publicChannels.selectors.currentChannel(redux.store.getState())

        expect(currentChannel?.name).toEqual(CHANNEL_NAME)
    })

    it('Close by hitting escape', async () => {
        renderComponent(
            <>
                <SearchModal />
            </>,
            redux.store
        )
        redux.store.dispatch(modalsActions.openModal({ name: ModalName.searchChannelModal }))

        const text = await screen.findByText('recent channels')
        expect(text).toBeVisible()
        await userEvent.type(text, '{escape}')
        expect(text).not.toBeVisible()
    })

    it('Should render proper UI for state with unread message on channels and allow to switch by pressing enter', async () => {
        const messages: ChannelMessage[] = []
        const message = (
            await factory.build<typeof publicChannels.actions.test_message>('Message', {
                identity: alice,
                message: {
                    id: Math.random().toString(36).substr(2.9),
                    type: MessageType.Basic,
                    message: 'message',
                    createdAt: DateTime.utc().valueOf(),
                    channelId: 'fun',
                    signature: '',
                    pubKey: '',
                },
                verifyAutomatically: true,
            })
        ).payload.message
        messages.push(message)

        renderComponent(
            <>
                <SearchModal />
            </>,
            redux.store
        )

        await act(async () => {
            await redux.runSaga(mockIncomingMessages).toPromise()
        })

        redux.store.dispatch(modalsActions.openModal({ name: ModalName.searchChannelModal }))

        const text = await screen.findByText('unread messages')
        expect(text).toBeVisible()

        const funChannel = await screen.findByText('# fun')
        expect(funChannel).toBeVisible()

        await userEvent.type(funChannel, '{enter}')

        const currentChannel = publicChannels.selectors.currentChannel(redux.store.getState())

        expect(currentChannel?.name).toEqual('fun')

        function* mockIncomingMessages(): Generator {
            yield* apply(socket.socketClient, socket.socketClient.emit, [
                SocketActionTypes.INCOMING_MESSAGES,
                {
                    messages: [message],
                    communityId: community.id,
                    isVerified: true,
                },
            ])
        }
    })
})
