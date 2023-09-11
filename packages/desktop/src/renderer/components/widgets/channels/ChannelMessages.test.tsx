import React from 'react'
import { renderComponent } from '../../../testUtils/renderComponent'
import { DateTime } from 'luxon'
import { ChannelMessagesComponent } from './ChannelMessages'

describe('ChannelMessages', () => {
  beforeEach(() => {
    window.ResizeObserver = jest.fn().mockImplementation(() => ({
      observe: jest.fn(),
      unobserve: jest.fn(),
      disconnect: jest.fn(),
    }))
  })

  it('renders component', async () => {
    const message = {
      id: 'string',
      type: 1,
      message: 'string',
      createdAt: 1636995488.44,
      date: 'string',
      nickname: 'string',
    }

    jest.spyOn(DateTime, 'utc').mockImplementationOnce(() => DateTime.utc(2019, 3, 7, 13, 3, 48))

    const messages = {
      Today: [[message]],
    }

    const result = renderComponent(
      <ChannelMessagesComponent
        duplicatedUsernameModalHandleOpen={jest.fn()}
        unregisteredUsernameModalHandleOpen={jest.fn()}
        messages={messages}
        scrollbarRef={React.createRef()}
        onScroll={jest.fn()}
        openUrl={jest.fn()}
      />
    )

    expect(result.baseElement).toMatchInlineSnapshot(`
      <body>
        <div>
          <div
            class="ChannelMessagesComponentscroll css-gca61p"
            data-testid="channelContent"
          >
            <ul
              class="MuiList-root ChannelMessagesComponentlist css-1mk9mw3-MuiList-root"
              id="messages-scroll"
              tabindex="0"
            >
              <div>
                <div
                  class="MuiGrid-root MuiGrid-container css-1nj3j97-MuiGrid-root"
                >
                  <div
                    class="MuiGrid-root MuiGrid-item MuiGrid-grid-xs-true css-1vd824g-MuiGrid-root"
                  >
                    <div
                      class="MessagesDividerdivider"
                    />
                  </div>
                  <div
                    class="MuiGrid-root MuiGrid-item MessagesDividertitleDiv css-13i4rnv-MuiGrid-root"
                  >
                    <p
                      class="MuiTypography-root MuiTypography-body1 css-ghvhpl-MuiTypography-root"
                    >
                      Today
                    </p>
                  </div>
                  <div
                    class="MuiGrid-root MuiGrid-item MuiGrid-grid-xs-true css-1vd824g-MuiGrid-root"
                  >
                    <div
                      class="MessagesDividerdivider"
                    />
                  </div>
                </div>
                <li
                  class="MuiListItem-root MuiListItem-gutters MuiListItem-padding BasicMessageComponentwrapper css-13gdcvl-MuiListItem-root"
                >
                  <div
                    class="MuiListItemText-root BasicMessageComponentmessageCard css-tlelie-MuiListItemText-root"
                  >
                    <div
                      class="MuiGrid-root MuiGrid-container MuiGrid-wrap-xs-nowrap css-aii0rt-MuiGrid-root"
                    >
                      <div
                        class="MuiGrid-root MuiGrid-item BasicMessageComponentavatar css-13i4rnv-MuiGrid-root"
                      >
                        <div
                          class="BasicMessageComponentalignAvatar"
                        >
                          Jdenticon
                        </div>
                      </div>
                      <div
                        class="MuiGrid-root MuiGrid-container MuiGrid-item css-1f064cs-MuiGrid-root"
                      >
                        <div
                          class="MuiGrid-root MuiGrid-container MuiGrid-item css-89gxc5-MuiGrid-root"
                        >
                          <div
                            class="MuiGrid-root MuiGrid-container MuiGrid-item MuiGrid-wrap-xs-nowrap MuiGrid-grid-xs-true css-181g0at-MuiGrid-root"
                          >
                            <div
                              class="MuiGrid-root MuiGrid-item css-13i4rnv-MuiGrid-root"
                            >
                              <p
                                class="MuiTypography-root MuiTypography-body1 BasicMessageComponentusername css-11qbl00-MuiTypography-root"
                              >
                                string
                              </p>
                            </div>
                            <div
                              class="MuiGrid-root MuiGrid-item css-13i4rnv-MuiGrid-root"
                            >
                              <p
                                class="MuiTypography-root MuiTypography-body1 BasicMessageComponenttime css-ghvhpl-MuiTypography-root"
                              >
                                string
                              </p>
                            </div>
                          </div>
                        </div>
                        <div
                          class="MuiGrid-root MuiGrid-container MuiGrid-direction-xs-column css-1vpwcmr-MuiGrid-root"
                          data-testid="userMessages-string-string"
                          style="margin-top: -3px;"
                        >
                          <div
                            class="MuiGrid-root MuiGrid-item css-15myz84-MuiGrid-root"
                          >
                            <span
                              class="MuiTypography-root MuiTypography-body1 TextMessagemessage css-1vefsqk-MuiTypography-root"
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
