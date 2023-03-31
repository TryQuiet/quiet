import '@testing-library/jest-dom'
import React from 'react'
import { renderComponent } from '../../../../testUtils/renderComponent'
import { InviteComponent } from './Invite.component'

describe('CopyLink', () => {
  it('renderComponent- long link', () => {
    const result = renderComponent(
      <InviteComponent
        invitationLink={
          'https://tryquiet.org/join?code=http://p7lrosb6fvtt7t3fhmuh5uj5twxirpngeipemdm5d32shgz46cbd3bad.onion'
        }
        openUrl={() => console.log('url')}
      />
    )
    expect(result.baseElement).toMatchInlineSnapshot()
  })

  it('renderComponent - short link', () => {
    const result = renderComponent(
      <InviteComponent
        invitationLink={'https://tryquiet.org/'}
        openUrl={() => console.log('url')}
      />
    )
    expect(result.baseElement).toMatchInlineSnapshot()
  })
})
