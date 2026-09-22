import React from 'react'

import { ChannelInputAction } from './ChannelInputAction'

import { renderComponent } from '../../../testUtils/renderComponent'

describe('ChannelInputAction', () => {
  it('renders component', () => {
    const result = renderComponent(<ChannelInputAction disabled={false} />)
    expect(result.baseElement).toMatchInlineSnapshot(`
      <body>
        <div>
          <div
            class="css-185e8k0"
          >
            <button
              class="MuiButtonBase-root MuiIconButton-root MuiIconButton-sizeLarge MenuActionbutton css-1hy0hhu-MuiButtonBase-root-MuiIconButton-root"
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
