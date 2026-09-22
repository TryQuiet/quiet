import React from 'react'
import '@testing-library/jest-dom/extend-expect'
import { screen } from '@testing-library/dom'
import userEvent from '@testing-library/user-event'

import { renderComponent } from '../../testUtils/renderComponent'
import { LinkDevicesComponent } from './LinkDevicesComponent'

describe('LinkDevicesComponent', () => {
  it('share: Display QR code and Copy link only; Copy link puts the link on the clipboard and reports it', async () => {
    document.execCommand = jest.fn(() => true)
    const onDisplayQrCode = jest.fn()
    const onLinkCopied = jest.fn()
    renderComponent(
      <LinkDevicesComponent
        direction='share'
        onDisplayQrCode={onDisplayQrCode}
        deviceLink={'https://tryquiet.org/join#device-link'}
        onLinkCopied={onLinkCopied}
      />
    )

    expect(screen.getByTestId('link-devices-display-qr')).toBeVisible()
    expect(screen.getByTestId('link-devices-copy-link')).toHaveTextContent('Copy link')
    expect(screen.queryByTestId('link-devices-scan-qr')).not.toBeInTheDocument()
    expect(screen.queryByTestId('link-devices-paste-link')).not.toBeInTheDocument()
    expect(screen.queryByText('https://tryquiet.org/join#device-link')).not.toBeInTheDocument()

    await userEvent.click(screen.getByTestId('link-devices-copy-link'))
    expect(document.execCommand).toHaveBeenCalledWith('copy')
    expect(onLinkCopied).toHaveBeenCalledTimes(1)

    await userEvent.click(screen.getByTestId('link-devices-display-qr'))
    expect(onDisplayQrCode).toHaveBeenCalledTimes(1)
  })

  it('share without a link yet: Copy link asks for one instead of copying', async () => {
    document.execCommand = jest.fn(() => true)
    const onCopyLink = jest.fn()
    const onLinkCopied = jest.fn()
    renderComponent(<LinkDevicesComponent direction='share' onCopyLink={onCopyLink} onLinkCopied={onLinkCopied} />)

    await userEvent.click(screen.getByTestId('link-devices-copy-link'))
    expect(onCopyLink).toHaveBeenCalledTimes(1)
    expect(onLinkCopied).not.toHaveBeenCalled()
    expect(document.execCommand).not.toHaveBeenCalled()
  })

  it('receive: Scan QR code and Paste link only', async () => {
    const onScanQrCode = jest.fn()
    const onPasteLink = jest.fn()
    renderComponent(<LinkDevicesComponent direction='receive' onScanQrCode={onScanQrCode} onPasteLink={onPasteLink} />)

    expect(screen.queryByTestId('link-devices-display-qr')).not.toBeInTheDocument()
    expect(screen.queryByTestId('link-devices-copy-link')).not.toBeInTheDocument()
    await userEvent.click(screen.getByTestId('link-devices-scan-qr'))
    await userEvent.click(screen.getByTestId('link-devices-paste-link'))
    expect(onScanQrCode).toHaveBeenCalledTimes(1)
    expect(onPasteLink).toHaveBeenCalledTimes(1)
  })

  /**
   * The frames draw a "Linked devices" list under the rows. It is not built on this line: the
   * backend that would enumerate a user's devices was dropped (TryQuiet/quiet#3636), and a card
   * that always read "No linked devices" would be false the moment a device was linked.
   */
  it('draws no device list in either direction', () => {
    const { unmount } = renderComponent(
      <LinkDevicesComponent direction='share' onDisplayQrCode={jest.fn()} deviceLink={'x'} onLinkCopied={jest.fn()} />
    )
    expect(screen.queryByTestId('linked-devices-list')).not.toBeInTheDocument()
    expect(screen.queryByTestId('no-linked-devices')).not.toBeInTheDocument()
    unmount()

    renderComponent(<LinkDevicesComponent direction='receive' onScanQrCode={jest.fn()} onPasteLink={jest.fn()} />)
    expect(screen.queryByTestId('linked-devices-list')).not.toBeInTheDocument()
    expect(screen.queryByTestId('no-linked-devices')).not.toBeInTheDocument()
  })
})
