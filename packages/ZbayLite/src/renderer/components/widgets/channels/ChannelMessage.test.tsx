import React from 'react'
import { DateTime } from 'luxon'

import { ChannelMessage } from './ChannelMessage'
import { now } from '../../../testUtils'
import { renderComponent } from '../../../testUtils/renderComponent'
import { HashRouter } from 'react-router-dom'
import { Provider } from 'react-redux'
import store from '../../../store'

describe('ChannelMessage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(DateTime, 'utc').mockImplementationOnce(() => now)
  })

  it('renders component', async () => {
    const message = {
      id: 'string',
      type: 1,
      message: 'string',
      createdAt: 'string',
      nickname: 'string'
    }

    const result = renderComponent(
      <HashRouter>
        <Provider store={store}>
          <ChannelMessage
            message={message}
            onResend={jest.fn()}
            onLinkedChannel={jest.fn()}
            onLinkedUser={jest.fn()}
            openExternalLink={jest.fn()}
            setWhitelistAll={jest.fn()}
            addToWhitelist={jest.fn()}
            publicChannels={{}}
            users={{}}
            whitelisted={[]}
            autoload={[]}
            allowAll={false}
            torEnabled={true}
          />
        </Provider>
      </HashRouter>
    )
    expect(result.baseElement).toMatchInlineSnapshot(`
      <body>
        <div>
          <li
            class="MuiListItem-root makeStyles-wrapper-11 makeStyles-wrapperPending-13 MuiListItem-gutters"
          >
            <div
              class="MuiListItemText-root makeStyles-messageCard-10"
            >
              <div
                class="MuiGrid-root MuiGrid-container MuiGrid-wrap-xs-nowrap MuiGrid-align-items-xs-flex-start"
              >
                <div
                  class="MuiGrid-root makeStyles-avatar-19 MuiGrid-item"
                >
                  <div
                    class="makeStyles-alignAvatar-20"
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
                        class="MuiTypography-root makeStyles-username-14 MuiTypography-body1 MuiTypography-colorTextPrimary"
                      >
                        string
                      </p>
                    </div>
                    <div
                      class="MuiGrid-root MuiGrid-item"
                    >
                      <p
                        class="MuiTypography-root makeStyles-time-22 MuiTypography-body1"
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
      </body>
    `)
  })
  it('renders component when message is sent by owner', async () => {
    const message = {
      id: 'string',
      type: 1,
      message: 'string',
      createdAt: 'string',
      nickname: 'string'
    }

    const result = renderComponent(
      <HashRouter>
        <Provider store={store}>
          <ChannelMessage
            message={message}
            onResend={jest.fn()}
            onLinkedChannel={jest.fn()}
            onLinkedUser={jest.fn()}
            openExternalLink={jest.fn()}
            setWhitelistAll={jest.fn()}
            addToWhitelist={jest.fn()}
            publicChannels={{}}
            users={{}}
            whitelisted={[]}
            autoload={[]}
            allowAll={false}
            torEnabled={true}
          />
        </Provider>
      </HashRouter>
    )
    expect(result.baseElement).toMatchInlineSnapshot(`
      <body>
        <div>
          <li
            class="MuiListItem-root makeStyles-wrapper-186 makeStyles-wrapperPending-188 MuiListItem-gutters"
          >
            <div
              class="MuiListItemText-root makeStyles-messageCard-185"
            >
              <div
                class="MuiGrid-root MuiGrid-container MuiGrid-wrap-xs-nowrap MuiGrid-align-items-xs-flex-start"
              >
                <div
                  class="MuiGrid-root makeStyles-avatar-194 MuiGrid-item"
                >
                  <div
                    class="makeStyles-alignAvatar-195"
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
                        class="MuiTypography-root makeStyles-username-189 MuiTypography-body1 MuiTypography-colorTextPrimary"
                      >
                        string
                      </p>
                    </div>
                    <div
                      class="MuiGrid-root MuiGrid-item"
                    >
                      <p
                        class="MuiTypography-root makeStyles-time-197 MuiTypography-body1"
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
      </body>
    `)
  })
})
