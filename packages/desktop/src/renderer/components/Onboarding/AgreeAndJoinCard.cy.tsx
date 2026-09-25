import React from 'react'
import { StyledEngineProvider, ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { it, cy, describe, expect } from 'local-cypress'
import { mount } from 'cypress/react18'

import { lightTheme } from '../../theme'
import TermsOfServiceComponent from '../TermsOfService/TermsOfServiceComponent'

/**
 * Agree & join is a full-window step like the other onboarding stages, not the floating
 * modal/small card it used to be (user decision, #3690). Measured in a real browser: the
 * shell covers the whole window at every size, with square corners and the bar at the top.
 */
const WINDOWS: Array<[number, number]> = [
  [600, 400],
  [1024, 768],
  [1440, 900],
]

describe('Agree & join is full window', () => {
  WINDOWS.forEach(([width, height]) => {
    it(`fills a ${width}x${height} window`, () => {
      cy.viewport(width, height)
      mount(
        <StyledEngineProvider injectFirst>
          <ThemeProvider theme={lightTheme}>
            <CssBaseline />
            <TermsOfServiceComponent
              open
              handleClose={() => {}}
              onAgree={() => {}}
              openURL={() => {}}
              qssEndPoint='api.tryquiet.org'
            />
          </ThemeProvider>
        </StyledEngineProvider>
      )
      cy.get('.Modalheader')
        .parent()
        .should($shell => {
          const rect = $shell[0].getBoundingClientRect()
          expect(rect.left).to.equal(0)
          expect(rect.top).to.equal(0)
          expect(rect.width).to.equal(width)
          expect(rect.height).to.equal(height)
          expect(getComputedStyle($shell[0]).borderRadius).to.equal('0px')
        })
      cy.get('.Modalheader').should($bar => expect($bar[0].getBoundingClientRect().top).to.equal(0))
      cy.contains('Agree & join').should('be.visible')
      cy.get('[data-testid="TermOfService-UseQuietServer"]').should('be.visible')
    })
  })
})
