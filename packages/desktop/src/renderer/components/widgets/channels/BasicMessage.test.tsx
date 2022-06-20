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

  it('renders component', async () => {
    const messages = generateMessages()
    const result = renderComponent(
      <HashRouter>
        <Provider store={store}>
          <BasicMessageComponent messages={messages} />
        </Provider>
      </HashRouter>
    )
    expect(result.baseElement).toMatchInlineSnapshot(`
      <body>
        <div>
          <li
            class="MuiListItem-root makeStyles-wrapper-2 MuiListItem-gutters"
          >
            <div
              class="MuiListItemText-root makeStyles-messageCard-1"
            >
              <div
                class="MuiGrid-root MuiGrid-container MuiGrid-wrap-xs-nowrap MuiGrid-align-items-xs-flex-start"
              >
                <div
                  class="MuiGrid-root makeStyles-avatar-10 MuiGrid-item"
                >
                  <div
                    class="makeStyles-alignAvatar-11"
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
                          class="MuiTypography-root makeStyles-username-6 MuiTypography-body1 MuiTypography-colorTextPrimary"
                        >
                          gringo
                        </p>
                      </div>
                      <div
                        class="MuiGrid-root MuiGrid-item"
                      >
                        <p
                          class="MuiTypography-root makeStyles-time-13 MuiTypography-body1"
                        >
                          string
                        </p>
                      </div>
                    </div>
                  </div>
                  <div
                    class="MuiGrid-root MuiGrid-container MuiGrid-direction-xs-column"
                    data-testid="userMessages-gringo-0"
                    style="margin-top: -3px;"
                  >
                    <div
                      class="MuiGrid-root MuiGrid-item"
                    >
                      <span
                        class="MuiTypography-root makeStyles-message-168 MuiTypography-body1"
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
    const messages = generateMessages({amount: 2})
    const result = renderComponent(
      <HashRouter>
        <Provider store={store}>
          <BasicMessageComponent messages={messages} />
        </Provider>
      </HashRouter>
    )
    expect(result.baseElement).toMatchInlineSnapshot(`
      <body>
        <div>
          <li
            class="MuiListItem-root makeStyles-wrapper-172 MuiListItem-gutters"
          >
            <div
              class="MuiListItemText-root makeStyles-messageCard-171"
            >
              <div
                class="MuiGrid-root MuiGrid-container MuiGrid-wrap-xs-nowrap MuiGrid-align-items-xs-flex-start"
              >
                <div
                  class="MuiGrid-root makeStyles-avatar-180 MuiGrid-item"
                >
                  <div
                    class="makeStyles-alignAvatar-181"
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
                          class="MuiTypography-root makeStyles-username-176 MuiTypography-body1 MuiTypography-colorTextPrimary"
                        >
                          gringo
                        </p>
                      </div>
                      <div
                        class="MuiGrid-root MuiGrid-item"
                      >
                        <p
                          class="MuiTypography-root makeStyles-time-183 MuiTypography-body1"
                        >
                          string
                        </p>
                      </div>
                    </div>
                  </div>
                  <div
                    class="MuiGrid-root MuiGrid-container MuiGrid-direction-xs-column"
                    data-testid="userMessages-gringo-0"
                    style="margin-top: -3px;"
                  >
                    <div
                      class="MuiGrid-root MuiGrid-item"
                    >
                      <span
                        class="MuiTypography-root makeStyles-message-338 MuiTypography-body1"
                        data-testid="messagesGroupContent-0"
                      >
                        message0
                      </span>
                    </div>
                    <div
                      class="MuiGrid-root MuiGrid-item"
                    >
                      <span
                        class="MuiTypography-root makeStyles-message-338 MuiTypography-body1"
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
    const messages = generateMessages({amount: 2, type: 3})
    const result = renderComponent(
      <HashRouter>
        <Provider store={store}>
          <BasicMessageComponent messages={messages} />
        </Provider>
      </HashRouter>
    )
    expect(result.baseElement).toMatchInlineSnapshot(`
      <body>
        <div>
          <li
            class="MuiListItem-root MuiListItem-gutters"
          >
            <div
              class="MuiListItemText-root makeStyles-messageCard-341"
            >
              <div
                class="MuiGrid-root MuiGrid-container MuiGrid-wrap-xs-nowrap MuiGrid-align-items-xs-flex-start"
              >
                <div
                  class="MuiGrid-root makeStyles-avatar-350 MuiGrid-item"
                >
                  <div
                    class="makeStyles-alignAvatar-351"
                  >
                    <img
                      class="makeStyles-infoIcon-357"
                      src="test-file-stub"
                    />
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
                          class="MuiTypography-root makeStyles-username-346 MuiTypography-body1 MuiTypography-colorTextPrimary"
                        >
                          Quiet
                        </p>
                      </div>
                      <div
                        class="MuiGrid-root MuiGrid-item"
                      >
                        <p
                          class="MuiTypography-root makeStyles-time-353 MuiTypography-body1"
                        >
                          string
                        </p>
                      </div>
                    </div>
                  </div>
                  <div
                    class="MuiGrid-root MuiGrid-container MuiGrid-direction-xs-column"
                    data-testid="userMessages-gringo-0"
                    style="margin-top: -3px;"
                  >
                    <div
                      class="MuiGrid-root MuiGrid-item"
                    >
                      <span
                        class="MuiTypography-root makeStyles-message-508 MuiTypography-body1"
                        data-testid="messagesGroupContent-0"
                      >
                        message0
                      </span>
                    </div>
                    <div
                      class="MuiGrid-root MuiGrid-item"
                    >
                      <span
                        class="MuiTypography-root makeStyles-message-508 MuiTypography-body1"
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
    const message2 = generateMessages({type: 3})
    const result = renderComponent(
      <HashRouter>
        <Provider store={store}>
          <BasicMessageComponent messages={[...message1, ...message2]} />
        </Provider>
      </HashRouter>
    )
    expect(result.baseElement).toMatchInlineSnapshot(`
      <body>
        <div>
          <li
            class="MuiListItem-root makeStyles-wrapper-512 MuiListItem-gutters"
          >
            <div
              class="MuiListItemText-root makeStyles-messageCard-511"
            >
              <div
                class="MuiGrid-root MuiGrid-container MuiGrid-wrap-xs-nowrap MuiGrid-align-items-xs-flex-start"
              >
                <div
                  class="MuiGrid-root makeStyles-avatar-520 MuiGrid-item"
                >
                  <div
                    class="makeStyles-alignAvatar-521"
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
                          class="MuiTypography-root makeStyles-username-516 MuiTypography-body1 MuiTypography-colorTextPrimary"
                        >
                          gringo
                        </p>
                      </div>
                      <div
                        class="MuiGrid-root MuiGrid-item"
                      >
                        <p
                          class="MuiTypography-root makeStyles-time-523 MuiTypography-body1"
                        >
                          string
                        </p>
                      </div>
                    </div>
                  </div>
                  <div
                    class="MuiGrid-root MuiGrid-container MuiGrid-direction-xs-column"
                    data-testid="userMessages-gringo-0"
                    style="margin-top: -3px;"
                  >
                    <div
                      class="MuiGrid-root MuiGrid-item"
                    >
                      <span
                        class="MuiTypography-root makeStyles-message-678 MuiTypography-body1"
                        data-testid="messagesGroupContent-0"
                      >
                        message0
                      </span>
                    </div>
                    <div
                      class="MuiGrid-root MuiGrid-item"
                    >
                      <span
                        class="MuiTypography-root makeStyles-message-678 MuiTypography-body1"
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
})
