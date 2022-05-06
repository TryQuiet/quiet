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
            class="makeStyles-wrapper-12"
          >
            <div
              class="MuiGrid-root makeStyles-root-1 MuiGrid-container MuiGrid-align-items-xs-center MuiGrid-justify-xs-space-between"
            >
              <div
                class="MuiGrid-root MuiGrid-item"
              >
                <div
                  class="MuiGrid-root MuiGrid-container MuiGrid-item MuiGrid-align-items-xs-center"
                >
                  <div
                    class="MuiGrid-root MuiGrid-item"
                  >
                    <h6
                      class="MuiTypography-root makeStyles-title-2 makeStyles-bold-15 MuiTypography-subtitle1 MuiTypography-noWrap"
                      data-testid="channelTitle"
                      style="max-width: 724px;"
                    >
                      #general
                    </h6>
                  </div>
                </div>
              </div>
              <div
                class="MuiGrid-root makeStyles-actions-5 MuiGrid-container MuiGrid-item MuiGrid-align-items-xs-center MuiGrid-align-content-xs-center MuiGrid-justify-xs-flex-end MuiGrid-grid-xs-true"
              >
                <div
                  class="MuiGrid-root MuiGrid-item"
                />
              </div>
            </div>
          </div>
        </div>
      </body>
    `)
  })
})
