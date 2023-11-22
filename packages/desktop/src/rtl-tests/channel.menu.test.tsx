import React from 'react'
import '@testing-library/jest-dom/extend-expect'
import { screen } from '@testing-library/dom'
import userEvent from '@testing-library/user-event'
import MockedSocket from 'socket.io-mock'
import { ioMock } from '../shared/setupTests'
import { renderComponent } from '../renderer/testUtils/renderComponent'
import { prepareStore } from '../renderer/testUtils/prepareStore'
import Channel from '../renderer/components/Channel/Channel'
import ChannelContextMenu from '../renderer/components/ContextMenu/menus/ChannelContextMenu.container'
import DeleteChannel from '../renderer/components/Channel/DeleteChannel/DeleteChannel'
import { identity, getFactory, communities } from '@quiet/state-manager'
import { navigationActions } from '../renderer/store/navigation/navigation.slice'
import { MenuName } from '../const/MenuNames.enum'

jest.setTimeout(20_000)

describe('Channel menu', () => {
    let socket: MockedSocket

    beforeEach(() => {
        socket = new MockedSocket()
        ioMock.mockImplementation(() => socket)
        window.ResizeObserver = jest.fn().mockImplementation(() => ({
            observe: jest.fn(),
            unobserve: jest.fn(),
            disconnect: jest.fn(),
        }))
    })

    it('hides channel deletion for non-owners', async () => {
        const { store } = await prepareStore(
            {},
            socket // Fork state manager's sagas
        )

        const factory = await getFactory(store)

        await factory.create<ReturnType<typeof communities.actions.addNewCommunity>['payload']>('Community', {
            id: '0',
            name: 'community',
            CA: null,
            registrarUrl: 'http://ugmx77q2tnm5fliyfxfeen5hsuzjtbsz44tsldui2ju7vl5xj4d447yd.onion',
            rootCa: '',
            peerList: [],
        })

        /* Context menu is not visible to non-owners at all, for now */
        store.dispatch(navigationActions.openMenu({ menu: MenuName.Channel }))

        window.HTMLElement.prototype.scrollTo = jest.fn()

        renderComponent(
            <>
                <Channel />
                <ChannelContextMenu />
            </>,
            store
        )

        /* Context menu is not visible to non-owners at all, for now */

        // const menu = screen.getByTestId('channelContextMenuButton')
        // expect(menu).toBeVisible()

        // await userEvent.click(menu)

        const channelContextMenu = screen.getByTestId('contextMenu')
        expect(channelContextMenu).toBeVisible()

        const deleteChannelItem = screen.queryByTestId('contextMenuItemDelete')
        expect(deleteChannelItem).not.toBeInTheDocument()
    })

    it('deletes channel', async () => {
        const { store } = await prepareStore(
            {},
            socket // Fork state manager's sagas
        )

        const factory = await getFactory(store)

        const community =
            await factory.create<ReturnType<typeof communities.actions.addNewCommunity>['payload']>('Community')

        await factory.create<ReturnType<typeof identity.actions.addNewIdentity>['payload']>('Identity', {
            id: community.id,
            nickname: 'alice',
        })

        window.HTMLElement.prototype.scrollTo = jest.fn()

        renderComponent(
            <>
                <Channel />
                <ChannelContextMenu />
                <DeleteChannel />
            </>,
            store
        )

        const menu = screen.getByTestId('channelContextMenuButton')
        expect(menu).toBeVisible()

        await userEvent.click(menu)

        // Confirm context menu has opened
        const deleteChannelItem = screen.getByTestId('contextMenuItemDelete')
        expect(deleteChannelItem).toBeVisible()

        await userEvent.click(deleteChannelItem)

        // Confirm context menu hides automatically
        const channelContextMenu = screen.getByTestId('contextMenu')
        expect(channelContextMenu).not.toBeVisible()

        // Confirm confirmation modal pops up
        const deleteChannelModal = await screen.findByText('Are you sure?')
        expect(deleteChannelModal).toBeVisible()
    })
})
