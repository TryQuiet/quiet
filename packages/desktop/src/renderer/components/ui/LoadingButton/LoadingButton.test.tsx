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
            class="MuiButtonBase-root MuiButton-root MuiButton-text makeStyles-button-1"
            tabindex="0"
            type="button"
          >
            <span
              class="MuiButton-label"
            >
              Loading...
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
