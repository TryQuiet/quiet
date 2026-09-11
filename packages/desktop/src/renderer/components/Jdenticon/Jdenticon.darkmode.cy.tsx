import React from 'react'
import { StyledEngineProvider, ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { it, cy, describe } from 'local-cypress'
import { mount } from 'cypress/react18'

import Jdenticon from './Jdenticon'
import { lightTheme, darkTheme } from '../../theme'

// Regression harness for #2959 — identicons must render on the same light
// background in both light and dark mode. Mirrors the two real render sites
// (ProfilePhoto and MentionElement) which wrap Jdenticon in a container whose
// background comes from theme.palette.background.paper.
const Harness = ({ theme }: { theme: typeof lightTheme }) => (
  <StyledEngineProvider injectFirst>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <div style={{ padding: 24, background: theme.palette.background.default, display: 'flex', gap: 24 }}>
        {/* ProfilePhoto-style usage */}
        <Jdenticon
          value='profile-photo-example'
          size='96'
          style={{
            background: theme.palette.background.paper,
            width: '96px',
            height: '96px',
            borderRadius: '4px',
          }}
        />
        {/* MentionElement-style usage */}
        <div
          style={{
            maxHeight: 18,
            maxWidth: 18,
            borderRadius: 4,
            backgroundColor: theme.palette.background.paper,
          }}
        >
          <div style={{ width: 17, height: 17, marginLeft: 1, marginTop: 1 }}>
            <Jdenticon size='17' value='mention-example' />
          </div>
        </div>
      </div>
    </ThemeProvider>
  </StyledEngineProvider>
)

describe('Jdenticon dark mode background (#2959)', () => {
  it('renders on a light background in light mode', () => {
    mount(<Harness theme={lightTheme} />)
    cy.wait(0)
    // jdenticon paints its own background as a <rect> before the identicon shapes.
    // It must always match the light theme's paper color, never the active theme's.
    cy.get('svg rect').should('have.attr', 'fill', lightTheme.palette.background.paper)
    cy.screenshot('2959-light', { overwrite: true })
  })

  it('renders on the same light background in dark mode, not the dark theme background', () => {
    mount(<Harness theme={darkTheme} />)
    cy.wait(0)
    cy.get('svg rect').should('have.attr', 'fill', lightTheme.palette.background.paper)
    cy.get('svg rect').should('not.have.attr', 'fill', darkTheme.palette.background.paper)
    cy.screenshot('2959-dark', { overwrite: true })
  })
})
