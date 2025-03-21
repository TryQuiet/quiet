import React from 'react'
import CssBaseline from '@mui/material/CssBaseline'
import { composeStories, setGlobalConfig } from '@storybook/testing-react'
import { it, beforeEach, cy, Cypress, describe } from 'local-cypress'

import * as stories from './Channel.stories.cy'
import { withTheme } from '../../storybook/decorators'
import compareSnapshotCommand from 'cypress-visual-regression/dist/command'
import { mount } from 'cypress/react18'

compareSnapshotCommand()

const resizeObserverLoopErrRe = /^[^(ResizeObserver loop limit exceeded)]/
Cypress.on('uncaught:exception', err => {
  if (resizeObserverLoopErrRe.test(err.message)) {
    return false
  }
})

// @ts-expect-error
setGlobalConfig(withTheme)

const { Component } = composeStories(stories)

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
          <Component />
        </CssBaseline>
      </React.Fragment>
    )
    cy.wait(500) // Wait for component to render
  })

  it('should show dropdown when typing colon followed by characters', () => {
    // Start typing an emoji code
    cy.get('[data-testid="messageInput"]')
      .type(':sm')
    
    // Verify the dropdown appears
    cy.get('[data-testid="emoji-dropdown"]')
      .should('be.visible')
      .should('contain', ':smile:')
  })

  it('should hide dropdown when selecting an emoji with Tab key', () => {
    // Start typing an emoji code
    cy.get('[data-testid="messageInput"]')
      .type(':sm')
    
    // Verify dropdown appears
    cy.get('[data-testid="emoji-dropdown"]')
      .should('be.visible')
    
    // Instead of Tab, trigger the keydown event directly
    cy.get('[data-testid="messageInput"]').trigger('keydown', { 
      key: 'Tab',
      keyCode: 9,
      which: 9,
      code: 'Tab'
    })
    
    // Verify dropdown disappears
    cy.get('[data-testid="emoji-dropdown"]')
      .should('not.exist')
  })

  it('should hide dropdown when clicking an emoji suggestion', () => {
    // Start typing an emoji code
    cy.get('[data-testid="messageInput"]')
      .type(':sm')
    
    // Verify dropdown appears
    cy.get('[data-testid="emoji-dropdown"]')
      .should('be.visible')
    
    // Click the first emoji suggestion
    cy.get('[data-testid="emoji-dropdown"] > div')
      .first()
      .click()
    
    // Verify dropdown disappears
    cy.get('[data-testid="emoji-dropdown"]')
      .should('not.exist')
    
    // Verify emoji was inserted (smiley emoji U+1F603)
    cy.get('[data-testid="messageInput"]')
      .should('have.value', '😃')
  })

  it('should hide dropdown when typing Enter key', () => {
    // Start typing an emoji code
    cy.get('[data-testid="messageInput"]')
      .type(':sm')
    
    // Verify dropdown appears
    cy.get('[data-testid="emoji-dropdown"]')
      .should('be.visible')
    
    // Press Enter to send the message
    cy.get('[data-testid="messageInput"]')
      .type('{enter}')
    
    // Verify dropdown disappears
    cy.get('[data-testid="emoji-dropdown"]')
      .should('not.exist')
    
    // Input should be cleared after sending
    cy.get('[data-testid="messageInput"]')
      .should('have.value', '')
  })

  it('should hide dropdown when clicking away', () => {
    // Start typing an emoji code
    cy.get('[data-testid="messageInput"]')
      .type(':sm')
    
    // Verify dropdown appears
    cy.get('[data-testid="emoji-dropdown"]')
      .should('be.visible')
    
    // Click away from the input 
    cy.get('body').click()
    
    // Verify dropdown no longer exists in the DOM
    cy.get('[data-testid="emoji-dropdown"]')
      .should('not.exist')
  })

  it('should hide dropdown when typing text that no longer matches emoji pattern', () => {
    // Start typing an emoji code
    cy.get('[data-testid="messageInput"]')
      .type(':sm')
    
    // Verify dropdown appears
    cy.get('[data-testid="emoji-dropdown"]')
      .should('be.visible')
    
    // Type a space to break the emoji pattern
    cy.get('[data-testid="messageInput"]')
      .type(' ')
    
    // Verify dropdown disappears
    cy.get('[data-testid="emoji-dropdown"]')
      .should('not.exist')
  })
})