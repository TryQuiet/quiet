import React from 'react'
import { StyledEngineProvider, ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { it, cy, describe, expect } from 'local-cypress'
import { mount } from 'cypress/react18'

import { lightTheme } from '../../../theme'
import Modal from './Modal'
import { LinkDevicesComponent } from '../../Onboarding/LinkDevicesComponent'

/**
 * #3690: the full-window Modal body was fixed at the window's height under the bar with no
 * overflow, so a step taller than the window was cut off with nothing to scroll. Measured in a
 * real browser with a step that is: Link devices with a long device list, at the 400 minimum.
 */
describe('Full-window Modal steps taller than the window scroll (#3690)', () => {
  it('Link devices with a long device list scrolls to its last device', () => {
    cy.viewport(600, 400)
    mount(
      <StyledEngineProvider injectFirst>
        <ThemeProvider theme={lightTheme}>
          <CssBaseline />
          <Modal
            open
            handleClose={() => {}}
            withoutTitle
            canGoBack
            handleBack={() => {}}
            alignCloseLeft
            contentWidth={'100%'}
          >
            <LinkDevicesComponent
              direction='share'
              onDisplayQrCode={() => {}}
              deviceLink='https://tryquiet.org/join#device'
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
          </Modal>
        </ThemeProvider>
      </StyledEngineProvider>
    )
    const body = () => cy.get('.ModalfullPage')
    body().should('have.css', 'overflow-y', 'auto')
    body().should($body => expect($body[0].scrollHeight).to.be.greaterThan($body[0].clientHeight))
    cy.contains('device-11').then($last => expect($last[0].getBoundingClientRect().top).to.be.greaterThan(400))
    body().scrollTo('bottom')
    cy.contains('device-11').should('be.visible')
    cy.contains('device-11').then($last => expect($last[0].getBoundingClientRect().bottom).to.be.at.most(400))
  })
})
