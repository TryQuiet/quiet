import React from 'react'
import CssBaseline from '@mui/material/CssBaseline'
import { composeStories, setGlobalConfig } from '@storybook/testing-react'
import { it, beforeEach, cy, Cypress, describe } from 'local-cypress'

import * as stories from './Channel.stories'
import { withTheme } from '../../storybook/decorators'
import { mount } from 'cypress/react18'

const resizeObserverLoopErrRe = /^[^(ResizeObserver loop limit exceeded)]/
Cypress.on('uncaught:exception', err => {
  // returning false here prevents Cypress from failing the test
  if (resizeObserverLoopErrRe.test(err.message)) {
    return false
  }
})

// @ts-expect-error
setGlobalConfig(withTheme)

// Use SendingMessagesWithScroll story to avoid TypeScript errors in other stories
const { SendingMessagesWithScroll } = composeStories(stories)

describe('Emoji conversion in code blocks test', () => {
  beforeEach(() => {
    mount(
      <React.Fragment>
        <CssBaseline>
          <SendingMessagesWithScroll />
        </CssBaseline>
      </React.Fragment>
    )
    cy.wait(0)
  })

  it('should NOT convert text typed inside an unclosed code fence', () => {
    cy.get('[data-testid="messageInput"]').type('```Some code :) ')

    // The code fence is still open (no closing triple backticks).
    // So ":) " should remain literal and not become an emoji.
    cy.get('[data-testid="messageInput"]').should('have.value', '```Some code :) ')
  })

  it('should convert text immediately after closing the code fence', () => {
    cy.get('[data-testid="messageInput"]')
      // Start an open code fence
      .type('```Inside code block :smile:')
      // Still open => :smile: remains literal
      .should('have.value', '```Inside code block :smile:')
      // Close the code block
      .type('``` ')
      // Now that fence is closed, the space after “``` ” is outside code block
      // Type a known emoticon
      .type(':p')
      .should('have.value', '```Inside code block :smile:``` :p')
      // Type punctuation => triggers conversion of :p
      .type('.')

    cy.get('[data-testid="messageInput"]').should('have.value', '```Inside code block :smile:``` 😛.')
  })

  it('should convert text typed entirely outside code fences', () => {
    // Type something normal outside code block
    cy.get('[data-testid="messageInput"]').type('Hello :smile: ').should('have.value', 'Hello 😄 ')
  })

  it('should handle multiple code fences correctly', () => {
    cy.get('[data-testid="messageInput"]')
      // First code fence
      .type('```Block1 :)``` code between ```Block2 :heart: ')

    // "Block1 :)" is inside the first code fence => no conversion
    // "Block2 :heart:" is inside second code fence => no conversion yet
    cy.get('[data-testid="messageInput"]').should('have.value', '```Block1 :)``` code between ```Block2 :heart: ')

    // close second code fence
    cy.get('[data-testid="messageInput"]').type('``` ')

    // After closing the second fence, type a space + emoticon
    cy.get('[data-testid="messageInput"]').type(':p ')

    // Now the :p should convert to 😛 because we’re outside all fences
    cy.get('[data-testid="messageInput"]').should(
      'have.value',
      '```Block1 :)``` code between ```Block2 :heart: ``` 😛 '
    )
  })
})
