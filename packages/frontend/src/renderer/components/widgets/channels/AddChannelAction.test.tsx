import React from 'react'

import { AddChannelAction } from './AddChannelAction'
import { renderComponent } from '../../../testUtils/renderComponent'

describe('BaseChannelsList', () => {
  // TODO: [refactoring] test useState when enzyme is up to date
  it('renders component', () => {
    const openModal = jest.fn()
    const result = renderComponent(<AddChannelAction openCreateModal={openModal} />)
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
