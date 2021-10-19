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
                  class="MuiGrid-root makeStyles-switch-6 MuiGrid-item"
                >
                  <div
                    class="MuiTabs-root makeStyles-tabs-8"
                  >
                    <div
                      class="MuiTabs-scroller MuiTabs-fixed"
                      style="overflow: hidden;"
                    >
                      <div
                        class="MuiTabs-flexContainer"
                        role="tablist"
                      >
                        <button
                          aria-selected="true"
                          class="MuiButtonBase-root MuiTab-root makeStyles-tab-7 MuiTab-textColorInherit Mui-selected makeStyles-selected-9"
                          role="tab"
                          tabindex="0"
                          type="button"
                        >
                          <span
                            class="MuiTab-wrapper"
                          >
                            All
                          </span>
                          <span
                            class="MuiTouchRipple-root"
                          />
                        </button>
                        <button
                          aria-selected="false"
                          class="MuiButtonBase-root MuiTab-root makeStyles-tab-7 MuiTab-textColorInherit"
                          role="tab"
                          tabindex="0"
                          type="button"
                        >
                          <span
                            class="MuiTab-wrapper"
                          >
                            For sale
                          </span>
                          <span
                            class="MuiTouchRipple-root"
                          />
                        </button>
                      </div>
                      <span
                        class="PrivateTabIndicator-root-190 PrivateTabIndicator-colorSecondary-192 MuiTabs-indicator makeStyles-indicator-10"
                        style="left: 0px; width: 0px;"
                      />
                    </div>
                  </div>
                </div>
                <div
                  class="MuiGrid-root MuiGrid-item"
                >
                  <button
                    class="MuiButtonBase-root MuiIconButton-root makeStyles-button-199"
                    tabindex="0"
                    type="button"
                  >
                    <span
                      class="MuiIconButton-label"
                    >
                      <img
                        class="makeStyles-icon-198"
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
            class="makeStyles-wrapper-256"
          >
            <div
              class="MuiGrid-root makeStyles-root-245 MuiGrid-container MuiGrid-align-items-xs-center MuiGrid-justify-xs-space-between"
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
                      class="MuiTypography-root makeStyles-title-246 makeStyles-bold-259 MuiTypography-subtitle1 MuiTypography-noWrap"
                      style="max-width: 724px;"
                    >
                      #undefined
                    </h6>
                  </div>
                  <span>
                    <div
                      class="MuiGrid-root makeStyles-silenceDiv-260 MuiGrid-item"
                    >
                      <img
                        src="test-file-stub"
                      />
                    </div>
                  </span>
                </div>
              </div>
              <div
                class="MuiGrid-root makeStyles-actions-249 MuiGrid-container MuiGrid-item MuiGrid-align-items-xs-center MuiGrid-align-content-xs-center MuiGrid-justify-xs-flex-end MuiGrid-grid-xs-true"
              >
                <div
                  class="MuiGrid-root makeStyles-switch-250 MuiGrid-item"
                >
                  <div
                    class="MuiTabs-root makeStyles-tabs-252"
                  >
                    <div
                      class="MuiTabs-scroller MuiTabs-fixed"
                      style="overflow: hidden;"
                    >
                      <div
                        class="MuiTabs-flexContainer"
                        role="tablist"
                      >
                        <button
                          aria-selected="true"
                          class="MuiButtonBase-root MuiTab-root makeStyles-tab-251 MuiTab-textColorInherit Mui-selected makeStyles-selected-253"
                          role="tab"
                          tabindex="0"
                          type="button"
                        >
                          <span
                            class="MuiTab-wrapper"
                          >
                            All
                          </span>
                          <span
                            class="MuiTouchRipple-root"
                          />
                        </button>
                        <button
                          aria-selected="false"
                          class="MuiButtonBase-root MuiTab-root makeStyles-tab-251 MuiTab-textColorInherit"
                          role="tab"
                          tabindex="0"
                          type="button"
                        >
                          <span
                            class="MuiTab-wrapper"
                          >
                            For sale
                          </span>
                          <span
                            class="MuiTouchRipple-root"
                          />
                        </button>
                      </div>
                      <span
                        class="PrivateTabIndicator-root-434 PrivateTabIndicator-colorSecondary-436 MuiTabs-indicator makeStyles-indicator-254"
                        style="left: 0px; width: 0px;"
                      />
                    </div>
                  </div>
                </div>
                <div
                  class="MuiGrid-root MuiGrid-item"
                >
                  <button
                    class="MuiButtonBase-root MuiIconButton-root makeStyles-button-443"
                    tabindex="0"
                    type="button"
                  >
                    <span
                      class="MuiIconButton-label"
                    >
                      <img
                        class="makeStyles-icon-442"
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
            class="makeStyles-wrapper-500"
          >
            <div
              class="MuiGrid-root makeStyles-root-489 MuiGrid-container MuiGrid-align-items-xs-center MuiGrid-justify-xs-space-between"
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
                      class="MuiTypography-root makeStyles-title-490 makeStyles-bold-503 MuiTypography-subtitle1 MuiTypography-noWrap"
                      style="max-width: 724px;"
                    >
                      #undefined
                    </h6>
                  </div>
                  <span>
                    <div
                      class="MuiGrid-root makeStyles-silenceDiv-504 MuiGrid-item"
                    >
                      <img
                        src="test-file-stub"
                      />
                    </div>
                  </span>
                </div>
              </div>
              <div
                class="MuiGrid-root makeStyles-actions-493 MuiGrid-container MuiGrid-item MuiGrid-align-items-xs-center MuiGrid-align-content-xs-center MuiGrid-justify-xs-flex-end MuiGrid-grid-xs-true"
              >
                <div
                  class="MuiGrid-root makeStyles-switch-494 MuiGrid-item"
                >
                  <div
                    class="MuiTabs-root makeStyles-tabs-496"
                  >
                    <div
                      class="MuiTabs-scroller MuiTabs-fixed"
                      style="overflow: hidden;"
                    >
                      <div
                        class="MuiTabs-flexContainer"
                        role="tablist"
                      >
                        <button
                          aria-selected="true"
                          class="MuiButtonBase-root MuiTab-root makeStyles-tab-495 MuiTab-textColorInherit Mui-selected makeStyles-selected-497"
                          role="tab"
                          tabindex="0"
                          type="button"
                        >
                          <span
                            class="MuiTab-wrapper"
                          >
                            All
                          </span>
                          <span
                            class="MuiTouchRipple-root"
                          />
                        </button>
                        <button
                          aria-selected="false"
                          class="MuiButtonBase-root MuiTab-root makeStyles-tab-495 MuiTab-textColorInherit"
                          role="tab"
                          tabindex="0"
                          type="button"
                        >
                          <span
                            class="MuiTab-wrapper"
                          >
                            For sale
                          </span>
                          <span
                            class="MuiTouchRipple-root"
                          />
                        </button>
                      </div>
                      <span
                        class="PrivateTabIndicator-root-678 PrivateTabIndicator-colorSecondary-680 MuiTabs-indicator makeStyles-indicator-498"
                        style="left: 0px; width: 0px;"
                      />
                    </div>
                  </div>
                </div>
                <div
                  class="MuiGrid-root MuiGrid-item"
                >
                  <button
                    class="MuiButtonBase-root MuiIconButton-root makeStyles-button-687"
                    tabindex="0"
                    type="button"
                  >
                    <span
                      class="MuiIconButton-label"
                    >
                      <img
                        class="makeStyles-icon-686"
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
