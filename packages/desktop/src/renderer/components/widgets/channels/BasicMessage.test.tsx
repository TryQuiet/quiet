import React from 'react'
import { DateTime } from 'luxon'

import { BasicMessageComponent } from './BasicMessage'

import { renderComponent, generateMessages } from '../../../testUtils'
import { HashRouter } from 'react-router-dom'
import { Provider } from 'react-redux'
import store from '../../../store'

describe('BasicMessage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(DateTime, 'utc').mockImplementationOnce(() => DateTime.utc(2019, 3, 7, 13, 3, 48))
  })

  describe('sent messages', () => {
    it('renders component', async () => {
      const messages = generateMessages()
      const result = renderComponent(
        <HashRouter>
          <Provider store={store}>
            <BasicMessageComponent
              duplicatedUsernameModalHandleOpen={jest.fn()}
              unregisteredUsernameModalHandleOpen={jest.fn()}
              messages={messages}
              lastConnectedTime={DateTime.utc().toSeconds() - 1000}
              allPeersDisconnectedTime={undefined}
              connectedPeers={['foobar']}
              communityPeerList={['foobar', 'barbaz']}
              openUrl={jest.fn()}
            />
          </Provider>
        </HashRouter>
      )
      expect(result.baseElement).toMatchInlineSnapshot(`
        <body>
          <div>
            <li
              class="MuiListItem-root MuiListItem-gutters MuiListItem-padding BasicMessageComponentwrapper css-6oh3yy-MuiListItem-root"
            >
              <div
                class="MuiListItemText-root BasicMessageComponentmessageCard css-tlelie-MuiListItemText-root"
                data-testid="userMessagesWrapper-gringo-0"
              >
                <div
                  class="MuiGrid-root MuiGrid-container MuiGrid-wrap-xs-nowrap css-aii0rt-MuiGrid-root"
                >
                  <div
                    class="MuiGrid-root MuiGrid-item BasicMessageComponentavatar css-13i4rnv-MuiGrid-root"
                    data-testid="userAvatar-gringo-0"
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
                      <span
                        class="MuiTypography-root MuiTypography-body1 TextMessagemessage css-1xya0ai-MuiTypography-root"
                        data-testid="messagesGroupContent-0"
                      >
                        <div
                          class="MuiGrid-root MuiGrid-item css-13i4rnv-MuiGrid-root"
                        >
                          <p
                            class="MuiTypography-root MuiTypography-body1 BasicMessageComponentusername css-11qbl00-MuiTypography-root"
                          >
                            gringo
                          </p>
                        </div>
                        <div
                          class="MuiGrid-root MuiGrid-item css-13i4rnv-MuiGrid-root"
                        >
                          <p
                            class="MuiTypography-root MuiTypography-body1 BasicMessageComponenttime css-ghvhpl-MuiTypography-root"
                            data-testid="messageDateLabel-gringo-0"
                          >
                            string
                          </p>
                        </div>
                      </div>
                    </div>
                    <div
                      class="MuiGrid-root MuiGrid-container MuiGrid-direction-xs-column css-1vpwcmr-MuiGrid-root"
                      data-testid="userMessages-gringo-0"
                      style="margin-top: -3px;"
                    >
                      <div
                        class="MuiGrid-root MuiGrid-item css-8e83yq-MuiGrid-root"
                      >
                        <span
                          class="MuiTypography-root MuiTypography-body1 TextMessagemessage css-nx1df2-MuiTypography-root"
                          data-testid="messagesGroupContent-0"
                        >
                          message0
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </li>
          </div>
        </body>
      `)
    })

    it('renders component with multiple messages', async () => {
      const messages = generateMessages({ amount: 2 })
      const result = renderComponent(
        <HashRouter>
          <Provider store={store}>
            <BasicMessageComponent
              duplicatedUsernameModalHandleOpen={jest.fn()}
              unregisteredUsernameModalHandleOpen={jest.fn()}
              lastConnectedTime={DateTime.utc().toSeconds() - 1000}
              allPeersDisconnectedTime={undefined}
              messages={messages}
              connectedPeers={['foobar']}
              communityPeerList={['foobar', 'barbaz']}
              openUrl={jest.fn()}
            />
          </Provider>
        </HashRouter>
      )
      expect(result.baseElement).toMatchInlineSnapshot(`
        <body>
          <div>
            <li
              class="MuiListItem-root MuiListItem-gutters MuiListItem-padding BasicMessageComponentwrapper css-6oh3yy-MuiListItem-root"
            >
              <div
                class="MuiListItemText-root BasicMessageComponentmessageCard css-tlelie-MuiListItemText-root"
                data-testid="userMessagesWrapper-gringo-0"
              >
                <div
                  class="MuiGrid-root MuiGrid-container MuiGrid-wrap-xs-nowrap css-aii0rt-MuiGrid-root"
                >
                  <div
                    class="MuiGrid-root MuiGrid-item BasicMessageComponentavatar css-13i4rnv-MuiGrid-root"
                    data-testid="userAvatar-gringo-0"
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
                            gringo
                          </p>
                        </div>
                        <div
                          class="MuiGrid-root MuiGrid-item css-13i4rnv-MuiGrid-root"
                        >
                          <p
                            class="MuiTypography-root MuiTypography-body1 BasicMessageComponenttime css-ghvhpl-MuiTypography-root"
                            data-testid="messageDateLabel-gringo-0"
                          >
                            string
                          </p>
                        </div>
                      </div>
                    </div>
                    <div
                      class="MuiGrid-root MuiGrid-container MuiGrid-direction-xs-column css-1vpwcmr-MuiGrid-root"
                      data-testid="userMessages-gringo-0"
                      style="margin-top: -3px;"
                    >
                      <div
                        class="MuiGrid-root MuiGrid-item css-8e83yq-MuiGrid-root"
                      >
                        <span
                          class="MuiTypography-root MuiTypography-body1 TextMessagemessage css-nx1df2-MuiTypography-root"
                          data-testid="messagesGroupContent-0"
                        >
                          message0
                        </span>
                      </div>
                      <div
                        class="MuiGrid-root MuiGrid-item css-8e83yq-MuiGrid-root"
                      >
                        <span
                          class="MuiTypography-root MuiTypography-body1 TextMessagemessage css-nx1df2-MuiTypography-root"
                          data-testid="messagesGroupContent-1"
                        >
                          message1
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </li>
          </div>
        </body>
      `)
    })

    it('renders with separate info messages', async () => {
      const messages = generateMessages({ amount: 2, type: 3 })
      const result = renderComponent(
        <HashRouter>
          <Provider store={store}>
            <BasicMessageComponent
              duplicatedUsernameModalHandleOpen={jest.fn()}
              unregisteredUsernameModalHandleOpen={jest.fn()}
              lastConnectedTime={DateTime.utc().toSeconds() - 1000}
              allPeersDisconnectedTime={undefined}
              messages={messages}
              connectedPeers={['foobar']}
              communityPeerList={['foobar', 'barbaz']}
              openUrl={jest.fn()}
            />
          </Provider>
        </HashRouter>
      )
      expect(result.baseElement).toMatchInlineSnapshot(`
        <body>
          <div>
            <li
              class="MuiListItem-root MuiListItem-gutters MuiListItem-padding  css-6oh3yy-MuiListItem-root"
            >
              <div
                class="MuiListItemText-root BasicMessageComponentmessageCard css-tlelie-MuiListItemText-root"
                data-testid="userMessagesWrapper-gringo-0"
              >
                <div
                  class="MuiGrid-root MuiGrid-container MuiGrid-wrap-xs-nowrap css-aii0rt-MuiGrid-root"
                >
                  <div
                    class="MuiGrid-root MuiGrid-item BasicMessageComponentavatar css-13i4rnv-MuiGrid-root"
                    data-testid="userAvatar-gringo-0"
                  >
                    <div
                      class="BasicMessageComponentalignAvatar"
                    >
                      <img
                        class="BasicMessageComponentinfoIcon"
                        src="test-file-stub"
                      />
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
                            Quiet
                          </p>
                        </div>
                        <div
                          class="MuiGrid-root MuiGrid-item css-13i4rnv-MuiGrid-root"
                        >
                          <p
                            class="MuiTypography-root MuiTypography-body1 BasicMessageComponenttime css-ghvhpl-MuiTypography-root"
                            data-testid="messageDateLabel-gringo-0"
                          >
                            string
                          </p>
                        </div>
                      </div>
                    </div>
                    <div
                      class="MuiGrid-root MuiGrid-container MuiGrid-direction-xs-column css-1vpwcmr-MuiGrid-root"
                      data-testid="userMessages-gringo-0"
                      style="margin-top: -3px;"
                    >
                      <div
                        class="MuiGrid-root MuiGrid-item css-8e83yq-MuiGrid-root"
                      >
                        <span
                          class="MuiTypography-root MuiTypography-body1 TextMessagemessage css-nx1df2-MuiTypography-root"
                          data-testid="messagesGroupContent-0"
                        >
                          message0
                        </span>
                      </div>
                      <div
                        class="MuiGrid-root MuiGrid-item css-8e83yq-MuiGrid-root"
                      >
                        <span
                          class="MuiTypography-root MuiTypography-body1 TextMessagemessage css-nx1df2-MuiTypography-root"
                          data-testid="messagesGroupContent-1"
                        >
                          message1
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </li>
          </div>
        </body>
      `)
    })

    it('renders with basic message and info message', async () => {
      const message1 = generateMessages()
      const message2 = generateMessages({ type: 3 })
      const result = renderComponent(
        <HashRouter>
          <Provider store={store}>
            <BasicMessageComponent
              duplicatedUsernameModalHandleOpen={jest.fn()}
              unregisteredUsernameModalHandleOpen={jest.fn()}
              lastConnectedTime={DateTime.utc().toSeconds() - 1000}
              allPeersDisconnectedTime={undefined}
              messages={[...message1, ...message2]}
              connectedPeers={['foobar']}
              communityPeerList={['foobar', 'barbaz']}
              openUrl={jest.fn()}
            />
          </Provider>
        </HashRouter>
      )
      expect(result.baseElement).toMatchInlineSnapshot(`
        <body>
          <div>
            <li
              class="MuiListItem-root MuiListItem-gutters MuiListItem-padding BasicMessageComponentwrapper css-6oh3yy-MuiListItem-root"
            >
              <div
                class="MuiListItemText-root BasicMessageComponentmessageCard css-tlelie-MuiListItemText-root"
                data-testid="userMessagesWrapper-gringo-0"
              >
                <div
                  class="MuiGrid-root MuiGrid-container MuiGrid-wrap-xs-nowrap css-aii0rt-MuiGrid-root"
                >
                  <div
                    class="MuiGrid-root MuiGrid-item BasicMessageComponentavatar css-13i4rnv-MuiGrid-root"
                    data-testid="userAvatar-gringo-0"
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
                            gringo
                          </p>
                        </div>
                        <div
                          class="MuiGrid-root MuiGrid-item css-13i4rnv-MuiGrid-root"
                        >
                          <p
                            class="MuiTypography-root MuiTypography-body1 BasicMessageComponenttime css-ghvhpl-MuiTypography-root"
                            data-testid="messageDateLabel-gringo-0"
                          >
                            string
                          </p>
                        </div>
                      </div>
                    </div>
                    <div
                      class="MuiGrid-root MuiGrid-container MuiGrid-direction-xs-column css-1vpwcmr-MuiGrid-root"
                      data-testid="userMessages-gringo-0"
                      style="margin-top: -3px;"
                    >
                      <div
                        class="MuiGrid-root MuiGrid-item css-8e83yq-MuiGrid-root"
                      >
                        <span
                          class="MuiTypography-root MuiTypography-body1 TextMessagemessage css-nx1df2-MuiTypography-root"
                          data-testid="messagesGroupContent-0"
                        >
                          message0
                        </span>
                      </div>
                      <div
                        class="MuiGrid-root MuiGrid-item css-8e83yq-MuiGrid-root"
                      >
                        <span
                          class="MuiTypography-root MuiTypography-body1 TextMessagemessage css-nx1df2-MuiTypography-root"
                          data-testid="messagesGroupContent-0"
                        >
                          message0
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </li>
          </div>
        </body>
      `)
    })

    it('renders info messages as sent even when other messages would be unsent', async () => {
      const nowSeconds = DateTime.utc().toSeconds()
      const messages = generateMessages({ amount: 2, type: 3, createdAtSeconds: nowSeconds })
      const result = renderComponent(
        <HashRouter>
          <Provider store={store}>
            <BasicMessageComponent
              duplicatedUsernameModalHandleOpen={jest.fn()}
              unregisteredUsernameModalHandleOpen={jest.fn()}
              lastConnectedTime={nowSeconds - 20000}
              allPeersDisconnectedTime={nowSeconds - 100000}
              messages={messages}
              connectedPeers={[]}
              communityPeerList={['foobar', 'barbaz']}
              openUrl={jest.fn()}
            />
          </Provider>
        </HashRouter>
      )
      expect(result.baseElement).toMatchInlineSnapshot(`
        <body>
          <div>
            <li
              class="MuiListItem-root MuiListItem-gutters MuiListItem-padding  css-6oh3yy-MuiListItem-root"
            >
              <div
                class="MuiListItemText-root BasicMessageComponentmessageCard css-tlelie-MuiListItemText-root"
                data-testid="userMessagesWrapper-gringo-0"
              >
                <div
                  class="MuiGrid-root MuiGrid-container MuiGrid-wrap-xs-nowrap css-aii0rt-MuiGrid-root"
                >
                  <div
                    class="MuiGrid-root MuiGrid-item BasicMessageComponentavatar css-13i4rnv-MuiGrid-root"
                    data-testid="userAvatar-gringo-0"
                  >
                    <div
                      class="BasicMessageComponentalignAvatar"
                    >
                      <img
                        class="BasicMessageComponentinfoIcon"
                        src="test-file-stub"
                      />
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
                            Quiet
                          </p>
                        </div>
                        <div
                          class="MuiGrid-root MuiGrid-item css-13i4rnv-MuiGrid-root"
                        >
                          <p
                            class="MuiTypography-root MuiTypography-body1 BasicMessageComponenttime css-ghvhpl-MuiTypography-root"
                            data-testid="messageDateLabel-gringo-0"
                          >
                            string
                          </p>
                        </div>
                      </div>
                    </div>
                    <div
                      class="MuiGrid-root MuiGrid-container MuiGrid-direction-xs-column css-1vpwcmr-MuiGrid-root"
                      data-testid="userMessages-gringo-0"
                      style="margin-top: -3px;"
                    >
                      <div
                        class="MuiGrid-root MuiGrid-item css-8e83yq-MuiGrid-root"
                      >
                        <span
                          class="MuiTypography-root MuiTypography-body1 TextMessagemessage css-nx1df2-MuiTypography-root"
                          data-testid="messagesGroupContent-0"
                        >
                          message0
                        </span>
                      </div>
                      <div
                        class="MuiGrid-root MuiGrid-item css-8e83yq-MuiGrid-root"
                      >
                        <span
                          class="MuiTypography-root MuiTypography-body1 TextMessagemessage css-nx1df2-MuiTypography-root"
                          data-testid="messagesGroupContent-1"
                        >
                          message1
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </li>
          </div>
        </body>
      `)
    })

    it('renders messages as sent when no peers are connected but community is fresh', async () => {
      const nowSeconds = DateTime.utc().toSeconds()
      const messages = generateMessages({ amount: 2, createdAtSeconds: nowSeconds })
      const result = renderComponent(
        <HashRouter>
          <Provider store={store}>
            <BasicMessageComponent
              duplicatedUsernameModalHandleOpen={jest.fn()}
              unregisteredUsernameModalHandleOpen={jest.fn()}
              lastConnectedTime={nowSeconds - 20000}
              allPeersDisconnectedTime={undefined}
              messages={messages}
              connectedPeers={[]}
              communityPeerList={['gringo']}
              openUrl={jest.fn()}
            />
          </Provider>
        </HashRouter>
      )
      expect(result.baseElement).toMatchInlineSnapshot(`
        <body>
          <div>
            <li
              class="MuiListItem-root MuiListItem-gutters MuiListItem-padding BasicMessageComponentwrapper css-6oh3yy-MuiListItem-root"
            >
              <div
                class="MuiListItemText-root BasicMessageComponentmessageCard css-tlelie-MuiListItemText-root"
                data-testid="userMessagesWrapper-gringo-0"
              >
                <div
                  class="MuiGrid-root MuiGrid-container MuiGrid-wrap-xs-nowrap css-aii0rt-MuiGrid-root"
                >
                  <div
                    class="MuiGrid-root MuiGrid-item BasicMessageComponentavatar css-13i4rnv-MuiGrid-root"
                    data-testid="userAvatar-gringo-0"
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
                            gringo
                          </p>
                        </div>
                        <div
                          class="MuiGrid-root MuiGrid-item css-13i4rnv-MuiGrid-root"
                        >
                          <p
                            class="MuiTypography-root MuiTypography-body1 BasicMessageComponenttime css-ghvhpl-MuiTypography-root"
                            data-testid="messageDateLabel-gringo-0"
                          >
                            string
                          </p>
                        </div>
                      </div>
                    </div>
                    <div
                      class="MuiGrid-root MuiGrid-container MuiGrid-direction-xs-column css-1vpwcmr-MuiGrid-root"
                      data-testid="userMessages-gringo-0"
                      style="margin-top: -3px;"
                    >
                      <div
                        class="MuiGrid-root MuiGrid-item css-8e83yq-MuiGrid-root"
                      >
                        <span
                          class="MuiTypography-root MuiTypography-body1 TextMessagemessage css-nx1df2-MuiTypography-root"
                          data-testid="messagesGroupContent-0"
                        >
                          message0
                        </span>
                      </div>
                      <div
                        class="MuiGrid-root MuiGrid-item css-8e83yq-MuiGrid-root"
                      >
                        <span
                          class="MuiTypography-root MuiTypography-body1 TextMessagemessage css-nx1df2-MuiTypography-root"
                          data-testid="messagesGroupContent-1"
                        >
                          message1
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </li>
          </div>
        </body>
      `)
    })
  })

  describe('unsent messages', () => {
    it('renders component with unsent messages when peers disconnected this session', async () => {
      const nowSeconds = DateTime.utc().toSeconds()
      const messages = generateMessages({ createdAtSeconds: nowSeconds })
      const result = renderComponent(
        <HashRouter>
          <Provider store={store}>
            <BasicMessageComponent
              duplicatedUsernameModalHandleOpen={jest.fn()}
              unregisteredUsernameModalHandleOpen={jest.fn()}
              messages={messages}
              lastConnectedTime={nowSeconds - 20000}
              allPeersDisconnectedTime={nowSeconds - 100000}
              connectedPeers={[]}
              communityPeerList={['foobar', 'barbaz']}
              openUrl={jest.fn()}
            />
          </Provider>
        </HashRouter>
      )
      expect(result.baseElement).toMatchInlineSnapshot(`
        <body>
          <div>
            <li
              class="MuiListItem-root MuiListItem-gutters MuiListItem-padding BasicMessageComponentwrapper css-6oh3yy-MuiListItem-root"
            >
              <div
                class="MuiListItemText-root BasicMessageComponentmessageCard css-tlelie-MuiListItemText-root"
                data-testid="userMessagesWrapper-gringo-0"
              >
                <div
                  class="MuiGrid-root MuiGrid-container MuiGrid-wrap-xs-nowrap css-aii0rt-MuiGrid-root"
                >
                  <div
                    class="MuiGrid-root MuiGrid-item BasicMessageComponentavatar BasicMessageComponentunsent css-13i4rnv-MuiGrid-root"
                    data-testid="userAvatar-gringo-0"
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
                      <span
                        class="MuiTypography-root MuiTypography-body1 TextMessagemessage css-1xya0ai-MuiTypography-root"
                        data-testid="messagesGroupContent-0"
                      >
                        <div
                          class="MuiGrid-root MuiGrid-item css-13i4rnv-MuiGrid-root"
                        >
                          <p
                            class="MuiTypography-root MuiTypography-body1 BasicMessageComponentusername BasicMessageComponentunsent css-11qbl00-MuiTypography-root"
                          >
                            gringo
                          </p>
                        </div>
                        <div
                          class="MuiGrid-root MuiGrid-item css-13i4rnv-MuiGrid-root"
                        >
                          <p
                            class="MuiTypography-root MuiTypography-body1 BasicMessageComponenttime BasicMessageComponentunsent css-ghvhpl-MuiTypography-root"
                            data-testid="messageDateLabel-gringo-0"
                          >
                            string
                          </p>
                        </div>
                        <div
                          class="MuiGrid-root MuiGrid-item BasicMessageComponentsending css-13i4rnv-MuiGrid-root"
                          data-testid="unsent-sending-gringo-0"
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
                      data-testid="userMessages-gringo-0"
                      style="margin-top: -3px;"
                    >
                      <span
                        class="MuiTypography-root MuiTypography-body1 TextMessagemessage css-1xya0ai-MuiTypography-root"
                        data-testid="messagesGroupContent-1"
                      >
                        <span
                          class="MuiTypography-root MuiTypography-body1 TextMessagemessage TextMessageunsent css-nx1df2-MuiTypography-root"
                          data-testid="messagesGroupContent-0"
                        >
                          message0
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </li>
          </div>
        </body>
      `)
    })

    it('renders component with unsent messages when no peers seen this session', async () => {
      const nowSeconds = DateTime.utc().toSeconds()
      const messages = generateMessages({ createdAtSeconds: nowSeconds })
      const result = renderComponent(
        <HashRouter>
          <Provider store={store}>
            <BasicMessageComponent
              duplicatedUsernameModalHandleOpen={jest.fn()}
              unregisteredUsernameModalHandleOpen={jest.fn()}
              messages={messages}
              lastConnectedTime={nowSeconds - 20000}
              allPeersDisconnectedTime={undefined}
              connectedPeers={[]}
              communityPeerList={['foobar', 'barbaz']}
              openUrl={jest.fn()}
            />
          </Provider>
        </HashRouter>
      )
      expect(result.baseElement).toMatchInlineSnapshot(`
        <body>
          <div>
            <li
              class="MuiListItem-root MuiListItem-gutters MuiListItem-padding BasicMessageComponentwrapper css-6oh3yy-MuiListItem-root"
            >
              <div
                class="MuiListItemText-root BasicMessageComponentmessageCard css-tlelie-MuiListItemText-root"
                data-testid="userMessagesWrapper-gringo-0"
              >
                <div
                  class="MuiGrid-root MuiGrid-container MuiGrid-wrap-xs-nowrap css-aii0rt-MuiGrid-root"
                >
                  <div
                    class="MuiGrid-root MuiGrid-item BasicMessageComponentavatar BasicMessageComponentunsent css-13i4rnv-MuiGrid-root"
                    data-testid="userAvatar-gringo-0"
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
                      <span
                        class="MuiTypography-root MuiTypography-body1 TextMessagemessage css-1xya0ai-MuiTypography-root"
                        data-testid="messagesGroupContent-0"
                      >
                        <div
                          class="MuiGrid-root MuiGrid-item css-13i4rnv-MuiGrid-root"
                        >
                          <p
                            class="MuiTypography-root MuiTypography-body1 BasicMessageComponentusername BasicMessageComponentunsent css-11qbl00-MuiTypography-root"
                          >
                            gringo
                          </p>
                        </div>
                        <div
                          class="MuiGrid-root MuiGrid-item css-13i4rnv-MuiGrid-root"
                        >
                          <p
                            class="MuiTypography-root MuiTypography-body1 BasicMessageComponenttime BasicMessageComponentunsent css-ghvhpl-MuiTypography-root"
                            data-testid="messageDateLabel-gringo-0"
                          >
                            string
                          </p>
                        </div>
                        <div
                          class="MuiGrid-root MuiGrid-item BasicMessageComponentsending css-13i4rnv-MuiGrid-root"
                          data-testid="unsent-sending-gringo-0"
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
                      data-testid="userMessages-gringo-0"
                      style="margin-top: -3px;"
                    >
                      <span
                        class="MuiTypography-root MuiTypography-body1 TextMessagemessage css-1xya0ai-MuiTypography-root"
                        data-testid="messagesGroupContent-1"
                      >
                        <span
                          class="MuiTypography-root MuiTypography-body1 TextMessagemessage TextMessageunsent css-nx1df2-MuiTypography-root"
                          data-testid="messagesGroupContent-0"
                        >
                          message0
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </li>
          </div>
        </body>
      `)
    })

    it('renders component with multiple unsent messages', async () => {
      const nowSeconds = DateTime.utc().toSeconds()
      const messages = generateMessages({ createdAtSeconds: nowSeconds, amount: 5 })
      const result = renderComponent(
        <HashRouter>
          <Provider store={store}>
            <BasicMessageComponent
              duplicatedUsernameModalHandleOpen={jest.fn()}
              unregisteredUsernameModalHandleOpen={jest.fn()}
              messages={messages}
              lastConnectedTime={nowSeconds - 20000}
              allPeersDisconnectedTime={nowSeconds - 100000}
              connectedPeers={[]}
              communityPeerList={['foobar', 'barbaz']}
              openUrl={jest.fn()}
            />
          </Provider>
        </HashRouter>
      )
      expect(result.baseElement).toMatchInlineSnapshot(`
        <body>
          <div>
            <li
              class="MuiListItem-root MuiListItem-gutters MuiListItem-padding BasicMessageComponentwrapper css-6oh3yy-MuiListItem-root"
            >
              <div
                class="MuiListItemText-root BasicMessageComponentmessageCard css-tlelie-MuiListItemText-root"
                data-testid="userMessagesWrapper-gringo-0"
              >
                <div
                  class="MuiGrid-root MuiGrid-container MuiGrid-wrap-xs-nowrap css-aii0rt-MuiGrid-root"
                >
                  <div
                    class="MuiGrid-root MuiGrid-item BasicMessageComponentavatar BasicMessageComponentunsent css-13i4rnv-MuiGrid-root"
                    data-testid="userAvatar-gringo-0"
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
                      <span
                        class="MuiTypography-root MuiTypography-body1 TextMessagemessage css-1xya0ai-MuiTypography-root"
                        data-testid="messagesGroupContent-0"
                      >
                        <div
                          class="MuiGrid-root MuiGrid-item css-13i4rnv-MuiGrid-root"
                        >
                          <p
                            class="MuiTypography-root MuiTypography-body1 BasicMessageComponentusername BasicMessageComponentunsent css-11qbl00-MuiTypography-root"
                          >
                            gringo
                          </p>
                        </div>
                        <div
                          class="MuiGrid-root MuiGrid-item css-13i4rnv-MuiGrid-root"
                        >
                          <p
                            class="MuiTypography-root MuiTypography-body1 BasicMessageComponenttime BasicMessageComponentunsent css-ghvhpl-MuiTypography-root"
                            data-testid="messageDateLabel-gringo-0"
                          >
                            string
                          </p>
                        </div>
                        <div
                          class="MuiGrid-root MuiGrid-item BasicMessageComponentsending css-13i4rnv-MuiGrid-root"
                          data-testid="unsent-sending-gringo-0"
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
                      data-testid="userMessages-gringo-0"
                      style="margin-top: -3px;"
                    >
                      <span
                        class="MuiTypography-root MuiTypography-body1 TextMessagemessage css-1xya0ai-MuiTypography-root"
                        data-testid="messagesGroupContent-0"
                      >
                        <span
                          class="MuiTypography-root MuiTypography-body1 TextMessagemessage TextMessageunsent css-nx1df2-MuiTypography-root"
                          data-testid="messagesGroupContent-0"
                        >
                          message0
                        </span>
                      </div>
                      <div
                        class="MuiGrid-root MuiGrid-item css-8e83yq-MuiGrid-root"
                      >
                        <span
                          class="MuiTypography-root MuiTypography-body1 TextMessagemessage TextMessageunsent css-nx1df2-MuiTypography-root"
                          data-testid="messagesGroupContent-1"
                        >
                          message1
                        </span>
                      </div>
                      <div
                        class="MuiGrid-root MuiGrid-item css-8e83yq-MuiGrid-root"
                      >
                        <span
                          class="MuiTypography-root MuiTypography-body1 TextMessagemessage TextMessageunsent css-nx1df2-MuiTypography-root"
                          data-testid="messagesGroupContent-2"
                        >
                          message2
                        </span>
                      </div>
                      <div
                        class="MuiGrid-root MuiGrid-item css-8e83yq-MuiGrid-root"
                      >
                        <span
                          class="MuiTypography-root MuiTypography-body1 TextMessagemessage TextMessageunsent css-nx1df2-MuiTypography-root"
                          data-testid="messagesGroupContent-3"
                        >
                          message3
                        </span>
                      </div>
                      <div
                        class="MuiGrid-root MuiGrid-item css-8e83yq-MuiGrid-root"
                      >
                        <span
                          class="MuiTypography-root MuiTypography-body1 TextMessagemessage TextMessageunsent css-nx1df2-MuiTypography-root"
                          data-testid="messagesGroupContent-4"
                        >
                          message4
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </li>
          </div>
        </body>
      `)
    })
  })
})
