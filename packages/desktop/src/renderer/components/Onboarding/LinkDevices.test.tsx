import React from 'react'
import '@testing-library/jest-dom/extend-expect'
import { screen } from '@testing-library/dom'
import userEvent from '@testing-library/user-event'

import { renderComponent } from '../../testUtils/renderComponent'
import { prepareStore } from '../../testUtils/prepareStore'
import { StoreKeys } from '../../store/store.keys'
import { SocketState } from '../../sagas/socket/socket.slice'
import { ModalName } from '../../sagas/modals/modals.types'
import { ModalsInitialState } from '../../sagas/modals/modals.slice'
import LinkDevices from './LinkDevices'

const openLinkDevices = {
  [StoreKeys.Socket]: {
    ...new SocketState(),
    isConnected: true,
  },
  [StoreKeys.Modals]: {
    ...new ModalsInitialState(),
    [ModalName.linkDevicesModal]: { open: true },
  },
}

/**
 * The prototype draws these three frames with titled bars (2811:2575, 2811:2601,
 * 2811:2587), but each one repeats that title as its own large heading, and a
 * page with a heading gets no bar title. The bar zone stays for the back glyph.
 */
describe('Link devices — no bar title above a heading', () => {
  const header = () => screen.getByTestId('linkDevicesModalActions').closest('.Modalheader')

  it('shows the heading and only the back glyph on every step', async () => {
    const { store } = await prepareStore(openLinkDevices)
    renderComponent(<LinkDevices />, store)

    // entry (2811:2575)
    expect(screen.getByRole('heading', { name: 'Link devices', level: 3 })).toBeVisible()
    expect(screen.getAllByText('Link devices')).toHaveLength(1)
    expect(header()).not.toHaveClass('Modalnone')
    expect(header()).not.toHaveClass('ModalheaderBorder')
    expect(screen.getByTestId('linkDevicesModalBack')).toBeVisible()

    // scan (2811:2587): the bar would have said "Scan QR code"; the heading does
    await userEvent.click(screen.getByTestId('link-devices-scan-qr'))
    expect(await screen.findByRole('heading', { name: 'Scan QR code', level: 3 })).toBeVisible()
    expect(screen.getAllByText('Scan QR code')).toHaveLength(1)
    expect(header()).not.toHaveClass('ModalheaderBorder')
    expect(screen.getByTestId('linkDevicesModalBack')).toBeVisible()

    // back to entry, then display (2811:2601): the bar would have said "QR code"
    await userEvent.click(screen.getByTestId('linkDevicesModalBack'))
    await userEvent.click(await screen.findByTestId('link-devices-display-qr'))
    expect(await screen.findByTestId('link-devices-display')).toBeVisible()
    expect(screen.queryByText('QR code')).not.toBeInTheDocument()
    expect(header()).not.toHaveClass('ModalheaderBorder')
  })
})
