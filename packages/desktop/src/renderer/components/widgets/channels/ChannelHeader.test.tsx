import React from 'react'

import { renderComponent } from '../../../testUtils/renderComponent'
import { ChannelHeaderComponent } from './ChannelHeader'

describe('ChannelHeader', () => {
  it('renders component', () => {
    const result = renderComponent(
      <ChannelHeaderComponent
        channelName='general'
        onInfo={jest.fn()}
        onDelete={jest.fn()}
        onSettings={jest.fn()}
        mutedFlag={false}
        notificationFilter={''}
        openNotificationsTab={jest.fn()}
      />
    )
    expect(result.baseElement).toMatchInlineSnapshot(`
      <body>
        <div>
          <div
            class="ChannelHeaderComponentwrapper css-1rciqyg"
          >
            <div
              class="MuiGrid-root MuiGrid-container ChannelHeaderComponentroot css-9cyib4-MuiGrid-root"
            >
              <div
                class="MuiGrid-root MuiGrid-item css-13i4rnv-MuiGrid-root"
              >
                <div
                  class="MuiGrid-root MuiGrid-container MuiGrid-item css-lx31tv-MuiGrid-root"
                >
                  <div
                    class="MuiGrid-root MuiGrid-item css-13i4rnv-MuiGrid-root"
                  >
                    <h6
                      class="MuiTypography-root MuiTypography-subtitle1 MuiTypography-noWrap ChannelHeaderComponenttitle ChannelHeaderComponentbold css-b4jm9l-MuiTypography-root"
                      data-testid="channelTitle"
                      style="max-width: 724px;"
                    >
                      #general
                    </h6>
                  </div>
                </div>
              </div>
              <div
                class="MuiGrid-root MuiGrid-container MuiGrid-item MuiGrid-grid-xs-true ChannelHeaderComponentactions css-s0ysqh-MuiGrid-root"
              >
                <div
                  class="MuiGrid-root MuiGrid-item css-13i4rnv-MuiGrid-root"
                />
              </div>
            </div>
          </div>
        </div>
      </body>
    `)
  })
})
