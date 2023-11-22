import React from 'react'

import { renderComponent } from '../../../testUtils/renderComponent'
import { ChannelHeaderComponent } from './ChannelHeader'

describe('ChannelHeader', () => {
    it('hides context menu', () => {
        const result = renderComponent(<ChannelHeaderComponent channelName='general' enableContextMenu={false} />)
        expect(result.baseElement).toMatchInlineSnapshot(`
      <body>
        <div>
          <div
            class="ChannelHeaderComponentwrapper css-duzuvw"
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
              />
            </div>
          </div>
        </div>
      </body>
    `)
    })
    it('reveals context menu', () => {
        const result = renderComponent(<ChannelHeaderComponent channelName='general' enableContextMenu={true} />)
        expect(result.baseElement).toMatchInlineSnapshot(`
      <body>
        <div>
          <div
            class="ChannelHeaderComponentwrapper css-duzuvw"
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
                  class="MuiGrid-root MuiGrid-item ChannelHeaderComponentmenu css-13i4rnv-MuiGrid-root"
                  data-testid="channelContextMenuButton"
                >
                  <img
                    src="test-file-stub"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </body>
    `)
    })
})
