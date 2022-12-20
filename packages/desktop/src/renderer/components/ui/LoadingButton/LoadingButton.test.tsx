import React from 'react'

import { renderComponent } from '../../../testUtils/renderComponent'
import { LoadingButton } from './LoadingButton'

describe('Loading button', () => {
  it('renders component', () => {
    const result = renderComponent(<LoadingButton text='Loading...' />)
    expect(result.baseElement).toMatchInlineSnapshot(`
      <body>
        <div>
          <button
            class="MuiButtonBase-root MuiButton-root MuiButton-text MuiButton-textPrimary MuiButton-sizeMedium MuiButton-textSizeMedium MuiButton-root MuiButton-text MuiButton-textPrimary MuiButton-sizeMedium MuiButton-textSizeMedium LoadingButtonbutton css-sx27b8-MuiButtonBase-root-MuiButton-root"
            tabindex="0"
            type="button"
          >
            Loading...
            <span
              class="MuiTouchRipple-root css-8je8zh-MuiTouchRipple-root"
            />
          </button>
        </div>
      </body>
    `)
  })
})
