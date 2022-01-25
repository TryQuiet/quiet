import React from 'react'

import { ChannelMessageActions } from './ChannelMessageActions'
import { renderComponent } from '../../../testUtils/renderComponent'

describe('ChannelMessageActions', () => {
  it('renders component', () => {
    const result = renderComponent(<ChannelMessageActions onResend={jest.fn()} />)
    expect(result.baseElement).toMatchInlineSnapshot(`
      <body>
        <div>
          <div
            class="MuiGrid-root MuiGrid-container MuiGrid-align-items-xs-center"
          >
            <img
              src="test-file-stub"
            />
            <div
              class="MuiGrid-root MuiGrid-item"
            >
              <span
                class="MuiTypography-root makeStyles-warrning-1 MuiTypography-caption"
              >
                Coudn't send.
              </span>
            </div>
            <div
              class="MuiGrid-root makeStyles-pointer-3 MuiGrid-item"
            >
              <span
                class="MuiTypography-root makeStyles-tryAgain-2 MuiTypography-caption"
              >
                Try again
              </span>
            </div>
          </div>
        </div>
      </body>
    `)
  })
})
