import React from 'react'

import { renderComponent } from '../../../testUtils/renderComponent'
import { ChannelHeaderComponent } from './ChannelHeader'

describe('ChannelHeader', () => {
  it('renders component', () => {
    const result = renderComponent(
      <ChannelHeaderComponent
        channel={{
          name: 'general',
          description: 'description',
          owner: 'holmes',
          timestamp: 0,
          address: 'address'
        }}
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
                >
                  <button
                    class="MuiButtonBase-root MuiIconButton-root makeStyles-button-155"
                    tabindex="0"
                    type="button"
                  >
                    <span
                      class="MuiIconButton-label"
                    >
                      <img
                        class="makeStyles-icon-154"
                        src="test-file-stub"
                      />
                    </span>
                  </button>
                </div>
              </div>
            </div>
            <div
              class="MuiGrid-root makeStyles-descriptionDiv-11 MuiGrid-container"
            >
              <div
                class="MuiGrid-root MuiGrid-item MuiGrid-grid-xs-true"
              >
                <p
                  class="MuiTypography-root MuiTypography-body2"
                >
                  description
                </p>
              </div>
              <div
                class="MuiGrid-root makeStyles-iconDiv-13 MuiGrid-item"
              >
                <button
                  class="MuiButtonBase-root MuiIconButton-root makeStyles-root-174"
                  tabindex="0"
                  type="button"
                >
                  <span
                    class="MuiIconButton-label"
                  >
                    <svg
                      aria-hidden="true"
                      class="MuiSvgIcon-root"
                      focusable="false"
                      role="presentation"
                      viewBox="0 0 24 24"
                    >
                      <path
                        d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
                      />
                    </svg>
                  </span>
                  <span
                    class="MuiTouchRipple-root"
                  />
                </button>
              </div>
            </div>
          </div>
        </div>
      </body>
    `)
  })
})
