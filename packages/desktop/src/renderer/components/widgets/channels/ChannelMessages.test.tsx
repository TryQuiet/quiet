import React from 'react'
import { renderComponent } from '../../../testUtils/renderComponent'
import { DateTime } from 'luxon'
import { ChannelMessagesComponent } from './ChannelMessages'

describe('ChannelMessages', () => {
  beforeEach(() => {
    window.ResizeObserver = jest.fn().mockImplementation(() => ({
      observe: jest.fn(),
      unobserve: jest.fn(),
      disconnect: jest.fn()
    }))
  })

  it('renders component', async () => {
    const message = {
      id: 'string',
      type: 1,
      message: 'string',
      createdAt: 1636995488.44,
      date: 'string',
      nickname: 'string'
    }

    jest.spyOn(DateTime, 'utc').mockImplementationOnce(() => DateTime.utc(2019, 3, 7, 13, 3, 48))

    const messages = {
      Today: [[message]]
    }

    const result = renderComponent(
      <ChannelMessagesComponent messages={messages} scrollbarRef={jest.fn()} onScroll={jest.fn()} dropTargetRef={jest.fn()} />
    )

    expect(result.baseElement).toMatchInlineSnapshot(`
      <body>
        <div>
          <div
            class="makeStyles-scroll-2"
            data-testid="channelContent"
          >
            <ul
              class="MuiList-root makeStyles-list-3"
              id="messages-scroll"
            >
              <div>
                <div
                  class="MuiGrid-root MuiGrid-container MuiGrid-align-items-xs-center MuiGrid-justify-xs-center"
                >
                  <div
                    class="MuiGrid-root MuiGrid-item MuiGrid-grid-xs-true"
                  >
                    <div
                      class="makeStyles-divider-14"
                    />
                  </div>
                  <div
                    class="MuiGrid-root makeStyles-titleDiv-15 MuiGrid-item"
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
                      class="makeStyles-divider-14"
                    />
                  </div>
                </div>
                <li
                  class="MuiListItem-root makeStyles-wrapper-150 MuiListItem-gutters"
                >
                  <div
                    class="MuiListItemText-root makeStyles-messageCard-149"
                  >
                    <div
                      class="MuiGrid-root MuiGrid-container MuiGrid-wrap-xs-nowrap MuiGrid-align-items-xs-flex-start"
                    >
                      <div
                        class="MuiGrid-root makeStyles-avatar-157 MuiGrid-item"
                      >
                        <div
                          class="makeStyles-alignAvatar-158"
                        >
                          Jdenticon
                        </div>
                      </div>
                      <div
                        class="MuiGrid-root MuiGrid-container MuiGrid-item"
                      >
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
                                class="MuiTypography-root makeStyles-username-153 MuiTypography-body1 MuiTypography-colorTextPrimary"
                              >
                                string
                              </p>
                            </div>
                            <div
                              class="MuiGrid-root MuiGrid-item"
                            >
                              <p
                                class="MuiTypography-root makeStyles-time-160 MuiTypography-body1"
                              >
                                string
                              </p>
                            </div>
                          </div>
                        </div>
                        <div
                          class="MuiGrid-root MuiGrid-container MuiGrid-direction-xs-column"
                          data-testid="userMessages-string-string"
                        >
                          <div
                            class="MuiGrid-root makeStyles-firstMessage-181 MuiGrid-item"
                          >
                            <span
                              class="MuiTypography-root makeStyles-message-180 MuiTypography-body1"
                              data-testid="messagesGroupContent-string"
                            >
                              string
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              </div>
            </ul>
          </div>
        </div>
      </body>
    `)
  })
})
