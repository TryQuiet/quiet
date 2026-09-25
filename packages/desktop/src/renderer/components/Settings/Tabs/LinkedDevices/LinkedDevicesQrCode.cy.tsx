import React from 'react'
import { StyledEngineProvider, ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { it, cy, describe, expect } from 'local-cypress'
import { mount } from 'cypress/react18'

import { composeInvitationShareUrl, validInvitationDatav5 } from '@quiet/common'
import { InvitationKind } from '@quiet/types'
import type { InvitationData } from '@quiet/types'

import { lightTheme } from '../../../../theme'
import SettingsComponent from '../../SettingsComponent'
import { DisplayQrCodeComponent, QR_BOX_SIZE } from '../../../Onboarding/DisplayQrCodeComponent'
import { decodeQrImage } from '../../../Onboarding/qrScanner/decodeQr'

/**
 * #3690: the device-link QR was a full-window sheet that ran off the bottom of a short window
 * with nothing to scroll. It is now drawn one level down in the Settings panel, like the invite
 * QR code, and the panel scrolls. Mounted in the real SettingsComponent, opened on that page;
 * the page's content is the presentational component with a real v5 device link, so no store.
 */

/** A v5 device link, QSS endpoint and all: the densest code the page draws. */
const DEVICE_LINK = composeInvitationShareUrl({
  ...validInvitationDatav5[0],
  kind: InvitationKind.Device,
} as InvitationData)

const QrPage: React.FC = () => (
  <DisplayQrCodeComponent deviceLink={DEVICE_LINK} isLoading={false} dataTestId='link-devices-display' />
)

const mountPanel = () =>
  mount(
    <StyledEngineProvider injectFirst>
      <ThemeProvider theme={lightTheme}>
        <CssBaseline />
        <SettingsComponent
          open
          handleClose={() => {}}
          tabs={{ linkedDevicesQr: QrPage }}
          leaveCommunityModal={{ open: false, handleOpen: () => {}, handleClose: () => {} }}
          focusTab='linkedDevicesQr'
        />
      </ThemeProvider>
    </StyledEngineProvider>
  )

/** The drawer's scrolling surface: MUI's Paper, which carries overflow-y auto. */
const panel = () => cy.get('.MuiDrawer-paper')

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

describe('Linked devices QR code in the Settings panel (#3690)', () => {
  it('on the 400-tall minimum window keeps the designed box, and the panel scrolls to the fine print', () => {
    cy.viewport(600, 400)
    mountPanel()

    cy.get('[data-testid="link-devices-display-box"]').should($box => {
      expect($box[0].getBoundingClientRect().width).to.equal(QR_BOX_SIZE)
    })
    // Taller than the window: the panel is what scrolls, and the fine print is reached by it.
    panel().should('have.css', 'overflow-y', 'auto')
    panel().should($paper => expect($paper[0].scrollHeight).to.be.greaterThan($paper[0].clientHeight))
    panel().scrollTo('bottom')
    cy.get('[data-testid="link-devices-display-security"]').should($text => {
      expect($text[0].getBoundingClientRect().bottom).to.be.at.most(400)
    })
    cy.get('[data-testid="link-devices-display-security"]').should(
      'have.text',
      'Anyone who has this QR code can link your device and access community history.'
    )

    cy.get('[data-testid="link-devices-display-box"] svg').then($svg =>
      cy.wrap(decodeRenderedCode($svg[0] as unknown as SVGSVGElement)).should('equal', DEVICE_LINK)
    )
  })

  it('on a 1024x768 window shows the whole page with nothing to scroll, and no action or bar title', () => {
    cy.viewport(1024, 768)
    mountPanel()

    panel().should($paper => expect($paper[0].scrollHeight).to.be.at.most($paper[0].clientHeight))
    cy.get('[data-testid="link-devices-display-security"]').should($text => {
      expect($text[0].getBoundingClientRect().bottom).to.be.at.most(768)
    })
    cy.contains('Copy link').should('not.exist')
    cy.contains('Reset QR code').should('not.exist')
    // The bar keeps its back arrow and carries no title.
    cy.get('[data-testid="close-tab-button-box"]').should('have.text', '')
    cy.get('[data-testid="close-tab-button-box"] button').should('be.visible')
  })
})
