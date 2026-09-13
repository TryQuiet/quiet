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
        linkedDevices={[]}
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
})
