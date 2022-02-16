import React from 'react'
import '@testing-library/jest-dom/extend-expect'
import userEvent from '@testing-library/user-event'
import { screen } from '@testing-library/dom'
import { renderComponent } from '../../testUtils/renderComponent'

import CreateUsernameComponent from './CreateUsernameComponent'

describe('Add new channel', () => {
  it('Parse user name in real time', async () => {
    renderComponent(
      <CreateUsernameComponent open={true} registerUsername={() => {}} handleClose={() => {}} />
    )

    const input = screen.getByPlaceholderText('Enter a username')

    const assertions = [
      {
        insert: '    ',
        expect: ''
      },
      {
        insert: '----',
        expect: ''
      },
      {
        insert: '-start-with-hyphen',
        expect: 'start-with-hyphen'
      },
      {
        insert: ' start-with-space',
        expect: 'start-with-space'
      },
      {
        insert: 'end-with-hyphen-',
        expect: 'end-with-hyphen-'
      },
      {
        insert: 'end-with-double-hyphen--',
        expect: 'end-with-double-hyphen-'
      },
      {
        insert: 'end-with-space ',
        expect: 'end-with-space-'
      },
      {
        insert: 'end-with-hyphen-space  ',
        expect: 'end-with-hyphen-space-'
      },
      {
        insert: 'UpperCaseToLowerCase',
        expect: 'uppercasetolowercase'
      },
      {
        insert: 'spaces to hyphens',
        expect: 'spaces-to-hyphens'
      },
      {
        insert: 'regular-hyphens',
        expect: 'regular-hyphens'
      }
    ]

    for (const assertion of assertions) {
      userEvent.type(input, assertion.insert)
      expect(input).toHaveValue(assertion.expect)
      userEvent.clear(input)
    }
  })
})
