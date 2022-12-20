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
            class="MuiGrid-root MuiGrid-container css-1g9kzhb-MuiGrid-root"
          >
            <img
              src="test-file-stub"
            />
            <div
              class="MuiGrid-root MuiGrid-item css-13i4rnv-MuiGrid-root"
            >
              <span
                class="MuiTypography-root MuiTypography-caption ChannelMessageActionswarrning css-1d4bzk2-MuiTypography-root"
              >
                Coudn't send.
              </span>
            </div>
            <div
              class="MuiGrid-root MuiGrid-item ChannelMessageActionspointer css-13i4rnv-MuiGrid-root"
            >
              <span
                class="MuiTypography-root MuiTypography-caption ChannelMessageActionstryAgain css-1d4bzk2-MuiTypography-root"
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
