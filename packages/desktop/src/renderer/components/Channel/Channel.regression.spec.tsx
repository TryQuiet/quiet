import React from 'react'
import CssBaseline from '@mui/material/CssBaseline'
import { composeStories, setGlobalConfig } from '@storybook/testing-react'
import { mount } from '@cypress/react18'
import { it, cy, beforeEach, Cypress } from 'local-cypress'
import compareSnapshotCommand from 'cypress-visual-regression/dist/command'

import * as stories from './Channel.stories'
import { withTheme } from '../../storybook/decorators'

compareSnapshotCommand()

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

describe('Scroll behavior test', () => {
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

  const channelContent = '[data-testid="channelContent"]'
  const messageInput = '[data-testid="messageInput"]'

  it('scroll should be at the bottom after entering channel', () => {
    cy.get(channelContent).compareSnapshot('after launch', {
      capture: 'fullPage'
    })
  })

  it('scroll should be at the bottom after sending messages', () => {
    cy.get(messageInput).focus().type('luke where are you?').type('{enter}')
    cy.get(messageInput)
      .focus()
      .type('you underestimate the power of the force')
      .type('{enter}')
    cy.get(channelContent).compareSnapshot('send after enter')
  })

  it.skip('should scroll to the bottom when scroll is in the middle and user sends new message', () => {
    cy.get(channelContent).scrollTo(0, 100)

    cy.get(channelContent).compareSnapshot('scroll to the middle')

    cy.get(messageInput).focus().type('obi wan was wrong').type('{enter}')
    cy.get(messageInput)
      .focus()
      .type('actually, he is on the dark side')
      .type('{enter}')

    cy.get(channelContent).compareSnapshot('send after scroll')
  })

  it.skip('should scroll to the bottom when scroll is at the top and user sends new message', () => {
    cy.get(messageInput).focus().type('hi').type('{enter}')

    cy.get(channelContent).scrollTo(0, 0)

    cy.wait(2000)

    // Scroll again because of lazy loading
    cy.get(channelContent).scrollTo(0, 0)

    cy.get(channelContent).compareSnapshot('scroll to the top')

    // Send only one message because previous bug was only after sending one message
    cy.get(messageInput).focus().type('and youda too').type('{enter}')

    cy.get(channelContent).compareSnapshot('send after top scroll')
  })
})
