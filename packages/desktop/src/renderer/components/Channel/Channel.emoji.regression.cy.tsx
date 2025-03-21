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
  