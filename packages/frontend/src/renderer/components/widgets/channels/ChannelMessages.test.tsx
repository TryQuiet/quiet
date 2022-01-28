import React from 'react'
import { renderComponent } from '../../../testUtils/renderComponent'
import { DateTime } from 'luxon'
import { ChannelMessagesComponent } from './ChannelMessages'

describe('ChannelMessages', () => {
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
      count: 1,
      groups: {
        Today: [[message]]
      }
    }

    const result = renderComponent(
      <ChannelMessagesComponent channel={'general'} messages={messages} />
    )

    expect(result.baseElement).toMatchInlineSnapshot(`
      <body>
        <div>
          <div
            class="makeStyles-scroll-1"
          >
            <ul
              class="MuiList-root makeStyles-list-2"
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
                      class="makeStyles-divider-13"
                    />
                  </div>
                  <div
                    class="MuiGrid-root makeStyles-titleDiv-14 MuiGrid-item"
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
                      class="makeStyles-divider-13"
                    />
                  </div>
                </div>
                <li
                  class="MuiListItem-root makeStyles-wrapper-149 makeStyles-wrapperPending-151 MuiListItem-gutters"
                >
                  <div
                    class="MuiListItemText-root makeStyles-messageCard-148"
                  >
                    <div
                      class="MuiGrid-root MuiGrid-container MuiGrid-wrap-xs-nowrap MuiGrid-align-items-xs-flex-start"
                    >
                      <div
                        class="MuiGrid-root makeStyles-avatar-156 MuiGrid-item"
                      >
                        <div
                          class="makeStyles-alignAvatar-157"
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
                                class="MuiTypography-root makeStyles-username-152 MuiTypography-body1 MuiTypography-colorTextPrimary"
                              >
                                string
                              </p>
                            </div>
                            <div
                              class="MuiGrid-root MuiGrid-item"
                            >
                              <p
                                class="MuiTypography-root makeStyles-time-159 MuiTypography-body1"
                              >
                                string
                              </p>
                            </div>
                          </div>
                        </div>
                        <div
                          class="MuiGrid-root MuiGrid-container MuiGrid-direction-xs-column"
                        >
                          <div
                            class="MuiGrid-root makeStyles-firstMessage-179 MuiGrid-item"
                          >
                            <p
                              class="MuiTypography-root makeStyles-message-178 MuiTypography-body1"
                              data-testid="messagesGroupContent-string"
                            >
                              string
                            </p>
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
