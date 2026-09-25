import React from 'react'
import { StyledEngineProvider, ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { it, cy, describe, expect } from 'local-cypress'
import { mount } from 'cypress/react18'

import { composeInvitationShareUrl, validInvitationDatav5 } from '@quiet/common'
import { InvitationKind } from '@quiet/types'
import type { InvitationData } from '@quiet/types'

import { lightTheme } from '../../theme'
import Modal from '../ui/Modal/Modal'
import { DisplayQrCodeComponent, QR_BOX_SIZE } from './DisplayQrCodeComponent'
import { LinkDevicesComponent } from './LinkDevicesComponent'
import { decodeQrImage } from './qrScanner/decodeQr'

/**
 * #3690: the Link devices QR sheet ran off the bottom of a short window and nothing scrolled, so
 * the copy under the code could only be read by resizing the window. Each case mounts the step
 * the way LinkDevices does — the real full-window Modal — at the window size given, and reads
 * the layout the browser actually produced.
 */

/** A v5 device link, QSS endpoint and all: the densest code the sheet draws (69 modules). */
const DEVICE_LINK = composeInvitationShareUrl({
  ...validInvitationDatav5[0],
  kind: InvitationKind.Device,
} as InvitationData)

/** Heights from the 400 minimum window (main.ts) up; the 462 is the window in the issue (693 px at 150%). */
const WINDOWS: Array<[number, number]> = [
  [600, 400],
  [753, 462],
  [800, 500],
  [800, 540],
  [1024, 768],
]

const Step: React.FC<{ title?: string; children: React.ReactNode }> = ({ title, children }) => (
  <StyledEngineProvider injectFirst>
    <ThemeProvider theme={lightTheme}>
      <CssBaseline />
      <Modal
        open
        handleClose={() => {}}
        title={title ?? ''}
        withoutTitle={!title}
        canGoBack={Boolean(title)}
        handleBack={() => {}}
        alignCloseLeft
        contentWidth={'100%'}
        testIdPrefix={'fit'}
      >
        {children}
      </Modal>
    </ThemeProvider>
  </StyledEngineProvider>
)

const modalBody = () => cy.get('.ModalfullPage')

/** The bottom of an element, in the window's coordinates, with the Modal body scrolled to the top. */
const bottomOf = (selector: string) => cy.get(selector).then($el => $el[0].getBoundingClientRect().bottom)

/** Draw the rendered code the way the screen does - at its CSS size times the pixel ratio - and read it back. */
const decodeRenderedCode = (svg: SVGSVGElement): Promise<string | null> =>
  new Promise((resolve, reject) => {
    const size = svg.getBoundingClientRect().width * window.devicePixelRatio
    const margin = 16
    const image = new Image()
    image.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = canvas.height = Math.ceil(size) + 2 * margin
      const context = canvas.getContext('2d')
      if (!context) return reject(new Error('no 2D context'))
      context.fillStyle = '#FFFFFF'
      context.fillRect(0, 0, canvas.width, canvas.height)
      context.drawImage(image, margin, margin, size, size)
      resolve(decodeQrImage(context.getImageData(0, 0, canvas.width, canvas.height)))
    }
    image.onerror = () => reject(new Error('the code did not rasterise'))
    image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(new XMLSerializer().serializeToString(svg))}`
  })

describe('Link devices QR sheet fits the window (#3690)', () => {
  WINDOWS.forEach(([width, height]) => {
    it(`at ${width}x${height} the whole sheet is on screen, the code still reads, and the box keeps the design size where it fits`, () => {
      cy.viewport(width, height)
      mount(
        <Step>
          <DisplayQrCodeComponent deviceLink={DEVICE_LINK} isLoading={false} dataTestId='sheet' />
        </Step>
      )

      // The copy is what has to be readable without touching anything.
      bottomOf('[data-testid="sheet-security"]').should('be.at.most', height)
      cy.contains('Scan this from').should('be.visible')

      // The design's box wherever it fits (the issue's 462 window included); on the 400 minimum it gives way.
      cy.get('[data-testid="sheet-box"]').then($box => {
        const box = $box[0].getBoundingClientRect().width
        if (height >= 462) expect(box).to.equal(QR_BOX_SIZE)
        else expect(box).to.be.lessThan(QR_BOX_SIZE)
      })

      // With no action under the copy, the whole sheet fits at every window size: nothing scrolls.
      modalBody().should($body => expect($body[0].scrollHeight).to.be.at.most($body[0].clientHeight))

      cy.get('[data-testid="sheet-box"] svg').then($svg =>
        cy.wrap(decodeRenderedCode($svg[0] as unknown as SVGSVGElement)).should('equal', DEVICE_LINK)
      )
    })
  })

  it('has no bar title, only the close glyph, and no action', () => {
    cy.viewport(800, 540)
    mount(
      <Step>
        <DisplayQrCodeComponent deviceLink={DEVICE_LINK} isLoading={false} dataTestId='sheet' />
      </Step>
    )
    cy.get('.Modalheader').should('not.contain.text', 'QR code')
    cy.get('[data-testid="fitModalClose"]').should('be.visible')
    cy.contains('Reset QR code').should('not.exist')
    cy.contains('Copy link').should('not.exist')
  })
})

describe('Full-window Modal steps taller than the window scroll (#3690)', () => {
  it('Link devices with a long device list scrolls to its last device', () => {
    cy.viewport(600, 400)
    mount(
      <Step>
        <LinkDevicesComponent
          direction='share'
          onDisplayQrCode={() => {}}
          deviceLink={DEVICE_LINK}
          onCopyLink={() => {}}
          onLinkCopied={() => {}}
          onScanQrCode={() => {}}
          onPasteLink={() => {}}
          linkedDevices={Array.from({ length: 12 }, (_, i) => ({
            deviceId: `device-${i}`,
            deviceName: `device-${i}`,
            isCurrent: i === 0,
          }))}
        />
      </Step>
    )
    modalBody().should('have.css', 'overflow-y', 'auto')
    modalBody().should($body => expect($body[0].scrollHeight).to.be.greaterThan($body[0].clientHeight))
    cy.contains('device-11').then($last => expect($last[0].getBoundingClientRect().top).to.be.greaterThan(400))
    modalBody().scrollTo('bottom')
    cy.contains('device-11').should('be.visible')
    cy.contains('device-11').then($last => expect($last[0].getBoundingClientRect().bottom).to.be.at.most(400))
  })
})
