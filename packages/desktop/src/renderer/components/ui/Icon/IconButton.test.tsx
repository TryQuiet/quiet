import React from 'react'

import { renderComponent } from '../../../testUtils/renderComponent'
import { IconButton } from './IconButton'

describe('IconButton', () => {
  const Icon = () => <div>Icon</div>
  it('renders component', () => {
    const result = renderComponent(
      <IconButton onClick={jest.fn()}>
        <Icon />
      </IconButton>
    )
    expect(result.baseElement).toMatchInlineSnapshot(`
      <body>
        <div>
          <button
            class="MuiButtonBase-root MuiIconButton-root makeStyles-root-1"
            tabindex="0"
            type="button"
          >
            <span
              class="MuiIconButton-label"
            >
              <div>
                Icon
              </div>
            </span>
            <span
              class="MuiTouchRipple-root"
            />
          </button>
        </div>
      </body>
    `)
  })
})
