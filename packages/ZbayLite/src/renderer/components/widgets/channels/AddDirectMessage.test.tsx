import React from 'react'

import { AddDirectMessage } from './AddDirectMessage'
import { renderComponent } from '../../../testUtils/renderComponent'

describe('AddDirectMessage', () => {
  it('renders component', () => {
    const openModal = jest.fn()
    const result = renderComponent(<AddDirectMessage openModal={openModal} />)
    expect(result.baseElement).toMatchInlineSnapshot(`
      <body>
        <div>
          <button
            class="MuiButtonBase-root MuiIconButton-root makeStyles-button-3"
            tabindex="0"
            type="button"
          >
            <span
              class="MuiIconButton-label"
            >
              <img
                class="makeStyles-icon-2"
                src="test-file-stub"
              />
            </span>
          </button>
        </div>
      </body>
    `)
  })
})
