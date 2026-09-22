import React from 'react'
import CssBaseline from '@mui/material/CssBaseline'
import { composeStories, setGlobalConfig } from '@storybook/testing-react'
import { it, beforeEach, cy, Cypress, describe, expect } from 'local-cypress'

import * as stories from '../../Channel/Channel.stories'
import { withTheme } from '../../../storybook/decorators'
import { mount } from 'cypress/react18'

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

// Regression guard for https://github.com/TryQuiet/quiet/issues/372.
// A run that is too long for one line must start on a line of its own; the ordinary
// words before it must stay together on the preceding line. `overflow-wrap: anywhere`
// on `.TextMessagemessage` only permits a mid-word break when the line has no other
// acceptable break point, so the space before the long run has to win.
const LINK =
  'http://linksfahfalskjfhalskjfhlaksjfhalkshfalksdfhaslkdjfhsldkfaskhfaslkdjfhaslkdjfhaslkdfjhasldkfahslkdfjhasldfkjahsldfkjhasdfkjhjfad.com'
const LONG_WORD = 'z'.repeat(130)

/** Bounding rect of `text` within the message span's first text node. */
const rectOf = (span: HTMLElement, text: string): DOMRect => {
  const walker = document.createTreeWalker(span, NodeFilter.SHOW_TEXT)
  let node: Node | null
  while ((node = walker.nextNode())) {
    const idx = (node.textContent || '').indexOf(text)
    if (idx === -1) continue
    const range = document.createRange()
    range.setStart(node, idx)
    range.setEnd(node, idx + text.length)
    return range.getBoundingClientRect()
  }
  throw new Error(`"${text}" not found in message`)
}

const send = (message: string) => {
  cy.get('[data-testid="messageInput"]')
    .focus()
    .type(message, { delay: 0, parseSpecialCharSequences: false })
    .type('{enter}')
  cy.contains('new word')
}

/**
 * `first` and `second` must share a line, and `longRun` must begin below them at the
 * left edge of the message column. Assertions are all relative, so they hold for any
 * font the test machine happens to resolve.
 */
const assertLongRunStartsItsOwnLine = (getLongRunRect: (span: HTMLElement) => DOMRect) =>
  cy
    .get('span[data-testid^="messagesGroupContent-"]')
    .last()
    .then($el => {
      const span = $el[0]
      const first = rectOf(span, 'new')
      const second = rectOf(span, 'word')
      const longRun = getLongRunRect(span)
      const columnLeft = Math.round(span.getBoundingClientRect().left)

      expect(Math.round(second.top), '"word" shares a line with "new"').to.equal(Math.round(first.top))
      expect(Math.round(longRun.top), 'long run starts below "new word"').to.be.greaterThan(Math.round(first.top))
      expect(Math.round(longRun.left), 'long run starts at the left edge of the message column').to.equal(columnLeft)
    })

describe('Long runs wrap onto their own line (issue #372)', () => {
  beforeEach(() => {
    cy.viewport(600, 700)
    mount(
      <React.Fragment>
        <CssBaseline>
          <SendingMessagesWithScroll />
        </CssBaseline>
      </React.Fragment>
    )
    cy.wait(0)
  })

  it('keeps "new word" together and starts an autolinked URL on the next line', () => {
    send(`new word ${LINK}`)
    assertLongRunStartsItsOwnLine(span => {
      const anchor = span.querySelector('a')
      if (!anchor) throw new Error('URL was not autolinked')
      return anchor.getClientRects()[0] as DOMRect
    })
  })

  it('keeps "new word" together and starts a long unbroken word on the next line', () => {
    send(`new word ${LONG_WORD}`)
    assertLongRunStartsItsOwnLine(span => rectOf(span, LONG_WORD.slice(0, 3)))
  })
})
