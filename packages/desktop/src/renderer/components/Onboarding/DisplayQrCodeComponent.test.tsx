import React from 'react'
import '@testing-library/jest-dom/extend-expect'
import { screen } from '@testing-library/dom'

import { renderComponent } from '../../testUtils/renderComponent'
import { DISPLAY_QR_CODE_COPY, DisplayQrCodeComponent, QR_BOX_SIZE } from './DisplayQrCodeComponent'

const deviceLink = 'https://tryquiet.org/join#device-link'

describe('DisplayQrCodeComponent', () => {
  it('draws the QR code in the box with the sheet copy, no action, and never the raw link', () => {
    renderComponent(<DisplayQrCodeComponent deviceLink={deviceLink} isLoading={false} />)

    expect(screen.getByTestId('display-qr-code-box')).toBeVisible()
    expect(screen.getByTestId('display-qr-code-box').querySelector('svg')).not.toBeNull()
    expect(screen.getByText(DISPLAY_QR_CODE_COPY.scan)).toBeVisible()
    expect(screen.getByTestId('display-qr-code-security')).toHaveTextContent(DISPLAY_QR_CODE_COPY.security)
    // Neither is drawn (#3690, user decisions): Link devices has its own Copy link row, and Reset QR code went.
    expect(screen.queryByText('Copy link')).not.toBeInTheDocument()
    expect(screen.queryByText('Reset QR code')).not.toBeInTheDocument()
    expect(screen.queryAllByRole('button')).toHaveLength(0)
    // The designed box, whatever the window: it lives in the scrolling Settings panel (#3690).
    expect(screen.getByTestId('display-qr-code-box')).toHaveStyle({
      width: `${QR_BOX_SIZE}px`,
      height: `${QR_BOX_SIZE}px`,
    })
    expect(screen.queryByText(deviceLink)).not.toBeInTheDocument()
    expect(document.querySelector('input')).toBeNull()
  })

  it('while the link is minted the progress bar shows with the status line', () => {
    renderComponent(<DisplayQrCodeComponent deviceLink='' isLoading />)

    expect(screen.getByTestId('display-qr-code-progress')).toBeVisible()
    expect(screen.getByRole('status')).toHaveTextContent(DISPLAY_QR_CODE_COPY.generating)
    expect(screen.getByRole('progressbar')).toBeVisible()
  })

  it('without a link and nothing being minted the box says the link is unavailable', () => {
    renderComponent(<DisplayQrCodeComponent deviceLink='' isLoading={false} />)

    expect(screen.getByTestId('display-qr-code-status')).toHaveTextContent(DISPLAY_QR_CODE_COPY.unavailable)
    expect(screen.queryByTestId('display-qr-code-progress')).not.toBeInTheDocument()
  })
})
