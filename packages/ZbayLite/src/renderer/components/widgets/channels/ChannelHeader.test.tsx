import React from 'react'

import { ChannelHeader } from './ChannelHeader'
import { renderComponent } from '../../../testUtils/renderComponent'
import { Channel } from '../../../store/handlers/channel'
import { CHANNEL_TYPE } from '../../pages/ChannelTypes'
import { HashRouter } from 'react-router-dom'
import { Provider } from 'react-redux'
import store from '../../../store'

describe('ChannelHeader', () => {
  it('renders component', () => {
    const channel = new Channel()
    const result = renderComponent(
      <HashRouter>
        <Provider store={store}>
          <ChannelHeader
            tab={0}
            setTab={() => {}}
            unmute={() => {}}
            mutedFlag
            channel={channel}
            name={'channel'}
            updateShowInfoMsg={jest.fn()}
            directMessage={false}
            channelType={CHANNEL_TYPE.NORMAL}
          />
        </Provider>
      </HashRouter>
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
                      #undefined
                    </h6>
                  </div>
                  <span>
                    <div
                      class="MuiGrid-root makeStyles-silenceDiv-16 MuiGrid-item"
                    >
                      <img
                        src="test-file-stub"
                      />
                    </div>
                  </span>
                </div>
              </div>
              <div
                class="MuiGrid-root makeStyles-actions-5 MuiGrid-container MuiGrid-item MuiGrid-align-items-xs-center MuiGrid-align-content-xs-center MuiGrid-justify-xs-flex-end MuiGrid-grid-xs-true"
              >
                <div
                  class="MuiGrid-root MuiGrid-item"
                >
                  <button
                    class="MuiButtonBase-root MuiIconButton-root makeStyles-button-171"
                    tabindex="0"
                    type="button"
                  >
                    <span
                      class="MuiIconButton-label"
                    >
                      <img
                        class="makeStyles-icon-170"
                        src="test-file-stub"
                      />
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </body>
    `)
  })

  it('renders without members count', () => {
    const channel = new Channel()
    const result = renderComponent(
      <HashRouter>
        <Provider store={store}>
          <ChannelHeader
            tab={0}
            setTab={() => {}}
            channel={channel}
            unmute={() => {}}
            name={'channel'}
            updateShowInfoMsg={jest.fn()}
            mutedFlag
            directMessage={false}
            channelType={CHANNEL_TYPE.NORMAL}
          />
        </Provider>
      </HashRouter>
    )
    expect(result.baseElement).toMatchInlineSnapshot(`
      <body>
        <div>
          <div
            class="makeStyles-wrapper-221"
          >
            <div
              class="MuiGrid-root makeStyles-root-210 MuiGrid-container MuiGrid-align-items-xs-center MuiGrid-justify-xs-space-between"
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
                      class="MuiTypography-root makeStyles-title-211 makeStyles-bold-224 MuiTypography-subtitle1 MuiTypography-noWrap"
                      style="max-width: 724px;"
                    >
                      #undefined
                    </h6>
                  </div>
                  <span>
                    <div
                      class="MuiGrid-root makeStyles-silenceDiv-225 MuiGrid-item"
                    >
                      <img
                        src="test-file-stub"
                      />
                    </div>
                  </span>
                </div>
              </div>
              <div
                class="MuiGrid-root makeStyles-actions-214 MuiGrid-container MuiGrid-item MuiGrid-align-items-xs-center MuiGrid-align-content-xs-center MuiGrid-justify-xs-flex-end MuiGrid-grid-xs-true"
              >
                <div
                  class="MuiGrid-root MuiGrid-item"
                >
                  <button
                    class="MuiButtonBase-root MuiIconButton-root makeStyles-button-380"
                    tabindex="0"
                    type="button"
                  >
                    <span
                      class="MuiIconButton-label"
                    >
                      <img
                        class="makeStyles-icon-379"
                        src="test-file-stub"
                      />
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </body>
    `)
  })

  it('renders members when 0', () => {
    const channel = new Channel()
    const result = renderComponent(
      <HashRouter>
        <Provider store={store}>
          <ChannelHeader
            tab={0}
            setTab={() => {}}
            channel={channel}
            name={'channel'}
            updateShowInfoMsg={jest.fn()}
            unmute={() => {}}
            mutedFlag
            directMessage={false}
            channelType={CHANNEL_TYPE.NORMAL}
          />
        </Provider>
      </HashRouter>
    )
    expect(result.baseElement).toMatchInlineSnapshot(`
      <body>
        <div>
          <div
            class="makeStyles-wrapper-430"
          >
            <div
              class="MuiGrid-root makeStyles-root-419 MuiGrid-container MuiGrid-align-items-xs-center MuiGrid-justify-xs-space-between"
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
                      class="MuiTypography-root makeStyles-title-420 makeStyles-bold-433 MuiTypography-subtitle1 MuiTypography-noWrap"
                      style="max-width: 724px;"
                    >
                      #undefined
                    </h6>
                  </div>
                  <span>
                    <div
                      class="MuiGrid-root makeStyles-silenceDiv-434 MuiGrid-item"
                    >
                      <img
                        src="test-file-stub"
                      />
                    </div>
                  </span>
                </div>
              </div>
              <div
                class="MuiGrid-root makeStyles-actions-423 MuiGrid-container MuiGrid-item MuiGrid-align-items-xs-center MuiGrid-align-content-xs-center MuiGrid-justify-xs-flex-end MuiGrid-grid-xs-true"
              >
                <div
                  class="MuiGrid-root MuiGrid-item"
                >
                  <button
                    class="MuiButtonBase-root MuiIconButton-root makeStyles-button-589"
                    tabindex="0"
                    type="button"
                  >
                    <span
                      class="MuiIconButton-label"
                    >
                      <img
                        class="makeStyles-icon-588"
                        src="test-file-stub"
                      />
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </body>
    `)
  })
})
