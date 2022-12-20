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
          <div
            class="css-164bpf2"
          >
            <button
              class="MuiButtonBase-root MuiIconButton-root MuiIconButton-sizeLarge MenuActionbutton css-1awz4e2-MuiButtonBase-root-MuiIconButton-root"
              tabindex="0"
              type="button"
            >
              <img
                class="MenuActionicon"
                src="test-file-stub"
              />
            </button>
          </div>
        </div>
      </body>
    `)
  })
})
