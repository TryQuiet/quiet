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

describe('Emoji features test', () => {
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
  
  it('Shows emoji suggestions when typing a shortcode', () => {
    // Type something with a partial emoji code
    cy.get('[data-testid="messageInput"]').type(':heart');
    
    // Check if the dropdown appears
    cy.get('[class*="emojiDropdown"]').should('be.visible');
    cy.get('[class*="emojiDropdownTitle"]').should('contain', 'Tab to complete:');
    
    // Should contain at least the heart emoji
    cy.get('[class*="emojiDropdownItem"]').first().should('contain', ':heart:');
  });
  
  it('Completes emoji shortcodes when tab is pressed', () => {
    // Type something with a partial emoji code
    cy.get('[data-testid="messageInput"]').type(':sm');
    
    // Press tab to complete
    cy.get('[data-testid="messageInput"]').type('{tab}');
    
    // Check if the input contains the completed emoji (one of the smile variations)
    cy.get('[data-testid="messageInput"]').should(($input) => {
      const text = $input.val().toString();
      expect(text).to.match(/😄|😃|🙂/);
    });
  });

  it('Does not convert emoji codes inside code blocks', () => {
    // Type a code block with emoji codes
    cy.get('[data-testid="messageInput"]').type('```\n:heart: should not convert\n```');
    
    // Press Enter to send
    cy.get('[data-testid="messageInput"]').type('{enter}');
    
    // The message should show the code block with unconverted emoji codes
    // Note: This would need to wait for the message to appear in the chat
    cy.contains(':heart: should not convert').should('exist');
  });
