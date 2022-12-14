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
            class="MuiButtonBase-root MuiIconButton-root IconButtonroot MuiIconButton-sizeMedium css-c8hoqc-MuiButtonBase-root-MuiIconButton-root"
            tabindex="0"
            type="button"
          >
            <div>
              Icon
            </div>
            <span
              class="MuiTouchRipple-root css-8je8zh-MuiTouchRipple-root"
            />
          </button>
        </div>
      </body>
    `)
  })
})
