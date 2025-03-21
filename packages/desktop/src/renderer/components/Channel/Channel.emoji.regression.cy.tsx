import React from 'react'
import CssBaseline from '@mui/material/CssBaseline'
import { composeStories, setGlobalConfig } from '@storybook/testing-react'
import { it, beforeEach, cy, Cypress, describe } from 'local-cypress'

import * as stories from './Channel.stories.cy'
import { withTheme } from '../../storybook/decorators'
import compareSnapshotCommand from 'cypress-visual-regression/dist/command'
import { mount } from 'cypress/react18'

compareSnapshotCommand() // Workaround. This should be only in cypress/commands.ts but typescript complains when it's not here

const resizeObserverLoopErrRe = /^[^(ResizeObserver loop limit exceeded)]/
Cypress.on('uncaught:exception', err => {
  /* returning false here prevents Cypress from failing the test */
  if (resizeObserverLoopErrRe.test(err.message)) {
    return false
  }
})

// @ts-expect-error
setGlobalConfig(withTheme)

const { Component } = composeStories(stories)

describe('Emoji conversion in code blocks test', () => {
  beforeEach(() => {
    mount(
      <React.Fragment>
        {/* @ts-ignore */}
        <CssBaseline>
          {/* @ts-ignore */}
          <Component />
        </CssBaseline>
      </React.Fragment>
    )
    // Wait for component to render
    cy.wait(3000)
  })

  const messageInput = '[data-testid="messageInput"]'

  it('should correctly convert heart emoticon after code block', () => {
    // Clear any existing content
    cy.get(messageInput).clear()
    
    // Type a code block followed by heart emoticon and space
    cy.get(messageInput).type('```<3``` <3 ')
    
    // Check if the heart emoticon after the code block is converted to emoji
    // while the one inside the code block remains unchanged
    cy.get(messageInput).should('have.value', '```<3``` ❤️ ')
  })
})