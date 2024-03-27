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
      isDuplicated: false,
      isRegistered: true,
      pubKey: 'string',
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
        lastConnectedTime={1636995489}
        allPeersDisconnectedTime={undefined}
        connectedPeers={['foobar']}
        communityPeerList={['foobar', 'barbaz']}
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
                  class="MuiListItem-root MuiListItem-gutters MuiListItem-padding BasicMessageComponentwrapper css-6oh3yy-MuiListItem-root"
                >
                  <div
                    class="MuiListItemText-root BasicMessageComponentmessageCard css-tlelie-MuiListItemText-root"
                    data-testid="userMessagesWrapper-string-string"
                  >
                    <div
                      class="MuiGrid-root MuiGrid-container MuiGrid-wrap-xs-nowrap css-aii0rt-MuiGrid-root"
                    >
                      <div
                        class="MuiGrid-root MuiGrid-item BasicMessageComponentavatar css-13i4rnv-MuiGrid-root"
                        data-testid="userAvatar-string-string"
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
                                data-testid="messageDateLabel-string-string"
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
                            class="MuiGrid-root MuiGrid-item css-8e83yq-MuiGrid-root"
                          >
                            <span
                              class="MuiTypography-root MuiTypography-body1 TextMessagemessage css-nx1df2-MuiTypography-root"
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

  it('renders component with unsent messages', async () => {
    const now = DateTime.utc().toSeconds()
    const message = {
      id: 'string',
      type: 1,
      message: 'string',
      createdAt: now,
      date: 'string',
      nickname: 'string',
      isDuplicated: false,
      isRegistered: true,
      pubKey: 'string',
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
        lastConnectedTime={now - 500}
        allPeersDisconnectedTime={now - 1500}
        connectedPeers={[]}
        communityPeerList={['foobar', 'barbaz']}
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
                  class="MuiListItem-root MuiListItem-gutters MuiListItem-padding BasicMessageComponentwrapper css-6oh3yy-MuiListItem-root"
                >
                  <div
                    class="MuiListItemText-root BasicMessageComponentmessageCard css-tlelie-MuiListItemText-root"
                    data-testid="userMessagesWrapper-string-string"
                  >
                    <div
                      class="MuiGrid-root MuiGrid-container MuiGrid-wrap-xs-nowrap css-aii0rt-MuiGrid-root"
                    >
                      <div
                        class="MuiGrid-root MuiGrid-item BasicMessageComponentavatar BasicMessageComponentunsent css-13i4rnv-MuiGrid-root"
                        data-testid="userAvatar-string-string"
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
                                class="MuiTypography-root MuiTypography-body1 BasicMessageComponentusername BasicMessageComponentunsent css-11qbl00-MuiTypography-root"
                              >
                                string
                              </p>
                            </div>
                            <div
                              class="MuiGrid-root MuiGrid-item css-13i4rnv-MuiGrid-root"
                            >
                              <p
                                class="MuiTypography-root MuiTypography-body1 BasicMessageComponenttime BasicMessageComponentunsent css-ghvhpl-MuiTypography-root"
                                data-testid="messageDateLabel-string-string"
                              >
                                string
                              </p>
                            </div>
                            <div
                              class="MuiGrid-root MuiGrid-item BasicMessageComponentsending css-13i4rnv-MuiGrid-root"
                              data-testid="unsent-sending-string-string"
                            >
                              <div
                                class="MuiGrid-root MuiGrid-item css-1hr8piw-MuiGrid-root"
                              >
                                <div
                                  class="MuiGrid-root MuiGrid-item AnimatedEllipsis-wrapper css-13i4rnv-MuiGrid-root"
                                >
                                  <p
                                    class="MuiTypography-root MuiTypography-body1 AnimatedEllipsis-content css-1qmyqlf-MuiTypography-root"
                                  >
                                    Sending
                                  </p>
                                  <p
                                    class="MuiTypography-root MuiTypography-body1 AnimatedEllipsis-dot1 css-1qmyqlf-MuiTypography-root"
                                  >
                                    .
                                  </p>
                                  <p
                                    class="MuiTypography-root MuiTypography-body1 AnimatedEllipsis-dot2 css-1qmyqlf-MuiTypography-root"
                                  >
                                    .
                                  </p>
                                  <p
                                    class="MuiTypography-root MuiTypography-body1 AnimatedEllipsis-dot3 css-1qmyqlf-MuiTypography-root"
                                  >
                                    .
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div
                          class="MuiGrid-root MuiGrid-container MuiGrid-direction-xs-column css-1vpwcmr-MuiGrid-root"
                          data-testid="userMessages-string-string"
                          style="margin-top: -3px;"
                        >
                          <div
                            class="MuiGrid-root MuiGrid-item css-8e83yq-MuiGrid-root"
                          >
                            <span
                              class="MuiTypography-root MuiTypography-body1 TextMessagemessage TextMessageunsent css-nx1df2-MuiTypography-root"
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
