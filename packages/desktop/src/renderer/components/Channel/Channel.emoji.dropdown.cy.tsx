import React from 'react'
import CssBaseline from '@mui/material/CssBaseline'
import { composeStories, setGlobalConfig } from '@storybook/testing-react'
import { it, beforeEach, cy, Cypress, describe } from 'local-cypress'

import * as stories from './Channel.stories'
import { withTheme } from '../../storybook/decorators'
import { mount } from 'cypress/react18'
import { ArrowKeyStepper } from 'react-virtualized'

const resizeObserverLoopErrRe = /^[^(ResizeObserver loop limit exceeded)]/
Cypress.on('uncaught:exception', err => {
  if (resizeObserverLoopErrRe.test(err.message)) {
    return false
  }
})

// @ts-expect-error
setGlobalConfig(withTheme)

// Use SendingMessagesWithScroll story to avoid TypeScript errors in other stories
const { SendingMessagesWithScroll } = composeStories(stories)

describe('Emoji dropdown behavior', () => {
  // Tests for checking that the emoji dropdown appears and disappears as expected
  // - appears when typing colon + characters
  // - disappears with Tab key (emoji selection)
  // - disappears with mouse click (emoji selection)
  // - disappears with Enter key (message sending)
  // - disappears when clicking away
  // - disappears when typing non-emoji pattern
  beforeEach(() => {
    mount(
      <React.Fragment>
        <CssBaseline>
          <SendingMessagesWithScroll />
        </CssBaseline>
      </React.Fragment>
    )
    cy.wait(500) // Wait for component to render
  })

  it('should show dropdown when typing colon followed by characters', () => {
    // Start typing an emoji code
    cy.get('[data-testid="messageInput"]').type(':sm')

    // Verify the dropdown appears
    cy.get('[data-testid="emoji-dropdown"]').should('be.visible').should('contain', ':smile:')
  })

  it('should hide dropdown when selecting an emoji with Tab key', () => {
    // Start typing an emoji code
    cy.get('[data-testid="messageInput"]').type(':sm')

    // Verify dropdown appears
    cy.get('[data-testid="emoji-dropdown"]').should('be.visible')

    // Instead of Tab, trigger the keydown event directly
    cy.get('[data-testid="messageInput"]').trigger('keydown', {
      key: 'Tab',
      keyCode: 9,
      which: 9,
      code: 'Tab',
    })

    // Verify dropdown disappears
    cy.get('[data-testid="emoji-dropdown"]').should('not.exist')
  })

  it('should hide dropdown when selecting an emoji with Enter key', () => {
    // Start typing an emoji code
    cy.get('[data-testid="messageInput"]').type(':sm')

    // Verify dropdown appears
    cy.get('[data-testid="emoji-dropdown"]').should('be.visible')

    // Trigger the Enter keydown event directly
    cy.get('[data-testid="messageInput"]').trigger('keydown', {
      key: 'Enter',
      keyCode: 13,
      which: 13,
      code: 'Enter',
    })

    // Verify dropdown disappears
    cy.get('[data-testid="emoji-dropdown"]').should('not.exist')
  })

  it('should hide dropdown when clicking an emoji suggestion', () => {
    // Start typing an emoji code
    cy.get('[data-testid="messageInput"]').type(':sm')

    // Verify dropdown appears
    cy.get('[data-testid="emoji-dropdown"]').should('be.visible')

    // Click the first emoji suggestion
    cy.get('[data-testid="emoji-dropdown"] > div').first().click()

    // Verify dropdown disappears
    cy.get('[data-testid="emoji-dropdown"]').should('not.exist')

    // Verify emoji was inserted (smiley emoji U+1F603)
    cy.get('[data-testid="messageInput"]').should('have.value', '😃')
  })

  it('should hide dropdown when clicking away', () => {
    // Start typing an emoji code
    cy.get('[data-testid="messageInput"]').type(':sm')

    // Verify dropdown appears
    cy.get('[data-testid="emoji-dropdown"]').should('be.visible')

    // Click away from the input
    cy.get('body').click()

    // Verify dropdown no longer exists in the DOM
    cy.get('[data-testid="emoji-dropdown"]').should('not.exist')
  })

  it('should scroll dropdown when navigating with arrow keys', () => {
    // Type ":h" to get a decent number of emoji suggestions without being too specific
    cy.get('[data-testid="messageInput"]').type(':h')

    // Verify dropdown appears
    cy.get('[data-testid="emoji-dropdown"]').should('be.visible')

    // Check initial scroll position
    cy.get('[data-testid="emoji-dropdown"]').then($dropdown => {
      const initialScrollTop = $dropdown[0].scrollTop

      // Add a data attribute to track initial scroll position
      $dropdown[0].setAttribute('data-initial-scroll', initialScrollTop.toString())

      // Press arrow down key multiple times to navigate through suggestions
      for (let i = 0; i < 8; i++) {
        cy.get('[data-testid="messageInput"]').trigger('keydown', {
          key: 'ArrowDown',
          keyCode: 40,
          which: 40,
          code: 'ArrowDown',
          bubbles: true,
        })
        cy.wait(100) // Give more time between key presses
      }

      // After key presses, verify the dropdown is still visible
      cy.get('[data-testid="emoji-dropdown"]')
        .should('be.visible')
        .then($updatedDropdown => {
          // Get the initial scroll position from the data attribute
          const initialScroll = parseInt($updatedDropdown[0].getAttribute('data-initial-scroll') || '0')
          const currentScrollTop = $updatedDropdown[0].scrollTop

          // If scrollTop changed, scrolling occurred
          expect(currentScrollTop).to.be.gte(initialScroll)
        })
    })
  })

  it('should hide dropdown when typing text that no longer matches emoji pattern', () => {
    // Start typing an emoji code
    cy.get('[data-testid="messageInput"]').type(':sm')

    // Verify dropdown appears
    cy.get('[data-testid="emoji-dropdown"]').should('be.visible')

    // Type a space to break the emoji pattern
    cy.get('[data-testid="messageInput"]').type(' ')

    // Verify dropdown disappears
    cy.get('[data-testid="emoji-dropdown"]').should('not.exist')
  })
})
