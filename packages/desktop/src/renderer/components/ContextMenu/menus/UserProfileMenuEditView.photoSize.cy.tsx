import React from 'react'
import CssBaseline from '@mui/material/CssBaseline'
import { ThemeProvider, StyledEngineProvider } from '@mui/material/styles'
import { mount } from 'cypress/react18'
import { it, cy, describe } from 'local-cypress'

import { PROFILE_PHOTO_TOO_LARGE_ERROR } from '@quiet/common'

import { UserProfileMenuEditView } from './UserProfileContextMenu.container'
import { lightTheme, darkTheme } from '../../../theme'

const contextMenu = {
  visible: true,
  handleOpen: () => {},
  handleClose: () => {},
}

const mountEditView = (theme: typeof lightTheme, errorBanner?: string | null) => {
  mount(
    <StyledEngineProvider injectFirst>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <UserProfileMenuEditView
          username='nick'
          userId='userId'
          contextMenu={contextMenu}
          setRoute={() => {}}
          onSaveUserProfile={() => {}}
          errorBanner={errorBanner}
        />
      </ThemeProvider>
    </StyledEngineProvider>
  )
}

describe('Edit profile view: oversized photo error banner', () => {
  it('shows no banner when there is no error (behaviour on develop)', () => {
    cy.viewport(600, 560)
    mountEditView(lightTheme, null)

    cy.contains('Edit profile').should('be.visible')
    cy.contains(PROFILE_PHOTO_TOO_LARGE_ERROR).should('not.exist')
    cy.screenshot('2953-before-no-banner-light', { overwrite: true, capture: 'viewport' })
  })

  it('renders the too-large error from @quiet/common in the banner (light)', () => {
    cy.viewport(600, 560)
    mountEditView(lightTheme, PROFILE_PHOTO_TOO_LARGE_ERROR)

    cy.contains(PROFILE_PHOTO_TOO_LARGE_ERROR).should('be.visible')
    cy.screenshot('2953-after-banner-light', { overwrite: true, capture: 'viewport' })
  })

  it('renders the too-large error from @quiet/common in the banner (dark)', () => {
    cy.viewport(600, 560)
    mountEditView(darkTheme, PROFILE_PHOTO_TOO_LARGE_ERROR)

    cy.contains(PROFILE_PHOTO_TOO_LARGE_ERROR).should('be.visible')
    cy.screenshot('2953-after-banner-dark', { overwrite: true, capture: 'viewport' })
  })
})
