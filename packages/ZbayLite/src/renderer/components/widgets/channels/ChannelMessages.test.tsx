import React from 'react'
import { DateTime } from 'luxon'

import { now } from '../../../testUtils'
import { ChannelMessages } from './ChannelMessages'
import { renderComponent } from '../../../testUtils/renderComponent'
import { HashRouter } from 'react-router-dom'
import { Provider } from 'react-redux'
import store from '../../../store'

describe('ChannelMessages', () => {
  it('renders component', async () => {
    const message = {
      id: 'string',
      type: 1,
      message: 'string',
      createdAt: 'string',
      nickname: 'string'
    }

    jest.spyOn(DateTime, 'utc').mockImplementationOnce(() => now)
    const messages = [message]
    const contentRect = {
      bounds: {
        height: 200
      }
    }
    const result = renderComponent(
      <HashRouter>
        <Provider store={store}>
          <ChannelMessages messages={messages} contentRect={contentRect} />
        </Provider>
      </HashRouter>
    )
    expect(result.baseElement).toMatchInlineSnapshot(`
      <body>
        <div>
          <div
            class="rc-scrollbars-container"
            style="position: relative; overflow: hidden; width: 100%; height: 100%;"
          >
            <div
              class="rc-scrollbars-view"
              style="position: absolute; top: 0px; left: 0px; right: 0px; bottom: 0px; overflow: scroll; margin-right: 0px; margin-bottom: 0px;"
            >
              <ul
                class="MuiList-root makeStyles-list-1"
                id="messages-scroll"
              >
                <div
                  class="MuiGrid-root MuiGrid-container MuiGrid-align-items-xs-center MuiGrid-justify-xs-center"
                >
                  <div
                    class="MuiGrid-root MuiGrid-item MuiGrid-grid-xs-true"
                  >
                    <div
                      class="makeStyles-divider-12"
                    />
                  </div>
                  <div
                    class="MuiGrid-root makeStyles-titleDiv-13 MuiGrid-item"
                  >
                    <p
                      class="MuiTypography-root MuiTypography-body1"
                    >
                      Today
                    </p>
                  </div>
                  <div
                    class="MuiGrid-root MuiGrid-item MuiGrid-grid-xs-true"
                  >
                    <div
                      class="makeStyles-divider-12"
                    />
                  </div>
                </div>
                <li
                  class="MuiListItem-root makeStyles-wrapper-157 makeStyles-wrapperPending-159 MuiListItem-gutters"
                >
                  <div
                    class="MuiListItemText-root makeStyles-messageCard-156"
                  >
                    <div
                      class="MuiGrid-root MuiGrid-container MuiGrid-wrap-xs-nowrap MuiGrid-align-items-xs-flex-start"
                    >
                      <div
                        class="MuiGrid-root makeStyles-avatar-165 MuiGrid-item"
                      >
                        <div
                          class="makeStyles-alignAvatar-166"
                        >
                          Jdenticon
                        </div>
                      </div>
                      <div
                        class="MuiGrid-root MuiGrid-container MuiGrid-item MuiGrid-justify-xs-space-between"
                      >
                        <div
                          class="MuiGrid-root MuiGrid-container MuiGrid-item MuiGrid-wrap-xs-nowrap MuiGrid-align-items-xs-flex-start MuiGrid-grid-xs-true"
                        >
                          <div
                            class="MuiGrid-root MuiGrid-item"
                          >
                            <p
                              class="MuiTypography-root makeStyles-username-160 MuiTypography-body1 MuiTypography-colorTextPrimary"
                            >
                              string
                            </p>
                          </div>
                          <div
                            class="MuiGrid-root MuiGrid-item"
                          >
                            <p
                              class="MuiTypography-root makeStyles-time-168 MuiTypography-body1"
                            >
                              string
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              </ul>
            </div>
            <div
              class="rc-scrollbars-track rc-scrollbars-track-h"
              style="position: absolute; right: 2px; bottom: 2px; z-index: 100; border-radius: 3px; left: 2px; height: 6px; display: none;"
            >
              <div
                class="rc-scrollbars-thumb rc-scrollbars-thumb-h"
                style="position: relative; display: block; height: 100%; cursor: pointer; border-radius: inherit; background-color: rgba(0, 0, 0, 0.2);"
              />
            </div>
            <div
              class="rc-scrollbars-track rc-scrollbars-track-v"
              style="position: absolute; right: 2px; bottom: 2px; z-index: 100; border-radius: 3px; top: 2px; width: 6px; display: none;"
            >
              <div
                class="rc-scrollbars-thumb rc-scrollbars-thumb-v"
                style="position: relative; display: block; height: 100%; cursor: pointer; border-radius: inherit; background-color: rgba(0, 0, 0, 0.2);"
              />
            </div>
          </div>
        </div>
      </body>
    `)
  })
})
