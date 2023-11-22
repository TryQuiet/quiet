import React from 'react'
import '@testing-library/jest-dom/extend-expect'
import { screen } from '@testing-library/dom'
import { prepareStore } from '../renderer/testUtils/prepareStore'
import { renderComponent } from '../renderer/testUtils'
import MockedSocket from 'socket.io-mock'
import { ioMock } from '../shared/setupTests'
import { communities, identity, Identity } from '@quiet/state-manager'
import { modalsActions } from '../renderer/sagas/modals/modals.slice'
import { ModalName } from '../renderer/sagas/modals/modals.types'
import JoinCommunity from '../renderer/components/CreateJoinCommunity/JoinCommunity/JoinCommunity'
import CreateUsername from '../renderer/components/CreateUsername/CreateUsername'
import { type Community, type InvitationData } from '@quiet/types'

jest.setTimeout(20_000)

describe('Opening app through custom protocol', () => {
    let socket: MockedSocket

    const id = '00d045ab'

    const community: Community = {
        id: id,
        name: '',
        CA: {
            rootCertString: '',
            rootKeyString: '',
        },
        rootCa: '',
        peerList: [],
        registrar: {
            privateKey: '',
            address: '',
        },
        registrarUrl: 'https://bidrmzr3ee6qa2vvrlcnqvvvsk2gmjktcqkunba326parszr44gibwyd.onion',
        onionAddress: '',
        privateKey: '',
        port: 0,
        registrationAttempts: 0,
        ownerCertificate: '',
    }

    const _identity: Partial<Identity> = {
        id: id,
        nickname: '',
        userCsr: null,
        userCertificate: null,
        joinTimestamp: 0,
    }

    beforeEach(() => {
        socket = new MockedSocket()
        ioMock.mockImplementation(() => socket)

        window.ResizeObserver = jest.fn().mockImplementation(() => ({
            observe: jest.fn(),
            unobserve: jest.fn(),
            disconnect: jest.fn(),
        }))
    })

    it('goes directly to the username registration step', async () => {
        const { store } = await prepareStore(
            {},
            socket // Fork state manager's sagas
        )

        const invitationCodes: InvitationData = {
            pairs: [{ peerId: 'abcdef', onionAddress: 'bidrmzr3ee6qa2vvrlcnqvvvsk2gmjktcqkunba326parszr44gibwyd' }],
            psk: '12345',
        }

        store.dispatch(communities.actions.customProtocol(invitationCodes))

        store.dispatch(modalsActions.openModal({ name: ModalName.joinCommunityModal }))

        renderComponent(
            <>
                <JoinCommunity />
                <CreateUsername />
            </>,
            store
        )

        store.dispatch(communities.actions.addNewCommunity(community))
        store.dispatch(communities.actions.setCurrentCommunity(community.id))

        // @ts-expect-error
        store.dispatch(identity.actions.addNewIdentity(_identity))

        // Confirm user is being redirected to username registration
        const createUsernameTitle = await screen.findByText('Register a username')
        expect(createUsernameTitle).toBeVisible()
    })
})
