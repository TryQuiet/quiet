import React from 'react'
import '@testing-library/jest-dom/extend-expect'
import { screen, waitFor } from '@testing-library/dom'
import userEvent from '@testing-library/user-event'

import { renderComponent } from '../../testUtils/renderComponent'
import {
  DISPLAY_QR_CODE_COPY,
  DisplayQrCodeComponent,
  QR_BOX_SIZE,
  QR_SHEET_CHROME_HEIGHT,
  QR_SHEET_COMPACT_BELOW,
  QR_SIZE,
  fitQrBox,
} from './DisplayQrCodeComponent'

const deviceLink = 'https://tryquiet.org/join#device-link'

describe('DisplayQrCodeComponent', () => {
  it('draws the QR code in the box with the sheet copy and Copy link, no Reset QR code, and never the raw link', () => {
    renderComponent(<DisplayQrCodeComponent deviceLink={deviceLink} isLoading={false} />)

    expect(screen.getByTestId('display-qr-code-box')).toBeVisible()
    expect(screen.getByTestId('display-qr-code-box').querySelector('svg')).not.toBeNull()
    expect(screen.getByText(DISPLAY_QR_CODE_COPY.scan)).toBeVisible()
    expect(screen.getByTestId('copy-device-link')).toHaveTextContent(DISPLAY_QR_CODE_COPY.copyLink)
    // Not drawn (#3690, user decision): the sheet's only action is Copy link.
    expect(screen.queryByText('Reset QR code')).not.toBeInTheDocument()
    expect(screen.getAllByRole('button')).toHaveLength(1)
    expect(screen.queryByText(deviceLink)).not.toBeInTheDocument()
    expect(document.querySelector('input')).toBeNull()
  })

  it('Copy link puts the link on the clipboard and confirms', async () => {
    const write = jest.fn()
    Object.assign(navigator, { clipboard: { writeText: write } })
    document.execCommand = jest.fn(() => true)
    renderComponent(<DisplayQrCodeComponent deviceLink={deviceLink} isLoading={false} />)

    await userEvent.click(screen.getByTestId('copy-device-link'))
    expect(await screen.findByText(DISPLAY_QR_CODE_COPY.copied)).toBeVisible()
    expect(document.execCommand).toHaveBeenCalledWith('copy')
    await waitFor(() => expect(screen.queryByText(DISPLAY_QR_CODE_COPY.copied)).not.toBeInTheDocument(), {
      timeout: 4000,
    })
  })

  it('while the link is minted the actions give way to the progress bar with the status line', () => {
    renderComponent(<DisplayQrCodeComponent deviceLink='' isLoading />)

    expect(screen.getByTestId('display-qr-code-progress')).toBeVisible()
    expect(screen.getByRole('status')).toHaveTextContent(DISPLAY_QR_CODE_COPY.generating)
    expect(screen.getByRole('progressbar')).toBeVisible()
    expect(screen.queryByTestId('copy-device-link')).not.toBeInTheDocument()
  })

  it('without a link and nothing being minted the box says the link is unavailable and no action is drawn', () => {
    renderComponent(<DisplayQrCodeComponent deviceLink='' isLoading={false} />)

    expect(screen.getByTestId('display-qr-code-status')).toHaveTextContent(DISPLAY_QR_CODE_COPY.unavailable)
    expect(screen.queryByTestId('display-qr-code-progress')).not.toBeInTheDocument()
    expect(screen.queryByTestId('copy-device-link')).not.toBeInTheDocument()
  })
})

/**
 * #3690: the sheet ran off the bottom of a short window. The box now takes whatever height the
 * copy and Copy link leave it, and a shrunk code is never drawn at a size a scanner cannot read.
 * The layout itself is exercised in a real browser by DisplayQrCode.fit.cy.tsx.
 */
describe('fitQrBox', () => {
  /** A v5 device link (with its QSS endpoint) draws 69 modules a side; a v4 one 65. */
  const MODULES = 69
  const HEIGHTS = Array.from({ length: (1080 - 400) / 2 + 1 }, (_, i) => 400 + i * 2)
  const RATIOS = [1, 1.25, 1.5, 2]

  it('keeps the design’s 220 box wherever the whole sheet fits, at any pixel ratio', () => {
    for (const ratio of RATIOS) {
      for (const height of [QR_SHEET_COMPACT_BELOW, 768, 1080]) {
        expect(fitQrBox(height, ratio, MODULES)).toEqual({ box: QR_BOX_SIZE, code: QR_SIZE, crisp: false })
      }
    }
  })

  it('shrinks the box on a shorter window so the copy and Copy link stay on screen', () => {
    // The window in #3690: 693 device pixels tall at 150%, 462 CSS pixels.
    const fit = fitQrBox(462, 1.5, MODULES)
    expect(fit.box).toBeLessThan(QR_BOX_SIZE)
    expect(fit.box).toBeLessThanOrEqual(462 - (QR_SHEET_CHROME_HEIGHT - 48))
    // Below the compact line the sheet gives back 48: its three gaps close by 8 and 24 of the bottom padding goes.
    expect(fitQrBox(QR_SHEET_COMPACT_BELOW - 1, 2, MODULES).box).toBe(QR_BOX_SIZE)
  })

  it('never grows as the window gets shorter', () => {
    for (const ratio of RATIOS) {
      let previous = 0
      for (const height of HEIGHTS) {
        const { box } = fitQrBox(height, ratio, MODULES)
        expect(box).toBeGreaterThanOrEqual(previous)
        previous = box
      }
    }
  })

  it('draws a shrunk code at 2.5 device pixels a module or more, or snapped to whole device pixels, never under 2', () => {
    for (const ratio of RATIOS) {
      for (const height of HEIGHTS) {
        const { box, code, crisp } = fitQrBox(height, ratio, MODULES)
        expect(box - code).toBe(QR_BOX_SIZE - QR_SIZE)
        if (box === QR_BOX_SIZE) continue
        const perModule = (code * ratio) / MODULES
        if (crisp) {
          expect(perModule).toBeCloseTo(Math.round(perModule), 9)
          expect(perModule).toBeGreaterThanOrEqual(2)
        } else {
          expect(perModule).toBeGreaterThanOrEqual(2.5)
        }
      }
    }
  })

  it('snaps at 1x, where a 69-module code has less than 2.5 pixels a module to spare', () => {
    // 400 tall at 1x: 130 of room, 98 of code, 1.4 a module — snapped up to 2, a 138 code.
    expect(fitQrBox(400, 1, MODULES)).toEqual({ box: 170, code: 138, crisp: true })
    // At 2x the same room is 2.8 device pixels a module: drawn as is.
    expect(fitQrBox(400, 2, MODULES)).toEqual({ box: 130, code: 98, crisp: false })
  })

  it('without a module count yet, fills its room', () => {
    expect(fitQrBox(400, 1)).toEqual({ box: 130, code: 98, crisp: false })
  })
})
