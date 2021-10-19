import React from 'react'

import { ChannelInputAction } from './ChannelInputAction'

import { renderComponent } from '../../../testUtils/renderComponent'

describe('ChannelInputAction', () => {
  it('renders component', () => {
    const result = renderComponent(
      <ChannelInputAction disabled={false} />
    )
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
