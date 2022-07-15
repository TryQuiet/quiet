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
          <BasicMessageComponent messages={messages} openUrl={jest.fn()} />
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
    const messages = generateMessages({ amount: 2 })
    const result = renderComponent(
      <HashRouter>
        <Provider store={store}>
          <BasicMessageComponent messages={messages} openUrl={jest.fn()} />
        </Provider>
      </HashRouter>
    )
    expect(result.baseElement).toMatchInlineSnapshot(`
      <body>
        <div>
          <li
            class="MuiListItem-root makeStyles-wrapper-173 MuiListItem-gutters"
          >
            <div
              class="MuiListItemText-root makeStyles-messageCard-172"
            >
              <div
                class="MuiGrid-root MuiGrid-container MuiGrid-wrap-xs-nowrap MuiGrid-align-items-xs-flex-start"
              >
                <div
                  class="MuiGrid-root makeStyles-avatar-181 MuiGrid-item"
                >
                  <div
                    class="makeStyles-alignAvatar-182"
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
                          class="MuiTypography-root makeStyles-username-177 MuiTypography-body1 MuiTypography-colorTextPrimary"
                        >
                          gringo
                        </p>
                      </div>
                      <div
                        class="MuiGrid-root MuiGrid-item"
                      >
                        <p
                          class="MuiTypography-root makeStyles-time-184 MuiTypography-body1"
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
                        class="MuiTypography-root makeStyles-message-339 MuiTypography-body1"
                        data-testid="messagesGroupContent-0"
                      >
                        message0
                      </span>
                    </div>
                    <div
                      class="MuiGrid-root MuiGrid-item"
                    >
                      <span
                        class="MuiTypography-root makeStyles-message-339 MuiTypography-body1"
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
          <BasicMessageComponent messages={messages} openUrl={jest.fn()} />
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
              class="MuiListItemText-root makeStyles-messageCard-343"
            >
              <div
                class="MuiGrid-root MuiGrid-container MuiGrid-wrap-xs-nowrap MuiGrid-align-items-xs-flex-start"
              >
                <div
                  class="MuiGrid-root makeStyles-avatar-352 MuiGrid-item"
                >
                  <div
                    class="makeStyles-alignAvatar-353"
                  >
                    <img
                      class="makeStyles-infoIcon-359"
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
                          class="MuiTypography-root makeStyles-username-348 MuiTypography-body1 MuiTypography-colorTextPrimary"
                        >
                          Quiet
                        </p>
                      </div>
                      <div
                        class="MuiGrid-root MuiGrid-item"
                      >
                        <p
                          class="MuiTypography-root makeStyles-time-355 MuiTypography-body1"
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
                        class="MuiTypography-root makeStyles-message-510 MuiTypography-body1"
                        data-testid="messagesGroupContent-0"
                      >
                        message0
                      </span>
                    </div>
                    <div
                      class="MuiGrid-root MuiGrid-item"
                    >
                      <span
                        class="MuiTypography-root makeStyles-message-510 MuiTypography-body1"
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
          <BasicMessageComponent messages={[...message1, ...message2]} openUrl={jest.fn()} />
        </Provider>
      </HashRouter>
    )
    expect(result.baseElement).toMatchInlineSnapshot(`
      <body>
        <div>
          <li
            class="MuiListItem-root makeStyles-wrapper-515 MuiListItem-gutters"
          >
            <div
              class="MuiListItemText-root makeStyles-messageCard-514"
            >
              <div
                class="MuiGrid-root MuiGrid-container MuiGrid-wrap-xs-nowrap MuiGrid-align-items-xs-flex-start"
              >
                <div
                  class="MuiGrid-root makeStyles-avatar-523 MuiGrid-item"
                >
                  <div
                    class="makeStyles-alignAvatar-524"
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
                          class="MuiTypography-root makeStyles-username-519 MuiTypography-body1 MuiTypography-colorTextPrimary"
                        >
                          gringo
                        </p>
                      </div>
                      <div
                        class="MuiGrid-root MuiGrid-item"
                      >
                        <p
                          class="MuiTypography-root makeStyles-time-526 MuiTypography-body1"
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
                        class="MuiTypography-root makeStyles-message-681 MuiTypography-body1"
                        data-testid="messagesGroupContent-0"
                      >
                        message0
                      </span>
                    </div>
                    <div
                      class="MuiGrid-root MuiGrid-item"
                    >
                      <span
                        class="MuiTypography-root makeStyles-message-681 MuiTypography-body1"
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
