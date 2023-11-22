import React from 'react'
import '@testing-library/jest-dom/extend-expect'
import { screen } from '@testing-library/dom'
import { renderComponent } from '../../../testUtils/renderComponent'
import { prepareStore } from '../../../testUtils/prepareStore'
import { StoreKeys } from '../../../store/store.keys'
import { SocketState } from '../../../sagas/socket/socket.slice'
import SentryWarning from '../../../containers/widgets/sentryWarning/sentryWarning'

describe('Sentry warning modal', () => {
    let oldEnv: NodeJS.ProcessEnv

    beforeEach(() => {
        oldEnv = process.env
        process.env = { ...oldEnv }
    })

    afterEach(() => {
        process.env = oldEnv
    })

    it('is visible if sentry is enabled', async () => {
        process.env.TEST_MODE = 'true'

        const { store } = await prepareStore({
            [StoreKeys.Socket]: {
                ...new SocketState(),
                isConnected: true,
            },
        })

        renderComponent(
            <>
                <SentryWarning />
            </>,
            store
        )
        const warningText = await screen.findByText('App is running in debug mode')
        expect(warningText).toBeVisible()
    })

    it('is not visible if sentry is not enabled', async () => {
        const { store } = await prepareStore({
            [StoreKeys.Socket]: {
                ...new SocketState(),
                isConnected: true,
            },
        })

        renderComponent(
            <>
                <SentryWarning />
            </>,
            store
        )
        const warningText = await screen.queryByText('App is running in debug mode')
        expect(warningText).toBeNull()
    })
})
