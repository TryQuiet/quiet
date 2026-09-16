import React from 'react'
import CssBaseline from '@mui/material/CssBaseline'
import { composeStories, setGlobalConfig } from '@storybook/testing-react'
import { it, beforeEach, cy, Cypress, describe, expect } from 'local-cypress'

import * as stories from './Channel.stories'
import { withTheme } from '../../storybook/decorators'
import { mount } from 'cypress/react18'

declare global {
  namespace Cypress {
    interface Chainable {
      assertScrolledToBottom(): Chainable<void>
    }
  }
}

// Custom command to check if the channel content is scrolled to the bottom
Cypress.Commands.add('assertScrolledToBottom', { prevSubject: 'element' }, subject => {
  cy.wrap(subject).should($el => {
    const el = $el[0]
    expect(Math.abs(el.scrollHeight - el.scrollTop - el.clientHeight), 'distance from bottom').to.be.at.most(1)
  })
})

const resizeObserverLoopErrRe = /^[^(ResizeObserver loop limit exceeded)]/
Cypress.on('uncaught:exception', err => {
  /* returning false here prevents Cypress from failing the test */
  if (resizeObserverLoopErrRe.test(err.message)) {
    return false
  }
})

// @ts-expect-error
setGlobalConfig(withTheme)

const { SendingMessagesWithScroll } = composeStories(stories)

describe('Scroll behavior test', () => {
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

  const channelContent = '[data-testid="channelContent"]'
  const messageInput = '[data-testid="messageInput"]'
  const floatingDateSelector = '[class*="FloatingDatetitleDiv"]'

  it('scroll should be at the bottom after entering channel', () => {
    cy.get(channelContent).assertScrolledToBottom()
  })

  it('scroll should be at the bottom after sending messages', () => {
    cy.get(messageInput).focus().type('luke where are you?').type('{enter}')
    cy.get(channelContent).within(() => {
      cy.contains('luke where are you?')
    })
    cy.get(channelContent).assertScrolledToBottom()
  })

  it('should scroll to the bottom when scroll is in the middle and user sends new message', () => {
    cy.get(channelContent).scrollTo(0, 100)
    cy.get(messageInput).focus().type('actually, he is on the dark side').type('{enter}')
    cy.get(channelContent).within(() => {
      cy.contains('actually, he is on the dark side')
    })
    cy.get(channelContent).assertScrolledToBottom()
  })

  it('should scroll to the bottom when scroll is at the top and user sends new message', () => {
    cy.get(messageInput).focus().type('hi').type('{enter}')
    cy.get(channelContent).scrollTo(0, 0)
    cy.get(messageInput).focus().type('and yoda too').type('{enter}')
    cy.get(channelContent).assertScrolledToBottom()
  })

  // The number of pages depends on the viewport and rendered message heights.
  // Check one page's movement first, then the boundary after enough key presses.
  for (const viewportHeight of [400, 660]) {
    it(`PageUp scrolls one page and reaches the top at viewport height ${viewportHeight}`, () => {
      cy.viewport(1000, viewportHeight)
      cy.get(messageInput).focus()
      cy.get(channelContent).assertScrolledToBottom()
      cy.get(channelContent).then($el => {
        const container = $el[0]
        const initialTop = container.scrollTop
        const pageSize = container.clientHeight * 0.9
        expect(pageSize, 'visible message page').to.be.greaterThan(1)
        expect(initialTop, 'history spans more than one page').to.be.greaterThan(pageSize)

        cy.get(messageInput).type('{pageup}')
        cy.get(channelContent).should($current => {
          expect($current[0].scrollTop, 'one PageUp').to.be.closeTo(initialTop - pageSize, 1)
        })

        // Round down the page size to account for integer scroll positions.
        // The extra press also checks that scrolling clamps at the boundary.
        cy.get(messageInput).type('{pageup}'.repeat(Math.ceil(initialTop / Math.floor(pageSize))))
        cy.get(channelContent).should($current => {
          expect(Math.abs($current[0].scrollTop), 'distance from top').to.be.at.most(1)
        })
      })
    })

    it(`PageDown scrolls one page and reaches the bottom at viewport height ${viewportHeight}`, () => {
      cy.viewport(1000, viewportHeight)
      cy.get(messageInput).focus()
      cy.get(channelContent).assertScrolledToBottom()
      cy.get(channelContent).scrollTo(0, 0).should('have.prop', 'scrollTop', 0)
      cy.get(channelContent).then($el => {
        const container = $el[0]
        const bottom = container.scrollHeight - container.clientHeight
        const pageSize = container.clientHeight * 0.9
        expect(pageSize, 'visible message page').to.be.greaterThan(1)
        expect(bottom, 'history spans more than one page').to.be.greaterThan(pageSize)

        cy.get(messageInput).type('{pagedown}')
        cy.get(channelContent).should($current => {
          expect($current[0].scrollTop, 'one PageDown').to.be.closeTo(pageSize, 1)
        })
        cy.get(messageInput).type('{pagedown}'.repeat(Math.ceil(bottom / Math.floor(pageSize))))
        cy.get(channelContent).assertScrolledToBottom()
      })
    })
  }

  it('Shift+Enter should not send message', () => {
    cy.get(messageInput)
      .focus()
      .type('luke where are you?')
      .type('{shift+enter}')
      .type('you underestimate the power of the force')
      .should('have.text', 'luke where are you?\nyou underestimate the power of the force')
  })

  it('Check words wrapping in message input', () => {
    const longWord = () => {
      let word: string = 'm'
      while (word.length < 150) {
        word = `${word}m`
      }
      return word
    }
    // Get initial height
    let initialHeight: number
    cy.get(messageInput).then($el => {
      initialHeight = $el[0].offsetHeight
    })

    cy.get(messageInput).focus().type(longWord())

    // Check that:
    // 1. Height increased to accommodate the wrapped text
    // 2. The full text is visible
    cy.get(messageInput).then($el => {
      const element = $el[0] as HTMLTextAreaElement
      // Height should be greater after typing long word
      cy.wrap(element.offsetHeight).should('be.gt', initialHeight)

      // Full text should be visible (no truncation)
      cy.wrap(element.value).should('eq', longWord())
      // Scrollable width should not exceed the container width
      // (meaning text is wrapping, not horizontally scrolling)
      cy.wrap(element.scrollWidth).should('eq', element.offsetWidth)
    })
  })

  describe('FloatingDate displays correctly', () => {
    // The scroll wheel was difficult to test, even with cypress-real-events
    // so we're just going to test the pageup and pagedown keys

    it('should not display on channel load', () => {
      cy.get(floatingDateSelector).should('not.be.visible')
    })

    it('should display on pageup', () => {
      cy.get(messageInput).focus().type('{pageup}')
      cy.get(floatingDateSelector).should('be.visible')
    })

    it('should disappear within 3 seconds after scrolling stops', () => {
      cy.clock()
      cy.get(floatingDateSelector).should('not.be.visible')
      cy.get(messageInput).focus().type('{pageup}')
      cy.get(floatingDateSelector).should('be.visible')
      cy.tick(3000)
      cy.get(floatingDateSelector).should('not.be.visible')
    })

    it('should display the correct date text', () => {
      cy.get(channelContent)
      cy.get(messageInput).focus().type('{pageup}')
      cy.get(floatingDateSelector).should('be.visible').invoke('text').should('eq', 'Oct 28, 2023')
    })

    // TODO: Write a test to confirm that sending a message does not make the floating date appear. I had problems getting Cypress to see the floating date after sending a message, so writing a meaningful test is difficult.
  })
})
