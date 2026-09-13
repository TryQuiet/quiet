import React from 'react'
import '@testing-library/jest-dom/extend-expect'
import { screen, waitFor } from '@testing-library/dom'
import userEvent from '@testing-library/user-event'

import { renderComponent } from '../../testUtils/renderComponent'
import { DISPLAY_QR_CODE_COPY, DisplayQrCodeComponent } from './DisplayQrCodeComponent'

const deviceLink = 'https://tryquiet.org/join#device-link'

describe('DisplayQrCodeComponent', () => {
  it('draws the QR code in the box with the sheet copy, Copy link and Reset QR code, and never the raw link', () => {
    renderComponent(<DisplayQrCodeComponent deviceLink={deviceLink} isLoading={false} onReset={jest.fn()} />)

    expect(screen.getByTestId('display-qr-code-box')).toBeVisible()
    expect(screen.getByTestId('display-qr-code-box').querySelector('svg')).not.toBeNull()
    expect(screen.getByText(DISPLAY_QR_CODE_COPY.scan)).toBeVisible()
    expect(screen.getByTestId('copy-device-link')).toHaveTextContent(DISPLAY_QR_CODE_COPY.copyLink)
    expect(screen.getByTestId('reset-qr-code')).toHaveTextContent(DISPLAY_QR_CODE_COPY.reset)
    expect(screen.queryByText(deviceLink)).not.toBeInTheDocument()
    expect(document.querySelector('input')).toBeNull()
  })

  it('Copy link puts the link on the clipboard and confirms', async () => {
    const write = jest.fn()
    Object.assign(navigator, { clipboard: { writeText: write } })
    document.execCommand = jest.fn(() => true)
    renderComponent(<DisplayQrCodeComponent deviceLink={deviceLink} isLoading={false} onReset={jest.fn()} />)

    await userEvent.click(screen.getByTestId('copy-device-link'))
    expect(await screen.findByText(DISPLAY_QR_CODE_COPY.copied)).toBeVisible()
    expect(document.execCommand).toHaveBeenCalledWith('copy')
    await waitFor(() => expect(screen.queryByText(DISPLAY_QR_CODE_COPY.copied)).not.toBeInTheDocument(), {
      timeout: 4000,
    })
  })

  it('Reset QR code calls back', async () => {
    const onReset = jest.fn()
    renderComponent(<DisplayQrCodeComponent deviceLink={deviceLink} isLoading={false} onReset={onReset} />)

    await userEvent.click(screen.getByTestId('reset-qr-code'))
    expect(onReset).toHaveBeenCalledTimes(1)
  })

  it('while the link is minted the actions give way to the progress bar with the status line', () => {
    renderComponent(<DisplayQrCodeComponent deviceLink='' isLoading onReset={jest.fn()} />)

    expect(screen.getByTestId('display-qr-code-progress')).toBeVisible()
    expect(screen.getByRole('status')).toHaveTextContent(DISPLAY_QR_CODE_COPY.generating)
    expect(screen.getByRole('progressbar')).toBeVisible()
    expect(screen.queryByTestId('copy-device-link')).not.toBeInTheDocument()
    expect(screen.queryByTestId('reset-qr-code')).not.toBeInTheDocument()
  })

  it('without a link and nothing being minted the box says the link is unavailable and no action is drawn', () => {
    renderComponent(<DisplayQrCodeComponent deviceLink='' isLoading={false} onReset={jest.fn()} />)

    expect(screen.getByTestId('display-qr-code-status')).toHaveTextContent(DISPLAY_QR_CODE_COPY.unavailable)
    expect(screen.queryByTestId('display-qr-code-progress')).not.toBeInTheDocument()
    expect(screen.queryByTestId('copy-device-link')).not.toBeInTheDocument()
    expect(screen.queryByTestId('reset-qr-code')).not.toBeInTheDocument()
  })
})
