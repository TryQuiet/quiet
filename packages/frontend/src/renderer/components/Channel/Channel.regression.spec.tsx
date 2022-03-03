import React from 'react'
import { mount } from '@cypress/react'
import { composeStories, setGlobalConfig } from '@storybook/testing-react'
import * as stories from './Channel.stories'
import { withTheme } from '../../storybook/decorators'
import CssBaseline from '@material-ui/core/CssBaseline'
const compareSnapshotCommand = require('cypress-visual-regression/dist/command');

compareSnapshotCommand();

import { it, cy } from 'local-cypress'

setGlobalConfig(withTheme)

const { Component } = composeStories(stories)

describe ('Cypress test', () => {
  it('should render basic component', () => {
    mount(
    <React.Fragment>
       <CssBaseline>
          <Component />
      </CssBaseline>
    </React.Fragment>
  )
  
  // console.log(Cypress.config())
  // @ts-ignore
  
  cy.get('[data-testid="channelContent"]').scrollTo(0,300).compareSnapshot('justHeadser')
  // cy.get('[data-testid="channelContent"]').scrollTo(0,500).task('cypress-plugin-snapshot:matchImage')


  
  
  // cy.compareSnapshot('login', 0.0)
  // cy.task('log', 'myMessage One')

  
  cy.get('[data-testid="messageInput"]')
  // cy.get('[data-testid="messageInput"]').focus().type('dupa').type("{enter}")
  // cy.get('[data-testid="messageInput"]').focus().type('1').type("{enter}")
  // cy.get('[data-testid="messageInput"]').focus().type('1').type("{enter}")
  
  // cy.get('[data-testid="channelContent"]').scrollTo(0,-5000)
  // cy.get('[data-testid="channelContent"]').scrollTo(0,50)

  // cy.percySnapshot()
  
  // cy.get('[data-testid="messageInput"]').matchimagesnapshot
})
})